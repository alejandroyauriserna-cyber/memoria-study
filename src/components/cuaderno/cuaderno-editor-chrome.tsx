"use client";

import { FileText, LayoutGrid, Maximize2, Minimize2, Scroll } from "lucide-react";
import { motion } from "framer-motion";
import {
  getLayoutMode,
  saveLayoutMode,
  type CuadernoLayoutMode,
} from "@/lib/cuaderno/editor-preferences";
import { PAGE_SIZE_OPTIONS, type CuadernoPageSizeMode } from "@/lib/cuaderno/page-size";
import { useEffect, useState } from "react";

const LAYOUTS: { id: CuadernoLayoutMode; label: string; icon: typeof Maximize2 }[] = [
  { id: "compact", label: "Compacto", icon: Minimize2 },
  { id: "standard", label: "Estándar", icon: LayoutGrid },
  { id: "fullscreen", label: "Pantalla completa", icon: Maximize2 },
];

const SIZE_ICONS: Record<CuadernoPageSizeMode, typeof FileText> = {
  a4: FileText,
  letter: FileText,
  free: Maximize2,
  infinite: Scroll,
};

/** Controles de vista del lienzo y tamaño de hoja (por página activa). */
export function CuadernoEditorChrome({
  layoutMode,
  onLayoutChange,
  pageSizeMode,
  onPageSizeChange,
}: {
  layoutMode: CuadernoLayoutMode;
  onLayoutChange: (mode: CuadernoLayoutMode) => void;
  pageSizeMode: CuadernoPageSizeMode;
  onPageSizeChange: (mode: CuadernoPageSizeMode) => void;
}) {
  return (
    <motion.div
      className="cn-editor-chrome cn-editor-chrome--minimal"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="cn-editor-chrome-row">
        <span className="cn-editor-chrome-hint">Tamaño de hoja</span>
        <div className="cn-editor-segment" role="group" aria-label="Formato de página">
          {PAGE_SIZE_OPTIONS.map((s) => {
            const Icon = SIZE_ICONS[s.id];
            return (
              <button
                key={s.id}
                type="button"
                className="cn-editor-segment-btn"
                data-active={pageSizeMode === s.id}
                onClick={() => onPageSizeChange(s.id)}
                title={s.description}
              >
                <Icon size={14} />
                <span className="cn-editor-segment-text">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="cn-editor-chrome-row">
        <span className="cn-editor-chrome-hint">Vista del espacio</span>
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
