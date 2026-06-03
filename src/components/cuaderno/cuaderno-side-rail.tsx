"use client";

import { Globe, ImageIcon, StickyNote, Sparkles } from "lucide-react";

export type SideRailTab = "stickers" | "postits" | "images" | "import-sticker";

const RAIL_ITEMS: Array<{
  id: SideRailTab;
  label: string;
  Icon: typeof Sparkles;
}> = [
  { id: "stickers", label: "Stickers", Icon: Sparkles },
  { id: "import-sticker", label: "Importar Sticker", Icon: Globe },
  { id: "postits", label: "Post-its", Icon: StickyNote },
  { id: "images", label: "Imágenes", Icon: ImageIcon },
];

export function CuadernoSideRail({
  active,
  panelOpen,
  onSelect,
}: {
  active: SideRailTab | null;
  panelOpen: boolean;
  onSelect: (tab: SideRailTab) => void;
}) {
  return (
    <aside className={`cn-side-rail${panelOpen ? " is-panel-open" : ""}`} aria-label="Herramientas visuales">
      {RAIL_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`cn-side-rail-btn${active === item.id && panelOpen ? " is-active" : ""}`}
          title={item.label}
          onClick={() => onSelect(item.id)}
        >
          <item.Icon className="cn-side-rail-icon-svg" size={18} aria-hidden />
          <span className="cn-side-rail-label">{item.label}</span>
        </button>
      ))}
    </aside>
  );
}
