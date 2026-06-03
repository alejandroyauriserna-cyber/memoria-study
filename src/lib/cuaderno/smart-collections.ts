export type SmartCollectionSlug = "favoritos" | "examenes" | "resumenes";

export type SavedAiItem = {
  id: string;
  classId?: string;
  courseName: string;
  classTitle?: string;
  title: string;
  content: string;
  createdAt: string;
};

const FAVORITES_KEY = "memoria-cuaderno-favorites";
const EXAMS_KEY = "memoria-cuaderno-exams";
const SUMMARIES_KEY = "memoria-cuaderno-summaries";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const SMART_COLLECTIONS: Array<{
  slug: SmartCollectionSlug;
  icon: string;
  title: string;
  description: string;
  accent: string;
  cover: "amber" | "violet" | "indigo";
  motifs: string[];
}> = [
  {
    slug: "favoritos",
    icon: "⭐",
    title: "Favoritos",
    description: "Hojas marcadas para repaso rápido",
    accent: "#fbbf24",
    cover: "amber",
    motifs: ["Destacados", "Repaso", "Clave"],
  },
  {
    slug: "examenes",
    icon: "🧠",
    title: "Exámenes",
    description: "Preguntas, simulacros y casos generados por IA",
    accent: "#a78bfa",
    cover: "violet",
    motifs: ["Simulacro", "Preguntas", "Caso práctico"],
  },
  {
    slug: "resumenes",
    icon: "📚",
    title: "Resúmenes IA",
    description: "Síntesis y resúmenes guardados desde tus apuntes",
    accent: "#60a5fa",
    cover: "indigo",
    motifs: ["Resumen", "Síntesis", "Repaso"],
  },
];

export function listFavoriteClassIds(): string[] {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function isFavoriteClass(classId: string): boolean {
  return listFavoriteClassIds().includes(classId);
}

export function toggleFavoriteClass(classId: string): boolean {
  const current = listFavoriteClassIds();
  const next = current.includes(classId)
    ? current.filter((id) => id !== classId)
    : [...current, classId];
  writeJson(FAVORITES_KEY, next);
  return next.includes(classId);
}

export function listExamItems(): SavedAiItem[] {
  return readJson<SavedAiItem[]>(EXAMS_KEY, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function listSummaryItems(): SavedAiItem[] {
  return readJson<SavedAiItem[]>(SUMMARIES_KEY, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function saveExamItem(
  item: Omit<SavedAiItem, "id" | "createdAt"> & { createdAt?: string },
): SavedAiItem {
  const entry: SavedAiItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
  const list = listExamItems();
  writeJson(EXAMS_KEY, [entry, ...list].slice(0, 80));
  return entry;
}

export function saveSummaryItem(
  item: Omit<SavedAiItem, "id" | "createdAt"> & { createdAt?: string },
): SavedAiItem {
  const entry: SavedAiItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
  const list = listSummaryItems();
  writeJson(SUMMARIES_KEY, [entry, ...list].slice(0, 80));
  return entry;
}

export function countSmartCollection(slug: SmartCollectionSlug): number {
  if (slug === "favoritos") return listFavoriteClassIds().length;
  if (slug === "examenes") return listExamItems().length;
  return listSummaryItems().length;
}

/** Prefer API; cae a localStorage si falla. */
export async function toggleFavoriteClassAsync(classId: string): Promise<boolean> {
  try {
    const { toggleFavoriteRemote } = await import("@/lib/cuaderno/collections-client");
    return await toggleFavoriteRemote(classId);
  } catch {
    return toggleFavoriteClass(classId);
  }
}

export async function saveExamItemAsync(
  item: Omit<SavedAiItem, "id" | "createdAt"> & { createdAt?: string },
): Promise<SavedAiItem> {
  try {
    const { saveAiItemRemote } = await import("@/lib/cuaderno/collections-client");
    return await saveAiItemRemote("exam", item);
  } catch {
    return saveExamItem(item);
  }
}

export async function saveSummaryItemAsync(
  item: Omit<SavedAiItem, "id" | "createdAt"> & { createdAt?: string },
): Promise<SavedAiItem> {
  try {
    const { saveAiItemRemote } = await import("@/lib/cuaderno/collections-client");
    return await saveAiItemRemote("summary", item);
  } catch {
    return saveSummaryItem(item);
  }
}
