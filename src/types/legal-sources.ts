export type LegalSourceCategory =
  | "normativa"
  | "jurisprudencia"
  | "doctrina"
  | "material_universitario";

export type LegalSourceKind = "builtin" | "upload" | "material" | "url";

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
  /** URL de origen (LP Derecho u otra fuente web permitida). */
  sourceUrl?: string;
  /** Todas las URLs usadas en la última sincronización (partes / continuaciones). */
  syncUrls?: string[];
  /** Identificador del preset LP (`lp-cc`, `lp-cpp`, …). */
  lpPresetId?: string;
  /** Plantilla web jurisprudencia (`casacion`, `tc`, `tf`). */
  webTemplateId?: string;
  /** Fecha ISO de la última sincronización web. */
  lastSyncedAt?: string;
  /** Cantidad de artículos indexados desde la URL. */
  articleCount?: number;
  updatedAt?: string;
};

export type LegalSourcesSettings = {
  strictMode: boolean;
  /** Solo mostrar artículos verificados en la base jurídica indexada. */
  strictNormativeMode: boolean;
  /** URLs personalizadas por preset LP (`lp-cc`, `lp-cpp`, …). */
  lpPresetUrls?: Record<string, string[]>;
  /** Categorías de fuente que el estudiante usa en este curso (Fase C). */
  studyCategories?: LegalSourceCategory[];
  /** Asistente inicial completado. */
  wizardCompleted?: boolean;
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
