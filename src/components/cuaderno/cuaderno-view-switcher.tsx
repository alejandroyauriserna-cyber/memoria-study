"use client";

import { List, Grid3x3, Timeline } from "lucide-react";
import "./cuaderno-view-switcher.css";

export type ViewType = "list" | "grid" | "timeline";

export function CuadernoViewSwitcher({
  currentView,
  onViewChange,
}: {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}) {
  return (
    <div className="cn-view-switcher">
      <button
        className="cn-view-btn"
        data-active={currentView === "list"}
        onClick={() => onViewChange("list")}
        title="Vista de lista"
        aria-label="Vista de lista"
      >
        <List size={18} />
      </button>
      <button
        className="cn-view-btn"
        data-active={currentView === "grid"}
        onClick={() => onViewChange("grid")}
        title="Vista de grid"
        aria-label="Vista de grid"
      >
        <Grid3x3 size={18} />
      </button>
      <button
        className="cn-view-btn"
        data-active={currentView === "timeline"}
        onClick={() => onViewChange("timeline")}
        title="Vista de timeline"
        aria-label="Vista de timeline"
      >
        <Timeline size={18} />
      </button>
    </div>
  );
}
