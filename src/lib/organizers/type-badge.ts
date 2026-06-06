import type { OrganizerType } from "@/types/organizer";

export type OrganizerTypeBadgeVariant =
  | "mapa"
  | "flashcards"
  | "ruta"
  | "timeline"
  | "juridico"
  | "repaso";

export type OrganizerTypeBadgeInfo = {
  emoji: string;
  label: string;
  variant: OrganizerTypeBadgeVariant;
};

const BADGES: Record<OrganizerType, OrganizerTypeBadgeInfo> = {
  "mapa-conceptual": { emoji: "🧠", label: "Mapa conceptual", variant: "mapa" },
  flashcards: { emoji: "📚", label: "Flashcards", variant: "flashcards" },
  jerarquico: { emoji: "🗺️", label: "Ruta de estudio", variant: "ruta" },
  flujo: { emoji: "🗺️", label: "Ruta de estudio", variant: "ruta" },
  "cuadro-sinoptico": { emoji: "🗺️", label: "Ruta de estudio", variant: "ruta" },
  "linea-del-tiempo": { emoji: "⏳", label: "Timeline", variant: "timeline" },
  resumen: { emoji: "⚖️", label: "Organizador jurídico", variant: "juridico" },
  "cuadro-comparativo": { emoji: "⚖️", label: "Organizador jurídico", variant: "juridico" },
  explicacion: { emoji: "⚖️", label: "Organizador jurídico", variant: "juridico" },
  preguntas: { emoji: "🎯", label: "Repaso", variant: "repaso" },
};

const FALLBACK: OrganizerTypeBadgeInfo = {
  emoji: "⚖️",
  label: "Organizador jurídico",
  variant: "juridico",
};

export function getOrganizerTypeBadge(type: string): OrganizerTypeBadgeInfo {
  return BADGES[type as OrganizerType] ?? FALLBACK;
}
