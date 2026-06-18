import { NextResponse } from "next/server";
import { z } from "zod";
import {
  evaluateApplyConceptAnswer,
  evaluateFeynmanExplanation,
  evaluateOralDefenseAnswer,
  evaluateRetrievalAnswer,
} from "@/lib/guided-study/learning-evaluate";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

const bodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("feynman"),
    concept: z.string().min(1),
    audiencePrompt: z.string().min(1),
    studentExplanation: z.string().min(8),
    referenceContext: z.string().default(""),
  }),
  z.object({
    type: z.literal("retrieval"),
    question: z.string().min(1),
    studentAnswer: z.string().min(4),
    referenceContext: z.string().default(""),
  }),
  z.object({
    type: z.literal("apply_concept"),
    prompt: z.string().min(1),
    scenario: z.string().min(1),
    modelAnswer: z.string().min(1),
    studentAnswer: z.string().min(4),
  }),
  z.object({
    type: z.literal("oral_defense"),
    question: z.string().min(1),
    gradingPoints: z.array(z.string()).min(1),
    studentAnswer: z.string().min(4),
    referenceContext: z.string().default(""),
    professorStyle: z.string().optional(),
  }),
]);

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

    if (body.type === "feynman") {
      const evaluation = await evaluateFeynmanExplanation(body);
      return NextResponse.json({ evaluation });
    }

    if (body.type === "retrieval") {
      const result = await evaluateRetrievalAnswer(body);
      return NextResponse.json({ result });
    }

    if (body.type === "oral_defense") {
      const evaluation = await evaluateOralDefenseAnswer(body);
      return NextResponse.json({ evaluation });
    }

    const result = await evaluateApplyConceptAnswer(body);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[guided-study/learning/evaluate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo evaluar la respuesta." },
      { status: 500 },
    );
  }
}
