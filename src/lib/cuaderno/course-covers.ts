import type { CourseVisualPrefs } from "@/lib/cuaderno/preferences";

export type CourseCoverArt = {
  icon: string;
  accent: string;
  cover: CourseVisualPrefs["cover"];
  /** Palabras decorativas en la portada (fondo). */
  motifs: string[];
  subtitle?: string;
};

export const COURSE_COVER_ART: Record<string, CourseCoverArt> = {
  "constitucional-i": {
    icon: "⚖️",
    accent: "#818cf8",
    cover: "indigo",
    motifs: ["Constitución", "Garantías", "Amparo"],
    subtitle: "Derecho público",
  },
  "constitucional-ii": {
    icon: "⚖️",
    accent: "#6366f1",
    cover: "indigo",
    motifs: ["Control", "Tribunal Const.", "Derechos"],
  },
  "civil-ii-acto-juridico": {
    icon: "📘",
    accent: "#38bdf8",
    cover: "teal",
    motifs: ["Acto Jurídico", "Contrato", "Voluntad"],
    subtitle: "Derecho civil",
  },
  "civil-i-personas": {
    icon: "📘",
    accent: "#0ea5e9",
    cover: "teal",
    motifs: ["Personas", "Capacidad", "Domicilio"],
  },
  "teoria-juridica-delito-i": {
    icon: "📜",
    accent: "#fb7185",
    cover: "rose",
    motifs: ["Teoría del Delito", "Tipicidad", "Culpabilidad"],
    subtitle: "Derecho penal",
  },
  "teoria-juridica-delito-ii": {
    icon: "📜",
    accent: "#f43f5e",
    cover: "rose",
    motifs: ["Concurso", "Penas", "Reincidencia"],
  },
  "introduccion-investigacion-cientifica": {
    icon: "🔍",
    accent: "#2dd4bf",
    cover: "teal",
    motifs: ["Investigación", "Hipótesis", "Método"],
    subtitle: "Ciencias jurídicas",
  },
  "etica-profesional": {
    icon: "✦",
    accent: "#c4b5fd",
    cover: "violet",
    motifs: ["Ética", "Deontología", "Abogacía"],
  },
  "administrativo-i": {
    icon: "🏛",
    accent: "#fbbf24",
    cover: "amber",
    motifs: ["Administrativo", "Acto admin.", "Silencio"],
  },
  "derecho-trabajo-i": {
    icon: "👷",
    accent: "#34d399",
    cover: "teal",
    motifs: ["Trabajo", "Contrato", "Jornada"],
  },
};

export function getCourseCoverArt(
  courseId: string,
  prefs: CourseVisualPrefs,
  override?: CourseCoverArt | null,
): CourseCoverArt {
  if (override) return override;
  const known = COURSE_COVER_ART[courseId];
  if (known) return known;
  return {
    icon: prefs.icon,
    accent: prefs.accent,
    cover: prefs.cover,
    motifs: ["Apuntes", "Clases", "UNT"],
  };
}

export function mergeCourseCoverMaps(
  records: Array<{ courseId: string; coverArt: CourseCoverArt }>,
): Record<string, CourseCoverArt> {
  const map: Record<string, CourseCoverArt> = {};
  for (const row of records) map[row.courseId] = row.coverArt;
  return map;
}
