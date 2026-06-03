import { generateGeminiText } from "@/lib/ai/gemini-text";
import { env } from "@/lib/env";

export async function extractCuadernoConcepts(notes: string, courseName: string): Promise<string[]> {
  const trimmed = notes.trim();
  if (!trimmed) return [];

  const prompt = `Analiza estos apuntes de ${courseName} (Derecho UNT, Perú).
Extrae conceptos jurídicos, artículos, autores, jurisprudencia y términos importantes.

APUNTES:
${trimmed.slice(0, 8000)}

Devuelve SOLO JSON:
{ "concepts": ["Acto Jurídico", "Buena Fe", "Art. 1440 CC", ...] }

Máximo 16 conceptos. Sin duplicados. Sin emojis.`;

  if (!env.geminiApiKey) {
    return heuristicConcepts(trimmed);
  }

  try {
    const raw = await generateGeminiText({ prompt, temperature: 0.2, json: true });

    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { concepts?: string[] };
    const list = (parsed.concepts ?? []).map((c) => c.trim()).filter(Boolean);
    return [...new Set(list)].slice(0, 16);
  } catch {
    return heuristicConcepts(trimmed);
  }
}

function heuristicConcepts(notes: string): string[] {
  const matches = notes.match(
    /(?:Art\.?\s*\d+|artículo\s+\d+|[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/g,
  );
  return [...new Set(matches ?? [])].slice(0, 10);
}
