import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTextWithFallback } from "@/lib/ai/generate-text-with-fallback";
import { GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS } from "@/lib/guided-study/timeouts";
import {
  buildNarrationSourceSummary,
  buildNarrationSystemPrompt,
  buildNarrationUserPrompt,
} from "@/lib/guided-study/tutor-voice/build-narration-prompt";
import {
  countWords,
  estimateSpeechDurationSec,
} from "@/lib/guided-study/tutor-voice/estimate-duration";
import { loadMaterialForGuidedStudy } from "@/lib/guided-study/load-material";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { PageProfessorAnalysis } from "@/types/guided-legal-study";

const bodySchema = z.object({
  materialId: z.string().uuid(),
  pageNumber: z.number().int().positive(),
  scopeKey: z.string().min(1),
  chapterTitle: z.string().optional(),
  analysis: z.object({
    pageFocus: z.string(),
    conceptCards: z.array(
      z.object({
        concept: z.string(),
        explanation: z.string(),
        example: z.string().optional(),
      }),
    ),
    keyLearning: z
      .array(z.object({ label: z.string() }))
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
    const material = await loadMaterialForGuidedStudy(body.materialId, user.id);

    const analysis = body.analysis as Pick<
      PageProfessorAnalysis,
      "pageFocus" | "conceptCards" | "keyLearning"
    >;

    const summary = buildNarrationSourceSummary({
      ...analysis,
      secondaryMentions: [],
      highlights: [],
      examMode: {
        oral: [],
        desarrollo: [],
        test: [],
        memorableConcepts: [],
        commonErrors: [],
      },
      citations: [],
    } as PageProfessorAnalysis);

    const prompt = `${buildNarrationSystemPrompt()}\n\n${buildNarrationUserPrompt({
      documentTitle: material.title,
      courseName: material.courseName,
      chapterTitle: body.chapterTitle,
      pageNumber: body.pageNumber,
      contentSummary: summary,
    })}`;

    const { text: raw } = await generateTextWithFallback({
      prompt,
      temperature: 0.55,
      json: false,
      timeoutMs: GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS,
    });

    const script = raw
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/gm, "")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/\.{2,}/g, ".")
      .replace(/…/g, ".")
      .replace(/\s+([,.;:!?])/g, "$1");

    if (script.length < 80) {
      return NextResponse.json(
        { error: "No se pudo generar el guion narrado." },
        { status: 500 },
      );
    }

    const wordCount = countWords(script);
    const estimatedDurationSec = estimateSpeechDurationSec(wordCount, 1);

    return NextResponse.json({
      narration: {
        script,
        wordCount,
        estimatedDurationSec,
        generatedAt: new Date().toISOString(),
      },
      scopeKey: body.scopeKey,
    });
  } catch (error) {
    console.error("[guided-study/tutor/narration]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar narración." },
      { status: 500 },
    );
  }
}
