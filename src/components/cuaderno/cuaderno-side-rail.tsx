"use client";

export type SideRailTab = "stickers" | "postits" | "images";

const RAIL_ITEMS: Array<{ id: SideRailTab; icon: string; label: string }> = [
  { id: "stickers", icon: "🎀", label: "Stickers" },
  { id: "postits", icon: "📝", label: "Post-its" },
  { id: "images", icon: "📷", label: "Imágenes" },
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
          <span className="cn-side-rail-icon" aria-hidden>
            {item.icon}
          </span>
          <span className="cn-side-rail-label">{item.label}</span>
        </button>
      ))}
    </aside>
  );
}
