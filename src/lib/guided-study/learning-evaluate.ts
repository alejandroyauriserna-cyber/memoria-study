import { z } from "zod";
import { generateTextWithFallback } from "@/lib/ai/generate-text-with-fallback";
import { GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS } from "@/lib/guided-study/timeouts";
import type { FeynmanEvaluation } from "@/types/guided-legal-study";

const FeynmanEvalSchema = z.object({
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  masteryLevel: z.enum(["bajo", "medio", "alto"]).default("medio"),
  masteryScore: z.number().min(0).max(100).default(50),
  summary: z.string().default(""),
});

const RetrievalEvalSchema = z.object({
  score: z.number().min(0).max(100).default(50),
  feedback: z.string().default(""),
  keyPointsMentioned: z.array(z.string()).default([]),
  missingPoints: z.array(z.string()).default([]),
});

export async function evaluateFeynmanExplanation(input: {
  concept: string;
  audiencePrompt: string;
  studentExplanation: string;
  referenceContext: string;
}): Promise<FeynmanEvaluation> {
  const prompt = `Eres evaluador pedagógico de Derecho (método Feynman).
Evalúa si el estudiante explicó el concepto con sus palabras.

CONCEPTO: ${input.concept}
AUDIENCIA: ${input.audiencePrompt}
CONTEXTO DE REFERENCIA (no copies literalmente al estudiante):
${input.referenceContext.slice(0, 4000)}

EXPLICACIÓN DEL ESTUDIANTE:
${input.studentExplanation}

Responde SOLO JSON:
{
  "strengths": ["qué explicó bien"],
  "gaps": ["qué faltó mencionar"],
  "masteryLevel": "bajo|medio|alto",
  "masteryScore": 0-100,
  "summary": "una frase de cierre motivadora"
}`;

  const { text: raw } = await generateTextWithFallback({
    prompt,
    temperature: 0.2,
    json: true,
    timeoutMs: GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS,
  });

  const parsed = FeynmanEvalSchema.parse(JSON.parse(raw));
  return parsed;
}

export async function evaluateRetrievalAnswer(input: {
  question: string;
  studentAnswer: string;
  referenceContext: string;
}): Promise<{ score: number; feedback: string; keyPointsMentioned: string[]; missingPoints: string[] }> {
  const prompt = `Evalúa una respuesta de recuperación activa en Derecho peruano.
No copies el material; compara comprensión.

PREGUNTA: ${input.question}
CONTEXTO DE REFERENCIA:
${input.referenceContext.slice(0, 3500)}
RESPUESTA DEL ESTUDIANTE:
${input.studentAnswer}

JSON:
{
  "score": 0-100,
  "feedback": "retroalimentación breve y útil",
  "keyPointsMentioned": ["..."],
  "missingPoints": ["..."]
}`;

  const { text: raw } = await generateTextWithFallback({
    prompt,
    temperature: 0.2,
    json: true,
    timeoutMs: GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS,
  });

  return RetrievalEvalSchema.parse(JSON.parse(raw));
}

export async function evaluateApplyConceptAnswer(input: {
  prompt: string;
  scenario: string;
  modelAnswer: string;
  studentAnswer: string;
}): Promise<{ score: number; feedback: string }> {
  const prompt = `Evalúa aplicación jurídica breve.

CASO: ${input.scenario}
PREGUNTA: ${input.prompt}
RESPUESTA MODELO: ${input.modelAnswer}
RESPUESTA ESTUDIANTE: ${input.studentAnswer}

JSON: {"score":0-100,"feedback":"..."}`;

  const { text: raw } = await generateTextWithFallback({
    prompt,
    temperature: 0.2,
    json: true,
    timeoutMs: GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS,
  });

  const parsed = z.object({ score: z.number(), feedback: z.string() }).parse(JSON.parse(raw));
  return parsed;
}

const OralDefenseEvalSchema = z.object({
  score: z.number().min(0).max(100).default(50),
  correctConcepts: z.array(z.string()).default([]),
  omittedConcepts: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
  feedback: z.string().default(""),
  followUpQuestion: z.string().nullable().default(null),
});

export async function evaluateOralDefenseAnswer(input: {
  question: string;
  gradingPoints: string[];
  studentAnswer: string;
  referenceContext: string;
  professorStyle?: string;
}): Promise<{
  score: number;
  correctConcepts: string[];
  omittedConcepts: string[];
  errors: string[];
  feedback: string;
  followUpQuestion: string | null;
}> {
  const prompt = `Eres docente universitario de Derecho peruano evaluando una DEFENSA ORAL.
${input.professorStyle ? `Estilo: ${input.professorStyle}` : ""}

PREGUNTA DEL PROFESOR: ${input.question}
CRITERIOS DE EVALUACIÓN: ${input.gradingPoints.join("; ")}
CONTEXTO DE REFERENCIA:
${input.referenceContext.slice(0, 4000)}

RESPUESTA ORAL DEL ESTUDIANTE:
${input.studentAnswer}

Evalúa como en un examen oral real. JSON:
{
  "score": 0-100,
  "correctConcepts": ["conceptos o puntos bien expresados"],
  "omittedConcepts": ["conceptos omitidos que debía mencionar"],
  "errors": ["errores jurídicos detectados"],
  "feedback": "retroalimentación breve del profesor (2-3 oraciones, tono oral)",
  "followUpQuestion": "repregunta del profesor si la respuesta fue incompleta o errónea; null si dominó el tema"
}`;

  const { text: raw } = await generateTextWithFallback({
    prompt,
    temperature: 0.25,
    json: true,
    timeoutMs: GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS,
  });

  return OralDefenseEvalSchema.parse(JSON.parse(raw));
}
