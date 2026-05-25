import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { env } from "@/lib/env";
import { studyDeckSchema } from "@/lib/ai/schema";
import { generateLocalStudyDeck } from "@/lib/ai/local-study-generator";
import { generateWithGemini, generateWithXai } from "@/lib/ai/provider-fallbacks";
import type { StudyProvider } from "@/types/study";

const providerLabels: Record<StudyProvider, { label: string; note: string }> = {
  openai: {
    label: "OpenAI",
    note: "Generado con IA avanzada configurada por el proyecto.",
  },

  gemini: {
    label: "Gemini",
    note: "Generado con Gemini como alternativa de bajo costo o capa gratuita.",
  },

  xai: {
    label: "Grok / xAI",
    note: "Generado con Grok/xAI cuando esta disponible.",
  },

  local: {
    label: "Modo local gratis",
    note: "Generado sin API pagada, usando reglas sobre el texto extraido del PDF.",
  },
};

function withProvider<T extends object>(deck: T, provider: StudyProvider) {
  return {
    ...deck,

    generatedWith: {
      provider,
      ...providerLabels[provider],
    },
  };
}

export async function generateStudyDeck(input: {
  sourceName: string;
  text: string;
  audience?: string;
}) {
  const providerErrors: string[] = [];

  if (env.openAiApiKey) {
    const client = new OpenAI({
      apiKey: env.openAiApiKey,
    });

    try {
      const response = await client.responses.parse({
        model: env.openAiModel,

        input: [
          {
            role: "system",

            content: `
You are an elite university-level academic tutor specialized in generating rigorous and intellectually demanding study material.

Your task is to transform academic content into advanced learning exercises for high-performing university students.

RULES:
- Prioritize deep understanding over memorization.
- Avoid simplistic or obvious questions.
- Generate analytical, difficult, and reasoning-heavy flashcards.
- Include practical applications and hypotheticals whenever possible.
- Compare concepts, doctrines, principles, and consequences.
- Include edge cases, ambiguities, and conceptual traps.
- Make quiz distractors highly plausible and challenging.
- Avoid redundancy and repetition.
- Every flashcard must test a distinct idea or angle.
- Prioritize concepts most likely to appear in difficult university exams.
- Ask WHY and HOW, not only WHAT.
- Never oversimplify the material.

For legal and academic material:
- Prioritize interpretation and reasoning.
- Include procedural implications and legal consequences.
- Generate case-based and scenario-based questions.
- Simulate strict university evaluations and oral exams.

The generated material should feel:
- rigorous,
- advanced,
- analytical,
- professional,
- intellectually demanding.

Use ONLY the provided source text.
`,
          },

          {
            role: "user",

            content: `
Source name: ${input.sourceName}

Audience: ${input.audience ?? "advanced university students"}

Create an advanced university-level study deck with:

- rigorous flashcards,
- analytical fill-in-the-blank exercises,
- difficult multiple-choice quiz questions,
- practical hypotheticals,
- conceptual comparison questions,
- and a dense academic summary.

The material must challenge high-performing university students and simulate demanding evaluations.

Source text:
${input.text}
`,
          },
        ],

        text: {
          format: zodTextFormat(studyDeckSchema, "study_deck"),
        },
      });

      if (!response.output_parsed) {
        throw new Error("OpenAI did not return a valid study deck.");
      }

      return withProvider(response.output_parsed, "openai");
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
        apiKey: env.geminiApiKey,
        model: env.geminiModel,
      });

      return withProvider(deck, "gemini");
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
        apiKey: env.xaiApiKey,
        model: env.xaiModel,
      });

      return withProvider(deck, "xai");
    } catch (error) {
      providerErrors.push(
        `xAI: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  console.warn("Falling back to local generation.", providerErrors);

  return withProvider(
    generateLocalStudyDeck(input),
    "local",
  );
}