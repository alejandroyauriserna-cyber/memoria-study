import type {
  GuidedStudyMastery,
  GuidedStudySession,
  LearningActivityResult,
  LearningActivityType,
  PageLearningStatus,
} from "@/types/guided-legal-study";

const EMPTY_MASTERY: GuidedStudyMastery = {
  conceptsApplied: 0,
  retrievalAnswered: 0,
  casesSolved: 0,
  feynmanCompleted: 0,
  surpriseAnswered: 0,
  totalScore: 0,
  activityCount: 0,
};

function pageKey(pageNumber: number) {
  return String(pageNumber);
}

export function getPageLearningStatus(
  session: GuidedStudySession | null,
  pageNumber: number,
): PageLearningStatus {
  return session?.pageLearningStatus?.[pageKey(pageNumber)] ?? {};
}

export function isApplyConceptComplete(
  session: GuidedStudySession | null,
  pageNumber: number,
): boolean {
  return Boolean(getPageLearningStatus(session, pageNumber).applyDone);
}

export function canMarkPageUnderstood(
  session: GuidedStudySession | null,
  pageNumber: number,
  hasActiveLearning: boolean,
): boolean {
  if (!hasActiveLearning) return true;
  return isApplyConceptComplete(session, pageNumber);
}

export function shouldShowSurpriseOnPageEnter(
  session: GuidedStudySession | null,
  newPage: number,
): boolean {
  if (newPage < 2) return false;
  const last = session?.lastSurprisePage ?? 0;
  const delta = newPage - last;
  return delta >= 2 && delta <= 3;
}

export function recordLearningActivity(
  session: GuidedStudySession,
  activity: LearningActivityResult,
  pagePatch?: Partial<PageLearningStatus>,
): GuidedStudySession {
  const mastery = { ...(session.mastery ?? EMPTY_MASTERY) };
  mastery.activityCount += 1;
  mastery.totalScore += activity.score;

  switch (activity.type) {
    case "apply_concept":
      mastery.casesSolved += 1;
      mastery.conceptsApplied += 1;
      break;
    case "retrieval":
      mastery.retrievalAnswered += 1;
      break;
    case "feynman":
      mastery.feynmanCompleted += 1;
      break;
    case "surprise":
      mastery.surpriseAnswered += 1;
      break;
    case "oral_defense":
      mastery.conceptsApplied += 1;
      break;
    default:
      break;
  }

  const pageLearningStatus = { ...(session.pageLearningStatus ?? {}) };
  const key = pageKey(activity.pageNumber);
  pageLearningStatus[key] = {
    ...(pageLearningStatus[key] ?? {}),
    ...pagePatch,
  };

  return {
    ...session,
    learningActivities: [...(session.learningActivities ?? []), activity],
    mastery,
    pageLearningStatus,
    lastUpdated: new Date().toISOString(),
  };
}

export function computeMasteryPercent(mastery: GuidedStudyMastery | undefined): number {
  if (!mastery || mastery.activityCount === 0) return 0;
  const avg = mastery.totalScore / mastery.activityCount;
  const volumeBoost = Math.min(12, mastery.activityCount * 1.5);
  return Math.min(100, Math.round(avg * 0.88 + volumeBoost));
}

export function formatMasteryLabel(percent: number): string {
  if (percent >= 85) return "Dominio alto";
  if (percent >= 65) return "Comprensión sólida";
  if (percent >= 40) return "En construcción";
  return "Inicio de práctica";
}

export function activityTypeLabel(type: LearningActivityType): string {
  switch (type) {
    case "apply_concept":
      return "Caso aplicado";
    case "retrieval":
      return "Recuperación activa";
    case "feynman":
      return "Explicación propia";
    case "surprise":
      return "Pregunta rápida";
    case "oral_defense":
      return "Defensa oral";
    default:
      return "Actividad";
  }
}
