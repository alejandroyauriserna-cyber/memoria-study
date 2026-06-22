import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { env } from "@/lib/env";
import { enrichStudyDeck, studyDeckSchema } from "@/lib/ai/schema";
import { trimDeckToCounts } from "@/lib/ai/generation-counts";
import { generateLocalStudyDeck } from "@/lib/ai/local-study-generator";
import { generateWithGemini, generateWithXai } from "@/lib/ai/provider-fallbacks";
import {
  SYSTEM_PROMPT_UNT_DERECHO,
  UNT_DERECHO_AUDIENCE,
  buildStudyUserPrompt,
} from "@/lib/ai/prompts";
import type { AcademicSelection } from "@/types/academic";
import type { StudyGenerationCounts } from "@/types/generation";
import type { StudyProvider } from "@/types/study";
import type { UserAiCredentials } from "@/lib/ai/user-ai-credentials";

const providerLabels: Record<StudyProvider, { label: string; note: string }> = {
  openai: {
    label: "OpenAI",
    note: "Material jurídico generado con IA avanzada.",
  },
  openrouter: {
    label: "OpenRouter",
    note: "Material generado vía OpenRouter para Derecho UNT.",
  },
  gemini: {
    label: "Gemini",
    note: "Material generado con Gemini en español jurídico.",
  },
  xai: {
    label: "Grok / xAI",
    note: "Material generado con xAI cuando está disponible.",
  },
  local: {
    label: "Modo local",
    note: "Generado sin API pagada a partir del texto del PDF.",
  },
  ocr: {
    label: "OCR + IA",
    note: "PDF escaneado transcrito y convertido en material de estudio.",
  },
};

function withProvider<T extends object>(
  deck: T,
  provider: StudyProvider,
  ocrUsed = false,
) {
  const meta = ocrUsed ? providerLabels.ocr : providerLabels[provider];

  return {
    ...deck,
    generatedWith: {
      provider: ocrUsed ? "ocr" : provider,
      ...meta,
    },
  };
}

function academicContext(academic?: AcademicSelection) {
  if (!academic) {
    return undefined;
  }

  return {
    yearLabel: academic.yearLabel,
    cycleLabel: academic.cycleLabel,
    courseName: academic.courseName,
    weekTitle: academic.weekTitle,
  };
}

export async function generateStudyDeck(input: {
  sourceName: string;
  text: string;
  audience?: string;
  academic?: AcademicSelection;
  counts: StudyGenerationCounts;
  ocrUsed?: boolean;
  userCredentials?: UserAiCredentials;
}) {
  const providerErrors: string[] = [];
  const audience = input.audience ?? UNT_DERECHO_AUDIENCE;
  const academic = academicContext(input.academic);
  const userGeminiKey = input.userCredentials?.geminiApiKey?.trim();
  const userPrompt = buildStudyUserPrompt({
    sourceName: input.sourceName,
    text: input.text,
    audience,
    academic,
    counts: input.counts,
  });

  const wrap = (deck: ReturnType<typeof enrichStudyDeck>, provider: StudyProvider) =>
    withProvider(
      trimDeckToCounts(enrichStudyDeck(deck), input.counts),
      provider,
      input.ocrUsed,
    );

  if (userGeminiKey) {
    try {
      const deck = await generateWithGemini({
        ...input,
        audience,
        academic,
        counts: input.counts,
        apiKey: userGeminiKey,
        model: env.geminiModel,
      });

      return wrap(deck, "gemini");
    } catch (error) {
      providerErrors.push(
        `Gemini (tu clave): ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  if (env.openRouterApiKey) {
    const openrouter = new OpenAI({
      apiKey: env.openRouterApiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });

    try {
      const response = await openrouter.responses.parse({
        model: env.openRouterModel,
        input: [
          { role: "system", content: SYSTEM_PROMPT_UNT_DERECHO },
          { role: "user", content: userPrompt },
        ],
        text: {
          format: zodTextFormat(studyDeckSchema, "study_deck"),
        },
      });

      if (!response.output_parsed) {
        throw new Error("OpenRouter no devolvió un mazo válido.");
      }

      return wrap(response.output_parsed, "openrouter");
    } catch (error) {
      providerErrors.push(
        `OpenRouter: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  if (env.openAiApiKey) {
    const client = new OpenAI({ apiKey: env.openAiApiKey });

    try {
      const response = await client.responses.parse({
        model: env.openAiModel,
        input: [
          { role: "system", content: SYSTEM_PROMPT_UNT_DERECHO },
          { role: "user", content: userPrompt },
        ],
        text: {
          format: zodTextFormat(studyDeckSchema, "study_deck"),
        },
      });

      if (!response.output_parsed) {
        throw new Error("OpenAI no devolvió un mazo válido.");
      }

      return wrap(response.output_parsed, "openai");
    } catch (error) {
      providerErrors.push(
        `OpenAI: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  if (env.geminiApiKey) {
    try {
      const deck = await generateWithGemini({
        ...input,
        audience,
        academic,
        counts: input.counts,
        apiKey: env.geminiApiKey,
        model: env.geminiModel,
      });

      return wrap(deck, "gemini");
    } catch (error) {
      providerErrors.push(
        `Gemini: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  if (env.xaiApiKey) {
    try {
      const deck = await generateWithXai({
        ...input,
        audience,
        academic,
        counts: input.counts,
        apiKey: env.xaiApiKey,
        model: env.xaiModel,
      });

      return wrap(deck, "xai");
    } catch (error) {
      providerErrors.push(
        `xAI: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  console.warn("Usando generador local.", providerErrors);

  return wrap(
    generateLocalStudyDeck({ ...input, counts: input.counts }),
    "local",
  );
}
