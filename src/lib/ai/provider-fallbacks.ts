import { studyDeckSchema, type StudyDeckOutput } from "@/lib/ai/schema";

function studyPrompt(input: {
  sourceName: string;
  text: string;
  audience?: string;
}) {
  return `Eres un generador de material de estudio para estudiantes universitarios. Crea material preciso usando SOLO el texto fuente.

Devuelve solo JSON valido con esta forma exacta:
{
  "title": "string",
  "sourceName": "string",
  "summary": "string",
  "difficulty": "easy|medium|hard",
  "estimatedMinutes": 20,
  "flashcards": [{"id":"card_1","front":"string","back":"string","hint":"string","tags":["string"]}],
  "fillBlanks": [{"id":"blank_1","sentence":"string with _____","answer":"string","explanation":"string"}],
  "quiz": [{"id":"quiz_1","question":"string","options":["A","B","C","D"],"answerIndex":0,"explanation":"string"}]
}

Requisitos:
- Usa espanol claro si el texto fuente esta en espanol.
- Genera de 6 a 12 flashcards.
- Genera de 4 a 8 ejercicios de completar espacios.
- Genera de 5 a 10 preguntas de quiz.
- Todas las respuestas deben estar sustentadas en el texto.
- Evita inventar datos externos.

Nombre del archivo: ${input.sourceName}
Audiencia: ${input.audience ?? "estudiantes universitarios"}

Texto fuente:
${input.text}`;
}

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
    throw new Error("Provider did not return JSON.");
  }

  return studyDeckSchema.parse(JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)));
}

export async function generateWithGemini(input: {
  sourceName: string;
  text: string;
  audience?: string;
  apiKey: string;
  model: string;
}): Promise<StudyDeckOutput> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: studyPrompt(input) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.25,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini failed with ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    throw new Error("Gemini returned an empty response.");
  }

  return parseJsonDeck(text);
}

export async function generateWithXai(input: {
  sourceName: string;
  text: string;
  audience?: string;
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
            "You are a study material generator. Return valid JSON only and use only the provided source.",
        },
        { role: "user", content: studyPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`xAI failed with ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;

  if (typeof text !== "string") {
    throw new Error("xAI returned an empty response.");
  }

  return parseJsonDeck(text);
}
