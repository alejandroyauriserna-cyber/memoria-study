"use client";

import { LayoutGrid, Maximize2, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  getLayoutMode,
  saveLayoutMode,
  type CuadernoLayoutMode,
} from "@/lib/cuaderno/editor-preferences";
import { useEffect, useState } from "react";

const LAYOUTS: { id: CuadernoLayoutMode; label: string; icon: typeof Maximize2 }[] = [
  { id: "compact", label: "Compacto", icon: Minimize2 },
  { id: "standard", label: "Estándar", icon: LayoutGrid },
  { id: "fullscreen", label: "Pantalla completa", icon: Maximize2 },
];

/** Solo controles de vista del lienzo — plantilla por página en configuración local */
export function CuadernoEditorChrome({
  layoutMode,
  onLayoutChange,
}: {
  layoutMode: CuadernoLayoutMode;
  onLayoutChange: (mode: CuadernoLayoutMode) => void;
}) {
  return (
    <motion.div
      className="cn-editor-chrome cn-editor-chrome--minimal"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="cn-editor-chrome-row">
        <span className="cn-editor-chrome-hint">Vista del lienzo</span>
        <div className="cn-editor-segment" role="group" aria-label="Modo de vista">
          {LAYOUTS.map((l) => {
            const Icon = l.icon;
            return (
              <button
                key={l.id}
                type="button"
                className="cn-editor-segment-btn"
                data-active={layoutMode === l.id}
                onClick={() => {
                  onLayoutChange(l.id);
                  saveLayoutMode(l.id);
                }}
                title={l.label}
              >
                <Icon size={14} />
                <span className="cn-editor-segment-text">{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function useEditorChromeState() {
  const [layoutMode, setLayoutMode] = useState<CuadernoLayoutMode>("fullscreen");

  useEffect(() => {
    setLayoutMode(getLayoutMode());
  }, []);

  return {
    layoutMode,
    setLayoutMode,
  };
}
