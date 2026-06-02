"use client";

import {
  BookOpen,
  GitBranch,
  HelpCircle,
  Layers,
  Sparkles,
  Workflow,
} from "lucide-react";

export type StudioPanelId =
  | "summary"
  | "flow"
  | "tree"
  | "flashcards"
  | "review"
  | "visualMap"
  | null;

const items = [
  { id: "summary" as const, label: "Resumen", icon: BookOpen },
  { id: "flow" as const, label: "Flujo", icon: Workflow },
  { id: "tree" as const, label: "Ruta", icon: GitBranch },
  { id: "visualMap" as const, label: "Mapa visual", icon: Sparkles },
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
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.92)] p-2 shadow-[0_0_32px_rgba(0,255,213,0.15)] backdrop-blur-xl">
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
                  ? "bg-[rgba(0,255,213,0.18)] text-[#00FFD5]"
                  : "text-muted-foreground hover:bg-[rgba(0,255,213,0.08)] hover:text-[#F5F7FA]"
              }`}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
