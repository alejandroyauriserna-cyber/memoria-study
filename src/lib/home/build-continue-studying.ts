import type { OrganizerRecord } from "@/types/organizer";

export type ContinueStudyingKind = "guided" | "organizer";

export type ContinueStudyingPoint = {
  kind: ContinueStudyingKind;
  id: string;
  title: string;
  courseName: string;
  /** Punto exacto: p. ej. «Página 12» o «Mapa conceptual» */
  studyPoint: string;
  href: string;
  lastActiveAt: string;
  currentPage?: number;
};

const ORGANIZER_TYPE_LABEL: Record<string, string> = {
  resumen: "Resumen",
  flashcards: "Flashcards",
  preguntas: "Preguntas de examen",
  "mapa-conceptual": "Mapa conceptual",
  "cuadro-sinoptico": "Cuadro sinóptico",
  "cuadro-comparativo": "Cuadro comparativo",
  jerarquico: "Organigrama",
  flujo: "Diagrama de flujo",
  "linea-del-tiempo": "Línea de tiempo",
  explicacion: "Explicación guiada",
};

type GuidedCandidate = {
  materialId: string;
  title: string;
  courseName: string;
  currentPage: number;
  lastUpdated: string;
};

export function buildContinueStudyingPoint(input: {
  guidedSession: GuidedCandidate | null;
  latestOrganizer: OrganizerRecord | null;
}): ContinueStudyingPoint | null {
  const candidates: ContinueStudyingPoint[] = [];

  if (input.guidedSession) {
    const { materialId, title, courseName, currentPage, lastUpdated } = input.guidedSession;
    candidates.push({
      kind: "guided",
      id: materialId,
      title,
      courseName,
      studyPoint: `Página ${currentPage}`,
      href: `/estudio-guiado/${materialId}`,
      lastActiveAt: lastUpdated,
      currentPage,
    });
  }

  if (input.latestOrganizer) {
    const org = input.latestOrganizer;
    const typeLabel =
      ORGANIZER_TYPE_LABEL[org.organizer_type] ?? org.organizer_type.replace(/-/g, " ");
    candidates.push({
      kind: "organizer",
      id: org.id,
      title: org.title,
      courseName: org.course_name,
      studyPoint: typeLabel,
      href: `/organizers?open=${org.id}`,
      lastActiveAt: org.updated_at ?? org.created_at,
    });
  }

  if (!candidates.length) return null;

  return candidates.sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime(),
  )[0]!;
}

export function formatContinueRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}
