import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTextWithFallback } from "@/lib/ai/generate-text-with-fallback";
import { GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS } from "@/lib/guided-study/timeouts";
import {
  buildMicroActionSystemPrompt,
  buildMicroActionUserPrompt,
} from "@/lib/guided-study/tutor-voice/build-microaction-prompt";
import { buildPedagogicalSourceSummary } from "@/lib/guided-study/tutor-voice/build-narration-prompt";
import { sanitizeNarrationScript } from "@/lib/guided-study/tutor-voice/sanitize-narration-script";
import { countWords, estimateSpeechDurationSec } from "@/lib/guided-study/tutor-voice/estimate-duration";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { PageProfessorAnalysis } from "@/types/guided-legal-study";

const bodySchema = z.object({
  action: z.enum(["example", "simpler", "casacion", "exam", "repeat_main"]),
  pageFocus: z.string(),
  primaryConcept: z.string().optional(),
  analysis: z.object({
    pageFocus: z.string(),
    conceptCards: z.array(
      z.object({
        concept: z.string(),
        explanation: z.string(),
        example: z.string().optional(),
        examImportance: z.string().optional(),
        peruLaw: z.string().optional(),
      }),
    ),
    keyLearning: z.array(z.object({ label: z.string() })).optional().default([]),
    secondaryMentions: z
      .array(z.object({ mention: z.string(), briefNote: z.string() }))
      .optional()
      .default([]),
    examMode: z
      .object({
        memorableConcepts: z.array(z.string()).optional().default([]),
        commonErrors: z.array(z.string()).optional().default([]),
        oral: z.array(z.object({ question: z.string() })).optional().default([]),
      })
      .optional()
      .default({ memorableConcepts: [], commonErrors: [], oral: [] }),
    citations: z
      .array(
        z.object({
          norm: z.string(),
          article: z.string(),
          text: z.string(),
          fragment: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
  }),
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());

    const analysis = {
      pageFocus: body.analysis.pageFocus,
      keyLearning: body.analysis.keyLearning.map((k, i) => ({
        id: `kl-${i}`,
        label: k.label,
      })),
      conceptCards: body.analysis.conceptCards.map((c, i) => ({
        id: `cc-${i}`,
        concept: c.concept,
        explanation: c.explanation,
        example: c.example ?? "",
        examImportance: c.examImportance ?? "",
        peruLaw: c.peruLaw,
      })),
      secondaryMentions: body.analysis.secondaryMentions,
      highlights: [],
      examMode: {
        desarrollo: [],
        test: [],
        memorableConcepts: body.analysis.examMode.memorableConcepts,
        commonErrors: body.analysis.examMode.commonErrors,
        oral: body.analysis.examMode.oral.map((o) => ({
          question: o.question,
          gradingPoints: [],
        })),
      },
      citations: body.analysis.citations.map((c) => ({
        ...c,
        updatedAt: "",
      })),
    } as PageProfessorAnalysis;

    const pedagogicalSummary = buildPedagogicalSourceSummary(analysis);
    const primaryConcept =
      body.primaryConcept ?? body.analysis.conceptCards[0]?.concept ?? body.pageFocus;

    const prompt = `${buildMicroActionSystemPrompt()}\n\n${buildMicroActionUserPrompt({
      action: body.action,
      pageFocus: body.pageFocus,
      pedagogicalSummary,
      primaryConcept,
    })}`;

    const { text: raw } = await generateTextWithFallback({
      prompt,
      temperature: 0.5,
      json: false,
      timeoutMs: Math.min(GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS, 45_000),
    });

    const reply = sanitizeNarrationScript(raw);
    if (reply.length < 20) {
      return NextResponse.json(
        { error: "No se pudo generar la respuesta." },
        { status: 500 },
      );
    }

    const wordCount = countWords(reply);

    return NextResponse.json({
      reply,
      wordCount,
      estimatedDurationSec: estimateSpeechDurationSec(wordCount, 1),
    });
  } catch (error) {
    console.error("[guided-study/tutor/narration/microaction]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en microacción." },
      { status: 500 },
    );
  }
}
