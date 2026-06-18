import type { ConceptDifficulty, GuidedStudySession } from "@/types/guided-legal-study";

export function recordConceptDifficulty(
  session: GuidedStudySession,
  concept: string,
  pageNumber: number,
  score: number,
): GuidedStudySession {
  if (!concept.trim() || score >= 65) return session;

  const list = [...(session.difficultConcepts ?? [])];
  const key = concept.toLowerCase();
  const idx = list.findIndex((d) => d.concept.toLowerCase() === key);

  const entry: ConceptDifficulty = {
    concept: concept.trim(),
    pageNumber,
    score,
    lastAttemptAt: new Date().toISOString(),
    attemptCount: 1,
  };

  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      score: Math.min(list[idx].score, score),
      lastAttemptAt: entry.lastAttemptAt,
      attemptCount: list[idx].attemptCount + 1,
      pageNumber,
    };
  } else {
    list.push(entry);
  }

  return {
    ...session,
    difficultConcepts: list
      .sort((a, b) => a.score - b.score)
      .slice(0, 12),
    lastUpdated: new Date().toISOString(),
  };
}

export function getContinuityGreeting(
  session: GuidedStudySession | null,
): { message: string; concept: string; pageNumber: number } | null {
  if (!session?.difficultConcepts?.length) return null;

  const hardest = session.difficultConcepts[0];
  if (!hardest || hardest.score >= 60) return null;

  const lastEnded = session.lastSessionEndedAt
    ? new Date(session.lastSessionEndedAt)
    : null;
  const hoursSince =
    lastEnded && !Number.isNaN(lastEnded.getTime())
      ? (Date.now() - lastEnded.getTime()) / 3_600_000
      : 24;

  if (hoursSince < 0.5) return null;

  return {
    concept: hardest.concept,
    pageNumber: hardest.pageNumber,
    message:
      hoursSince >= 20
        ? `En tu última sesión tuviste dificultad con «${hardest.concept}». ¿Quieres repasarla antes de continuar?`
        : `Recuerda: «${hardest.concept}» fue un punto débil reciente. ¿Repasamos antes de seguir?`,
  };
}

export function markSessionEnded(session: GuidedStudySession): GuidedStudySession {
  return {
    ...session,
    lastSessionEndedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}
