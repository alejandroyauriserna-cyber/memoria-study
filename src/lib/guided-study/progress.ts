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
    lastUpdated: new Date().toISOString(),
  };

  if (!session.understoodPages.includes(pageNumber)) {
    session.understoodPages.push(pageNumber);
    session.understoodPages.sort((a, b) => a - b);
  }

  session.currentPage = pageNumber;
  session.lastUpdated = new Date().toISOString();
  saveGuidedStudySession(session);
  return session;
}

export function updateCurrentPage(materialId: string, pageNumber: number) {
  const existing = loadGuidedStudySession(materialId);
  const session: GuidedStudySession = existing ?? {
    materialId,
    currentPage: pageNumber,
    understoodPages: [],
    lastUpdated: new Date().toISOString(),
  };

  session.currentPage = pageNumber;
  session.lastUpdated = new Date().toISOString();
  saveGuidedStudySession(session);
  return session;
}

export function getStudyProgressPercent(session: GuidedStudySession, totalPages: number) {
  if (totalPages <= 0) return 0;
  return Math.round((session.understoodPages.length / totalPages) * 100);
}
