import { getEnabledSources } from "@/lib/legal-sources/storage";
import type { LegalSourceRecord, LegalSourcesSettings } from "@/types/legal-sources";

export type TutorActionGate = {
  allowed: boolean;
  reason?: string;
};

function enabledNormativeLp(settings: LegalSourcesSettings | null): LegalSourceRecord | undefined {
  const sources = settings ? getEnabledSources(settings) : [];
  return sources.find((s) => s.kind === "url" && s.lpPresetId && (s.articleCount ?? 0) > 0);
}

function syncedNormativeLp(manageable: LegalSourceRecord[]): LegalSourceRecord | undefined {
  return manageable.find((s) => s.kind === "url" && s.lpPresetId && (s.articleCount ?? 0) > 0);
}

function enabledJurisprudence(settings: LegalSourcesSettings | null): LegalSourceRecord | undefined {
  const sources = settings ? getEnabledSources(settings) : [];
  return sources.find(
    (s) =>
      (s.category === "jurisprudencia" || s.category === "doctrina") &&
      Boolean(s.extractedText?.trim() || s.lastSyncedAt),
  );
}

function syncedJurisprudence(manageable: LegalSourceRecord[]): LegalSourceRecord | undefined {
  return manageable.find(
    (s) =>
      (s.category === "jurisprudencia" || s.category === "doctrina") &&
      Boolean(s.extractedText?.trim() || s.lastSyncedAt),
  );
}

export function gateNormativeAction(
  settings: LegalSourcesSettings | null,
  manageableSources: LegalSourceRecord[],
): TutorActionGate {
  if (enabledNormativeLp(settings)) return { allowed: true };
  if (syncedNormativeLp(manageableSources)) {
    return {
      allowed: false,
      reason: "Activa tu fuente de normativa (LP Derecho) en el panel de fuentes.",
    };
  }
  return {
    allowed: false,
    reason: "Sincroniza normativa desde LP Derecho en Fuentes Jurídicas.",
  };
}

export function gateJurisprudenceAction(
  settings: LegalSourcesSettings | null,
  manageableSources: LegalSourceRecord[],
): TutorActionGate {
  if (enabledJurisprudence(settings)) return { allowed: true };
  if (syncedJurisprudence(manageableSources)) {
    return {
      allowed: false,
      reason: "Activa tu fuente de jurisprudencia o doctrina en el panel de fuentes.",
    };
  }
  return {
    allowed: false,
    reason: "Agrega y sincroniza jurisprudencia o doctrina (PDF o URL) en Fuentes Jurídicas.",
  };
}
