export type SearchResultKind = "material" | "organizer";

export type SearchSuggestion = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  score: number;
  hasOrganizer?: boolean;
  organizerId?: string;
  materialId?: string;
  fileName?: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function scoreField(value: string | undefined | null, query: string, weights: {
  exact: number;
  prefix: number;
  partial: number;
}) {
  if (!value) return 0;
  const hay = normalize(value);
  const q = normalize(query);
  if (!q) return 0;
  if (hay === q) return weights.exact;
  if (hay.startsWith(q)) return weights.prefix;
  if (hay.includes(q)) return weights.partial;
  return 0;
}

export function scoreMaterial(
  material: {
    title: string;
    description: string;
    fileName: string;
    courseName: string;
  },
  query: string,
): number {
  return Math.max(
    scoreField(material.title, query, { exact: 100, prefix: 80, partial: 60 }),
    scoreField(material.fileName, query, { exact: 55, prefix: 45, partial: 40 }),
    scoreField(material.description, query, { exact: 30, prefix: 25, partial: 20 }),
    scoreField(material.courseName, query, { exact: 25, prefix: 20, partial: 15 }),
  );
}

export function scoreOrganizer(
  organizer: { title: string; description: string },
  query: string,
): number {
  return Math.max(
    scoreField(organizer.title, query, { exact: 90, prefix: 70, partial: 50 }),
    scoreField(organizer.description, query, { exact: 25, prefix: 20, partial: 15 }),
  );
}

export function materialToSuggestion(
  material: {
    id?: string;
    title: string;
    courseName: string;
    cycleLabel: string;
    materialType: string;
    fileName: string;
  },
  score: number,
  organizerId?: string,
): SearchSuggestion {
  return {
    id: material.id ?? "",
    kind: "material",
    title: material.title,
    subtitle: `${material.courseName} · ${material.cycleLabel}`,
    meta: material.fileName || material.materialType,
    href: `/materials/${material.id}`,
    score,
    hasOrganizer: Boolean(organizerId),
    organizerId,
    materialId: material.id,
    fileName: material.fileName,
  };
}

export function organizerToSuggestion(
  organizer: {
    id: string;
    title: string;
    course_name: string;
    cycle_label: string;
    material_id: string | null;
  },
  score: number,
): SearchSuggestion {
  return {
    id: organizer.id,
    kind: "organizer",
    title: organizer.title,
    subtitle: `${organizer.course_name} · ${organizer.cycle_label}`,
    meta: "Generado por IA",
    href: `/organizers?new=${organizer.id}`,
    score: score + 5,
    hasOrganizer: true,
    organizerId: organizer.id,
    materialId: organizer.material_id ?? undefined,
  };
}
