import type { ProfessionalStage, ProfessionalStageId } from "@/types/micro-study";

export const PROFESSIONAL_STAGES: ProfessionalStage[] = [
  { id: "estudiante", label: "Estudiante", emoji: "📚", minActivityScore: 0 },
  { id: "practicante", label: "Practicante", emoji: "⚖️", minActivityScore: 15 },
  { id: "asistente", label: "Asistente Legal", emoji: "🏛️", minActivityScore: 40 },
  { id: "abogado-junior", label: "Abogado Junior", emoji: "👨‍⚖️", minActivityScore: 80 },
  { id: "abogado-senior", label: "Abogado Senior", emoji: "👨‍⚖️", minActivityScore: 150 },
  { id: "jurista", label: "Jurista", emoji: "🏆", minActivityScore: 250 },
];

export function computeActivityScore(input: {
  pagesUnderstood: number;
  microSessionsCompleted: number;
  conceptsReviewed: number;
  sentenciasRead: number;
  studyStreakDays: number;
}): number {
  return (
    input.pagesUnderstood * 2 +
    input.microSessionsCompleted * 8 +
    input.conceptsReviewed * 3 +
    input.sentenciasRead * 5 +
    input.studyStreakDays * 4
  );
}

export function resolveProfessionalStage(score: number): {
  current: ProfessionalStage;
  next: ProfessionalStage | null;
  progressToNext: number;
} {
  let current = PROFESSIONAL_STAGES[0]!;
  let next: ProfessionalStage | null = PROFESSIONAL_STAGES[1] ?? null;

  for (let i = PROFESSIONAL_STAGES.length - 1; i >= 0; i -= 1) {
    const stage = PROFESSIONAL_STAGES[i]!;
    if (score >= stage.minActivityScore) {
      current = stage;
      next = PROFESSIONAL_STAGES[i + 1] ?? null;
      break;
    }
  }

  let progressToNext = 100;
  if (next) {
    const range = next.minActivityScore - current.minActivityScore;
    const earned = score - current.minActivityScore;
    progressToNext = range > 0 ? Math.min(100, Math.round((earned / range) * 100)) : 100;
  }

  return { current, next, progressToNext };
}

export function stageLabel(id: ProfessionalStageId): string {
  return PROFESSIONAL_STAGES.find((s) => s.id === id)?.label ?? "Estudiante";
}
