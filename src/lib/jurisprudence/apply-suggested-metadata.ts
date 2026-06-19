import type {
  JurisprudenceFieldConfidence,
  JurisprudenceSuggestedMetadata,
} from "@/types/jurisprudence-ingest";

export type JurisprudenceContributionFormValues = {
  title: string;
  tipo: string;
  materia: string;
  submateria: string;
  year: string;
  organo: string;
  summary: string;
  keywords: string;
  expediente: string;
};

export function buildOrganoFromSuggested(suggested: JurisprudenceSuggestedMetadata): string {
  const parts = [suggested.sala, suggested.organo, suggested.distritoJudicial].filter(Boolean);
  return parts.join(" — ") || suggested.organo;
}

export function suggestedToContributionForm(
  suggested: JurisprudenceSuggestedMetadata,
): JurisprudenceContributionFormValues {
  return {
    title: suggested.title,
    tipo: suggested.tipo,
    materia: suggested.materia,
    submateria: suggested.submateria,
    year: String(suggested.year),
    organo: buildOrganoFromSuggested(suggested),
    summary: suggested.summary,
    keywords: suggested.keywords.join(", "),
    expediente: suggested.expediente ?? suggested.numeroDocumento ?? "",
  };
}

export function confidenceClass(value?: number): string {
  if (value === undefined) return "";
  if (value >= 0.85) return "is-high";
  if (value >= 0.7) return "is-mid";
  return "is-low";
}

export function formatConfidencePct(value?: number): string | null {
  if (value === undefined) return null;
  return `${Math.round(value * 100)}%`;
}

export type AiFilledFields = Partial<Record<keyof JurisprudenceContributionFormValues, boolean>>;

export function markAiFilledFields(
  confidence?: JurisprudenceFieldConfidence,
): AiFilledFields {
  if (!confidence) return {};
  return {
    title: confidence.title !== undefined && confidence.title >= 0.5,
    tipo: confidence.tipo !== undefined && confidence.tipo >= 0.5,
    materia: confidence.materia !== undefined && confidence.materia >= 0.5,
    submateria: confidence.submateria !== undefined && confidence.submateria >= 0.5,
    year: confidence.year !== undefined && confidence.year >= 0.5,
    organo: confidence.organo !== undefined && confidence.organo >= 0.5,
    summary: confidence.summary !== undefined && confidence.summary >= 0.5,
    keywords: confidence.keywords !== undefined && confidence.keywords >= 0.5,
    expediente:
      (confidence.expediente !== undefined && confidence.expediente >= 0.5) ||
      (confidence.numeroDocumento !== undefined && confidence.numeroDocumento >= 0.5),
  };
}
