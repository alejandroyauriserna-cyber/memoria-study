export type LegalSourceCategory =
  | "normativa"
  | "jurisprudencia"
  | "doctrina"
  | "material_universitario";

export type LegalSourceKind = "builtin" | "upload" | "material";

export type LegalSourceRecord = {
  id: string;
  title: string;
  category: LegalSourceCategory;
  kind: LegalSourceKind;
  enabled: boolean;
  priority: number;
  author?: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  materialId?: string;
  /** Texto extraído del PDF (recortado en cliente/servidor). */
  extractedText?: string;
  updatedAt?: string;
};

export type LegalSourcesSettings = {
  strictMode: boolean;
  sources: LegalSourceRecord[];
};

export type LegalSourceAttribution = {
  sourceId: string;
  title: string;
  category: LegalSourceCategory;
};

export type SourceCitation = {
  sourceId: string;
  sourceTitle: string;
  article?: string;
  page?: string;
  author?: string;
  fragment: string;
  updatedAt?: string;
};

export const LEGAL_SOURCE_CATEGORY_LABELS: Record<LegalSourceCategory, string> = {
  normativa: "Normativa",
  jurisprudencia: "Jurisprudencia",
  doctrina: "Doctrina",
  material_universitario: "Material universitario",
};

export const LEGAL_SOURCE_CATEGORY_ORDER: LegalSourceCategory[] = [
  "material_universitario",
  "normativa",
  "jurisprudencia",
  "doctrina",
];
