const STORAGE_KEY = "memoria-cuaderno-course-prefs";

export type CourseVisualPrefs = {
  icon: string;
  accent: string;
  cover: "slate" | "indigo" | "amber" | "rose" | "teal" | "violet";
};

const DEFAULT_BY_COURSE: Record<string, Partial<CourseVisualPrefs>> = {
  "constitucional-i": { icon: "⚖️", accent: "#6366f1", cover: "indigo" },
  "constitucional-ii": { icon: "⚖️", accent: "#818cf8", cover: "indigo" },
  "teoria-juridica-delito-i": { icon: "🔍", accent: "#f43f5e", cover: "rose" },
  "teoria-juridica-delito-ii": { icon: "📜", accent: "#fb7185", cover: "rose" },
  "civil-ii-acto-juridico": { icon: "📘", accent: "#0ea5e9", cover: "teal" },
  "civil-i-personas": { icon: "📘", accent: "#38bdf8", cover: "teal" },
  "civil-iii-derechos-reales": { icon: "📗", accent: "#22d3ee", cover: "teal" },
  "administrativo-i": { icon: "🏛", accent: "#f59e0b", cover: "amber" },
  "etica-profesional": { icon: "💼", accent: "#a78bfa", cover: "violet" },
  "introduccion-investigacion-cientifica": { icon: "📚", accent: "#14b8a6", cover: "teal" },
  "derecho-trabajo-i": { icon: "👷", accent: "#34d399", cover: "teal" },
  "derecho-trabajo-ii": { icon: "⚒", accent: "#10b981", cover: "teal" },
  "derecho-procesal-penal-i": { icon: "⚖", accent: "#e879f9", cover: "violet" },
  "seminario-tesis": { icon: "📑", accent: "#c4b5fd", cover: "violet" },
};

const FALLBACK: CourseVisualPrefs = {
  icon: "📁",
  accent: "#00FFD5",
  cover: "slate",
};

export function getCourseVisualPrefs(courseId: string): CourseVisualPrefs {
  if (typeof window === "undefined") {
    return { ...FALLBACK, ...DEFAULT_BY_COURSE[courseId] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, CourseVisualPrefs>) : {};
    return {
      ...FALLBACK,
      ...DEFAULT_BY_COURSE[courseId],
      ...all[courseId],
    };
  } catch {
    return { ...FALLBACK, ...DEFAULT_BY_COURSE[courseId] };
  }
}

export function saveCourseVisualPrefs(courseId: string, prefs: Partial<CourseVisualPrefs>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, CourseVisualPrefs>) : {};
    all[courseId] = { ...getCourseVisualPrefs(courseId), ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export const COVER_GRADIENTS: Record<CourseVisualPrefs["cover"], string> = {
  slate: "linear-gradient(145deg, #1a2332 0%, #0f1419 55%, #16202a 100%)",
  indigo: "linear-gradient(145deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%)",
  amber: "linear-gradient(145deg, #78350f 0%, #451a03 50%, #1c1917 100%)",
  rose: "linear-gradient(145deg, #881337 0%, #4c0519 50%, #0f172a 100%)",
  teal: "linear-gradient(145deg, #134e4a 0%, #042f2e 50%, #0f172a 100%)",
  violet: "linear-gradient(145deg, #4c1d95 0%, #2e1065 50%, #0f172a 100%)",
};

/** Clases CSS con gradientes oscuro/claro según `html.dark`. */
export function cnCoverClass(cover: CourseVisualPrefs["cover"]): string {
  return `cn-cover cn-cover--${cover}`;
}
