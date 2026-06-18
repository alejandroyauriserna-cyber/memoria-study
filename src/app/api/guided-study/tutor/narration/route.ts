import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTextWithFallback } from "@/lib/ai/generate-text-with-fallback";
import { GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS, GUIDED_STUDY_NARRATION_MAGISTRAL_TIMEOUT_MS } from "@/lib/guided-study/timeouts";
import {
  buildPedagogicalSourceSummary,
  buildNarrationSystemPrompt,
  buildNarrationUserPrompt,
} from "@/lib/guided-study/tutor-voice/build-narration-prompt";
import {
  countWords,
  estimateSpeechDurationSec,
} from "@/lib/guided-study/tutor-voice/estimate-duration";
import { sanitizeNarrationScript } from "@/lib/guided-study/tutor-voice/sanitize-narration-script";
import { loadMaterialForGuidedStudy } from "@/lib/guided-study/load-material";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { PageProfessorAnalysis } from "@/types/guided-legal-study";

const analysisSchema = z.object({
  pageFocus: z.string(),
  conceptCards: z.array(
    z.object({
      id: z.string().optional(),
      concept: z.string(),
      explanation: z.string(),
      example: z.string().optional(),
      examImportance: z.string().optional(),
      peruLaw: z.string().optional(),
    }),
  ),
  keyLearning: z
    .array(z.object({ id: z.string().optional(), label: z.string() }))
    .optional()
    .default([]),
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
  comprehensionQuestion: z.string().optional(),
});

const bodySchema = z.object({
  materialId: z.string().uuid(),
  pageNumber: z.number().int().positive(),
  scopeKey: z.string().min(1),
  chapterTitle: z.string().optional(),
  narrationStyle: z.enum(["quick", "normal", "magistral"]).default("normal"),
  sessionMemoryHint: z.string().optional(),
  analysis: analysisSchema,
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

    const analysis = {
      ...body.analysis,
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

    const prompt = `${buildNarrationSystemPrompt(body.narrationStyle, body.sessionMemoryHint)}\n\n${buildNarrationUserPrompt({
      documentTitle: material.title,
      courseName: material.courseName,
      chapterTitle: body.chapterTitle,
      pageNumber: body.pageNumber,
      pedagogicalSummary,
      style: body.narrationStyle,
    })}`;

    const narrationTimeoutMs =
      body.narrationStyle === "magistral"
        ? GUIDED_STUDY_NARRATION_MAGISTRAL_TIMEOUT_MS
        : GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS;

    const { text: raw } = await generateTextWithFallback({
      prompt,
      temperature: body.narrationStyle === "magistral" ? 0.6 : 0.55,
      json: false,
      timeoutMs: narrationTimeoutMs,
    });

    const script = sanitizeNarrationScript(raw);

    if (script.length < 80) {
      return NextResponse.json(
        { error: "No se pudo generar la clase narrada." },
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
        style: body.narrationStyle,
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
