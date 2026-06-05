import type { RecentContinueItem } from "@/lib/home/dashboard-types";
import type { Material } from "@/types/material";
import type { OrganizerRecord } from "@/types/organizer";

function materialKind(type: string): RecentContinueItem["kind"] {
  if (type === "apunte" || type === "resumen") return "apunte";
  return "pdf";
}

export function buildRecentContinueItems(input: {
  studyHistory: Array<Material & { lastOpenedAt?: string }>;
  userMaterials: Material[];
  organizers: OrganizerRecord[];
}): RecentContinueItem[] {
  const items: RecentContinueItem[] = [];

  for (const mat of input.studyHistory.slice(0, 4)) {
    if (!mat.id) continue;
    items.push({
      id: mat.id,
      kind: materialKind(mat.materialType),
      title: mat.title,
      subtitle: mat.courseName,
      href: `/materials/${mat.id}`,
      at: mat.lastOpenedAt ?? mat.createdAt ?? new Date().toISOString(),
    });
  }

  for (const mat of input.userMaterials.slice(0, 2)) {
    if (!mat.id || items.some((i) => i.id === mat.id)) continue;
    items.push({
      id: mat.id,
      kind: materialKind(mat.materialType),
      title: mat.title,
      subtitle: "Tu material · " + mat.courseName,
      href: `/materials/${mat.id}`,
      at: mat.createdAt ?? new Date().toISOString(),
    });
  }

  for (const org of input.organizers.slice(0, 3)) {
    const kind: RecentContinueItem["kind"] =
      org.organizer_type === "preguntas" ? "exam" : "organizer";
    items.push({
      id: org.id,
      kind,
      title: org.title,
      subtitle: org.course_name,
      href: `/organizers?open=${org.id}`,
      at: org.updated_at ?? org.created_at,
    });
  }

  items.push({
    id: "legal-chat",
    kind: "chat",
    title: "Consulta con el asistente jurídico",
    subtitle: "Pregunta conceptos, casos o preparación de examen",
    href: "/#asistente",
    at: new Date().toISOString(),
  });

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);
}
