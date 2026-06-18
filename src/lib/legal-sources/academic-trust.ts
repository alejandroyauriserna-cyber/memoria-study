import { DEFAULT_STUDY_CATEGORIES } from "@/lib/legal-sources/study-categories";
import {
  getEnabledSources,
  getManageableSources,
  loadLegalSourcesSettings,
  saveLegalSourcesSettings,
  syncLegalSourcesSettings,
  updateSourceInSettings,
} from "@/lib/legal-sources/storage";
import type { LegalSourcesSettings } from "@/types/legal-sources";

const STORAGE_KEY = "memoria-academic-trust";

export const ACADEMIC_TRUST_CHANGE_EVENT = "memoria-academic-trust-change";

type AcademicTrustState = {
  activatedAt?: string;
};

export function loadAcademicTrustState(): AcademicTrustState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AcademicTrustState;
  } catch {
    return {};
  }
}

function saveAcademicTrustState(state: AcademicTrustState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function notifyAcademicTrustChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACADEMIC_TRUST_CHANGE_EVENT));
}

export function hasAcademicSourcesActivated(settings?: LegalSourcesSettings): boolean {
  const resolved = settings ?? loadLegalSourcesSettings();
  return getEnabledSources(resolved).length > 0;
}

export function activateLegalSourcesFromTrust(
  settings: LegalSourcesSettings,
): LegalSourcesSettings {
  let next: LegalSourcesSettings = {
    ...settings,
    wizardCompleted: true,
    studyCategories: settings.studyCategories?.length
      ? settings.studyCategories
      : DEFAULT_STUDY_CATEGORIES,
  };

  for (const source of getManageableSources(next)) {
    if (!source.enabled) {
      next = updateSourceInSettings(next, source.id, { enabled: true });
    }
  }

  return next;
}

export async function activateAcademicTrustSources(): Promise<LegalSourcesSettings> {
  const current = loadLegalSourcesSettings();
  const next = activateLegalSourcesFromTrust(current);
  saveLegalSourcesSettings(next);

  saveAcademicTrustState({
    ...loadAcademicTrustState(),
    activatedAt: new Date().toISOString(),
  });

  notifyAcademicTrustChange();
  void syncLegalSourcesSettings(next);
  return next;
}
