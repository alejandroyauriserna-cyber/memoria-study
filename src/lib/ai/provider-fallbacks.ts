import { studyDeckSchema, type StudyDeckOutput } from "@/lib/ai/schema";
import { buildProviderJsonPrompt } from "@/lib/ai/prompts";
import type { StudyGenerationCounts } from "@/types/generation";

function parseJsonDeck(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("El proveedor no devolvió JSON.");
  }

  return studyDeckSchema.parse(JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)));
}

export async function generateWithGemini(input: {
  sourceName: string;
  text: string;
  audience?: string;
  counts: StudyGenerationCounts;
  academic?: {
    yearLabel: string;
    cycleLabel: string;
    courseName: string;
    weekTitle: string;
  };
  apiKey: string;
  model: string;
}): Promise<StudyDeckOutput> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildProviderJsonPrompt(input) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.25,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini falló (${response.status}): ${await response.text()}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    throw new Error("Gemini devolvió una respuesta vacía.");
  }

  return parseJsonDeck(text);
}

export async function generateWithXai(input: {
  sourceName: string;
  text: string;
  audience?: string;
  counts: StudyGenerationCounts;
  academic?: {
    yearLabel: string;
    cycleLabel: string;
    courseName: string;
    weekTitle: string;
  };
  apiKey: string;
  model: string;
}): Promise<StudyDeckOutput> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Generador de material jurídico UNT. Devuelve solo JSON válido en español.",
        },
        { role: "user", content: buildProviderJsonPrompt(input) },
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

  return parseJsonDeck(text);
}
