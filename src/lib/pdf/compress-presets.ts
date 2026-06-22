export type PdfCompressPresetId = "recommended" | "extreme" | "light";

export type PdfCompressPreset = {
  id: PdfCompressPresetId;
  label: string;
  /** pdf.js viewport scale — higher = sharper, heavier file. */
  renderScale: number;
  /** JPEG quality 0–1 for image-heavy PDFs. */
  jpegQuality: number;
  /** Try structural pdf-lib pass before image re-render. */
  structuralFirst: boolean;
};

export const PDF_COMPRESS_PRESETS: Record<PdfCompressPresetId, PdfCompressPreset> = {
  recommended: {
    id: "recommended",
    label: "Recomendada",
    renderScale: 1.45,
    jpegQuality: 0.74,
    structuralFirst: true,
  },
  extreme: {
    id: "extreme",
    label: "Extrema",
    renderScale: 1.05,
    jpegQuality: 0.58,
    structuralFirst: false,
  },
  light: {
    id: "light",
    label: "Alta calidad",
    renderScale: 1.75,
    jpegQuality: 0.84,
    structuralFirst: true,
  },
};

/** Pages sampled to detect escaneos vs texto seleccionable. */
export const PDF_PROFILE_SAMPLE_PAGES = 6;

/** Below this avg chars/page → tratamos como escaneo/imagen. */
export const PDF_SCANNED_TEXT_CHARS_PER_PAGE = 90;

/** Above this bytes/page → probable escaneo o diapositivas. */
export const PDF_HEAVY_BYTES_PER_PAGE = 220_000;
