import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { ZodError } from "zod";
import { env, hasOpenAiEnv } from "@/lib/env";
import {
  SYSTEM_PROMPT_ORGANIZER,
  buildOrganizerProviderJsonPrompt,
  buildOrganizerUserPrompt,
} from "@/lib/ai/organizer-prompts";
import {
  MissingSummaryError,
  assertOrganizerHasContent,
  normalizeOrganizerContent,
  organizerContentSchema,
  parseOrganizerContent,
  type StoredOrganizerContent,
} from "@/lib/ai/organizer-schema";

const MAX_SUMMARY_ATTEMPTS = 3;

export class OrganizerGenerationError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string) {
    super(userMessage);
    this.name = "OrganizerGenerationError";
    this.userMessage = userMessage;
  }
}

const USER_FRIENDLY_ERROR =
  "No pudimos generar el organizador con IA en este momento. Por favor, inténtalo de nuevo en unos minutos.";

function parseOrganizerJson(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("El proveedor no devolvió JSON válido.");
  }

  return parseOrganizerContent(JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)));
}

function isMissingSummaryError(error: unknown) {
  if (error instanceof MissingSummaryError) {
    return true;
  }

  if (error instanceof ZodError) {
    return error.issues.some((issue) => issue.path[0] === "summary");
  }

  return false;
}

function logProviderFailure(provider: string, error: unknown) {
  console.error(
    `[organizer-ai] ${provider} failed:`,
    error instanceof Error ? error.message : error,
  );
}

function finalizeOrganizer(content: ReturnType<typeof parseOrganizerContent>): StoredOrganizerContent {
  const normalized = normalizeOrganizerContent(content);
  assertOrganizerHasContent(normalized);
  return normalized;
}

async function generateWithSummaryRetries(
  generate: () => Promise<ReturnType<typeof parseOrganizerContent>>,
): Promise<StoredOrganizerContent> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_SUMMARY_ATTEMPTS; attempt++) {
    try {
      return finalizeOrganizer(await generate());
    } catch (error) {
      if (!isMissingSummaryError(error)) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error("Summary inválido.");
    }
  }

  throw (
    lastError ??
    new Error("El modelo no devolvió un resumen (summary) válido tras varios intentos.")
  );
}

async function fetchGeminiOrganizer(input: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: input.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Gemini falló (${response.status}): ${JSON.stringify(payload)}`);
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Gemini devolvió una respuesta vacía.");
  }

  return parseOrganizerJson(text);
}

async function fetchXaiOrganizer(input: { apiKey: string; model: string; prompt: string }) {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT_ORGANIZER },
        { role: "user", content: input.prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`xAI falló (${response.status}): ${await response.text()}`);
  }

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;

  if (typeof text !== "string") {
    throw new Error("xAI devolvió una respuesta vacía.");
  }

  return parseOrganizerJson(text);
}

async function tryOpenRouterOrganizer(userPrompt: string) {
  const openrouter = new OpenAI({
    apiKey: env.openRouterApiKey!,
    baseURL: "https://openrouter.ai/api/v1",
  });

  return generateWithSummaryRetries(async () => {
    const response = await openrouter.responses.parse({
      model: env.openRouterModel,
      input: [
        { role: "system", content: SYSTEM_PROMPT_ORGANIZER },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: zodTextFormat(organizerContentSchema, "organizer_content"),
      },
    });

    if (!response.output_parsed) {
      throw new MissingSummaryError();
    }

    return parseOrganizerContent(response.output_parsed);
  });
}

async function tryOpenAiOrganizer(userPrompt: string) {
  const client = new OpenAI({ apiKey: env.openAiApiKey! });

  return generateWithSummaryRetries(async () => {
    const response = await client.responses.parse({
      model: env.openAiModel,
      input: [
        { role: "system", content: SYSTEM_PROMPT_ORGANIZER },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: zodTextFormat(organizerContentSchema, "organizer_content"),
      },
    });

    if (!response.output_parsed) {
      throw new MissingSummaryError();
    }

    return parseOrganizerContent(response.output_parsed);
  });
}

export async function generateOrganizerContent(input: {
  sourceName: string;
  text: string;
  materialTitle: string;
}): Promise<StoredOrganizerContent> {
  if (!hasOpenAiEnv()) {
    throw new OrganizerGenerationError(
      "El servicio de IA no está disponible en este momento. Inténtalo más tarde.",
    );
  }

  const userPrompt = buildOrganizerUserPrompt(input);
  const providerPrompt = buildOrganizerProviderJsonPrompt(input);

  const providers: Array<{ name: string; run: () => Promise<StoredOrganizerContent> }> = [];

  if (env.openRouterApiKey) {
    providers.push({ name: "OpenRouter", run: () => tryOpenRouterOrganizer(userPrompt) });
  }

  if (env.openAiApiKey) {
    providers.push({ name: "OpenAI", run: () => tryOpenAiOrganizer(userPrompt) });
  }

  if (env.geminiApiKey) {
    providers.push({
      name: "Gemini",
      run: () =>
        generateWithSummaryRetries(() =>
          fetchGeminiOrganizer({
            apiKey: env.geminiApiKey!,
            model: env.geminiModel,
            prompt: providerPrompt,
          }),
        ),
    });
  }

  if (env.xaiApiKey) {
    providers.push({
      name: "xAI",
      run: () =>
        generateWithSummaryRetries(() =>
          fetchXaiOrganizer({
            apiKey: env.xaiApiKey!,
            model: env.xaiModel,
            prompt: providerPrompt,
          }),
        ),
    });
  }

  for (const provider of providers) {
    try {
      return await provider.run();
    } catch (error) {
      logProviderFailure(provider.name, error);
    }
  }

  throw new OrganizerGenerationError(USER_FRIENDLY_ERROR);
}
