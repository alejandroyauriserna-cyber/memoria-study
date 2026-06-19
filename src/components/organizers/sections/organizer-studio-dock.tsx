"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Clock3,
  GitBranch,
  HelpCircle,
  ImageIcon,
  Layers,
  Lock,
  Palette,
  Sparkles,
  Workflow,
} from "lucide-react";
import { PremiumBadge } from "@/components/ui/premium-badge";

export type StudioPanelId =
  | "summary"
  | "flow"
  | "tree"
  | "timeline"
  | "visualAi"
  | "flashcards"
  | "review"
  | "visualMap"
  | "visualPrompt"
  | null;

const items = [
  { id: "summary" as const, label: "Resumen", icon: BookOpen },
  { id: "flow" as const, label: "Flujo", icon: Workflow },
  { id: "tree" as const, label: "Ruta", icon: GitBranch },
  { id: "timeline" as const, label: "Tiempo", icon: Clock3 },
  { id: "visualAi" as const, label: "Visual IA", icon: Sparkles },
  { id: "visualMap" as const, label: "Mapa visual", icon: ImageIcon, pro: true, locked: true },
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
    <div className="organizer-studio-dock-host pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:bottom-5 sm:pb-0">
      <div className="organizer-studio-dock-premium pointer-events-auto max-w-full overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onSelect(selected ? null : item.id)}
              whileHover={{ y: -5, scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className={`organizer-studio-dock-premium__btn${selected ? " is-active" : ""}${"locked" in item && item.locked ? " is-locked" : ""}`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
              {"locked" in item && item.locked ? (
                <Lock size={10} className="opacity-70" aria-hidden />
              ) : null}
              {"pro" in item && item.pro ? <PremiumBadge /> : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
