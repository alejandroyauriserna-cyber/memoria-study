import { GUIDED_STUDY_ANALYSIS_VERSION } from "@/lib/guided-study/analysis-version";
import { advanceCaseNarrative } from "@/lib/guided-study/case-narrative";
import { recordConceptDifficulty } from "@/lib/guided-study/session-continuity";
import { scheduleSpacedReview } from "@/lib/guided-study/spaced-repetition";
import { persistGuidedStudySession } from "@/lib/guided-study/progress-sync";
import { recordLearningActivity } from "@/lib/guided-study/learning-mastery";
import type {
  ApplyConceptCase,
  GuidedStudySession,
  LearningActivityResult,
  PageLearningStatus,
} from "@/types/guided-legal-study";

const PREFIX = "memoria-guided-legal-study:";

export function loadGuidedStudySession(materialId: string): GuidedStudySession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(`${PREFIX}${materialId}`);
    if (!raw) return null;
    return JSON.parse(raw) as GuidedStudySession;
  } catch {
    return null;
  }
}

export function saveGuidedStudySession(session: GuidedStudySession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${PREFIX}${session.materialId}`, JSON.stringify(session));
}

export function markPageUnderstood(materialId: string, pageNumber: number) {
  const existing = loadGuidedStudySession(materialId);
  const session: GuidedStudySession = existing ?? {
    materialId,
    currentPage: pageNumber,
    understoodPages: [],
    analysisVersion: GUIDED_STUDY_ANALYSIS_VERSION,
    lastUpdated: new Date().toISOString(),
  };

  if (!session.understoodPages.includes(pageNumber)) {
    session.understoodPages.push(pageNumber);
    session.understoodPages.sort((a, b) => a - b);
  }

  session.currentPage = pageNumber;
  session.analysisVersion = session.analysisVersion ?? GUIDED_STUDY_ANALYSIS_VERSION;
  session.lastUpdated = new Date().toISOString();
  void persistGuidedStudySession(session);
  return session;
}

export function updateCurrentPage(materialId: string, pageNumber: number) {
  const existing = loadGuidedStudySession(materialId);
  const session: GuidedStudySession = existing ?? {
    materialId,
    currentPage: pageNumber,
    understoodPages: [],
    analysisVersion: GUIDED_STUDY_ANALYSIS_VERSION,
    lastUpdated: new Date().toISOString(),
  };

  session.currentPage = pageNumber;
  session.analysisVersion = session.analysisVersion ?? GUIDED_STUDY_ANALYSIS_VERSION;
  session.lastUpdated = new Date().toISOString();
  void persistGuidedStudySession(session);
  return session;
}

export function getStudyProgressPercent(session: GuidedStudySession, totalPages: number) {
  if (totalPages <= 0) return 0;
  return Math.round((session.understoodPages.length / totalPages) * 100);
}

export function patchPageLearningStatus(
  materialId: string,
  pageNumber: number,
  patch: Partial<PageLearningStatus>,
): GuidedStudySession {
  const existing = loadGuidedStudySession(materialId);
  const session: GuidedStudySession = existing ?? {
    materialId,
    currentPage: pageNumber,
    understoodPages: [],
    analysisVersion: GUIDED_STUDY_ANALYSIS_VERSION,
    lastUpdated: new Date().toISOString(),
  };

  const key = String(pageNumber);
  session.pageLearningStatus = {
    ...(session.pageLearningStatus ?? {}),
    [key]: {
      ...(session.pageLearningStatus?.[key] ?? {}),
      ...patch,
    },
  };
  session.lastUpdated = new Date().toISOString();
  saveGuidedStudySession(session);
  void persistGuidedStudySession(session);
  return session;
}

export function appendLearningActivity(
  materialId: string,
  activity: LearningActivityResult,
  pagePatch?: Partial<PageLearningStatus>,
  options?: { narrativeCase?: ApplyConceptCase },
): GuidedStudySession {
  const existing = loadGuidedStudySession(materialId);
  const session: GuidedStudySession = existing ?? {
    materialId,
    currentPage: activity.pageNumber,
    understoodPages: [],
    analysisVersion: GUIDED_STUDY_ANALYSIS_VERSION,
    lastUpdated: new Date().toISOString(),
  };

  let updated = recordLearningActivity(session, activity, pagePatch);

  if (activity.concept) {
    updated = recordConceptDifficulty(
      updated,
      activity.concept,
      activity.pageNumber,
      activity.score,
    );
    updated = scheduleSpacedReview(
      updated,
      activity.concept,
      activity.pageNumber,
      activity.score,
    );
  }

  if (options?.narrativeCase) {
    updated = advanceCaseNarrative(updated, activity.pageNumber, options.narrativeCase);
  }

  saveGuidedStudySession(updated);
  void persistGuidedStudySession(updated);
  return updated;
}

export function markSurpriseShown(materialId: string, pageNumber: number): GuidedStudySession {
  const existing = loadGuidedStudySession(materialId);
  const session: GuidedStudySession = existing ?? {
    materialId,
    currentPage: pageNumber,
    understoodPages: [],
    analysisVersion: GUIDED_STUDY_ANALYSIS_VERSION,
    lastUpdated: new Date().toISOString(),
  };
  void persistGuidedStudySession(session);
  return session;
}

export function endStudySession(materialId: string): GuidedStudySession {
  const existing = loadGuidedStudySession(materialId);
  const session: GuidedStudySession = existing ?? {
    materialId,
    currentPage: 1,
    understoodPages: [],
    analysisVersion: GUIDED_STUDY_ANALYSIS_VERSION,
    lastUpdated: new Date().toISOString(),
  };
  session.lastSessionEndedAt = new Date().toISOString();
  session.lastUpdated = session.lastSessionEndedAt;
  saveGuidedStudySession(session);
  void persistGuidedStudySession(session);
  return session;
}
