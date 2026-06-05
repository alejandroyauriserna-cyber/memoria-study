import { GUIDED_STUDY_ANALYSIS_VERSION } from "@/lib/guided-study/analysis-version";
import {
  loadGuidedStudySession,
  saveGuidedStudySession,
} from "@/lib/guided-study/progress";
import type { GuidedStudySession } from "@/types/guided-legal-study";

export async function fetchCloudGuidedStudySession(
  materialId: string,
): Promise<GuidedStudySession | null> {
  try {
    const response = await fetch(`/api/guided-study/progress?materialId=${materialId}`);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      session: GuidedStudySession | null;
    };
    if (!data.session) return null;
    saveGuidedStudySession(data.session);
    return data.session;
  } catch {
    return null;
  }
}

export async function persistGuidedStudySession(session: GuidedStudySession) {
  saveGuidedStudySession(session);
  try {
    await fetch("/api/guided-study/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialId: session.materialId,
        currentPage: session.currentPage,
        understoodPages: session.understoodPages,
        analysisVersion: session.analysisVersion ?? GUIDED_STUDY_ANALYSIS_VERSION,
      }),
    });
  } catch {
    // Offline fallback: localStorage already saved
  }
}

export function mergeGuidedStudySessions(
  local: GuidedStudySession | null,
  remote: GuidedStudySession | null,
): GuidedStudySession | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;

  const localTime = new Date(local.lastUpdated).getTime();
  const remoteTime = new Date(remote.lastUpdated).getTime();
  return remoteTime >= localTime ? remote : local;
}
