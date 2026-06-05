import { GUIDED_STUDY_ANALYSIS_VERSION } from "@/lib/guided-study/analysis-version";
import { persistGuidedStudySession } from "@/lib/guided-study/progress-sync";
import type { GuidedStudySession } from "@/types/guided-legal-study";

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
