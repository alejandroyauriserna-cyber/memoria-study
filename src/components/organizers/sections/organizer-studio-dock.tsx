"use client";

import {
  BookOpen,
  GitBranch,
  HelpCircle,
  Layers,
  Palette,
  Sparkles,
  Workflow,
} from "lucide-react";
import { PremiumBadge } from "@/components/ui/premium-badge";

export type StudioPanelId =
  | "summary"
  | "flow"
  | "tree"
  | "flashcards"
  | "review"
  | "visualMap"
  | "visualPrompt"
  | null;

const items = [
  { id: "summary" as const, label: "Resumen", icon: BookOpen },
  { id: "flow" as const, label: "Flujo", icon: Workflow },
  { id: "tree" as const, label: "Ruta", icon: GitBranch },
  { id: "visualMap" as const, label: "Mapa visual", icon: Sparkles, pro: true },
  { id: "visualPrompt" as const, label: "Atlas IA", icon: Palette },
  { id: "flashcards" as const, label: "Estudio", icon: Layers },
  { id: "review" as const, label: "Repaso", icon: HelpCircle },
];

export function OrganizerStudioDock({
  active,
  onSelect,
}: {
  active: StudioPanelId;
  onSelect: (id: StudioPanelId) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="organizer-studio-dock pointer-events-auto flex flex-wrap items-center justify-center gap-2 p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(selected ? null : item.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                selected
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-muted-foreground hover:bg-[var(--accent-soft)] hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {item.label}
              {"pro" in item && item.pro ? <PremiumBadge /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
