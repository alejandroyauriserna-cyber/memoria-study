"use client";

import { LayoutGrid, Maximize2, Minimize2, Palette } from "lucide-react";
import { motion } from "framer-motion";
import {
  getLayoutMode,
  getPaperTone,
  saveLayoutMode,
  savePaperTone,
  type CuadernoLayoutMode,
  type CuadernoPaperTone,
} from "@/lib/cuaderno/editor-preferences";
import { getTemplate } from "@/lib/cuaderno/templates";
import { CuadernoPaperPreview } from "@/components/cuaderno/cuaderno-paper-preview";
import type { CuadernoTemplateId } from "@/lib/cuaderno/templates";
import { useEffect, useState } from "react";

const LAYOUTS: { id: CuadernoLayoutMode; label: string; icon: typeof Maximize2 }[] = [
  { id: "compact", label: "Compacto", icon: Minimize2 },
  { id: "standard", label: "Estándar", icon: LayoutGrid },
  { id: "fullscreen", label: "Pantalla completa", icon: Maximize2 },
];

const TONES: { id: CuadernoPaperTone; label: string }[] = [
  { id: "warm", label: "Cálido" },
  { id: "white", label: "Blanco" },
  { id: "cool", label: "Frío" },
];

export function CuadernoEditorChrome({
  templateId,
  onTemplateChange,
  layoutMode,
  onLayoutChange,
  paperTone,
  onPaperToneChange,
  templatePickerOpen,
  onTemplatePickerToggle,
}: {
  templateId: CuadernoTemplateId;
  onTemplateChange: (id: CuadernoTemplateId) => void;
  layoutMode: CuadernoLayoutMode;
  onLayoutChange: (mode: CuadernoLayoutMode) => void;
  paperTone: CuadernoPaperTone;
  onPaperToneChange: (tone: CuadernoPaperTone) => void;
  templatePickerOpen: boolean;
  onTemplatePickerToggle: (open: boolean) => void;
}) {
  const template = getTemplate(templateId);

  return (
    <motion.div
      className="cn-editor-chrome"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cn-editor-chrome-row">
        <button
          type="button"
          className="cn-editor-chip cn-editor-chip--template"
          onClick={() => onTemplatePickerToggle(!templatePickerOpen)}
          aria-expanded={templatePickerOpen}
        >
          <span className="cn-editor-chip-preview">
            <CuadernoPaperPreview template={template} size="sm" />
          </span>
          <span>
            <span className="cn-editor-chip-label">Plantilla</span>
            <span className="cn-editor-chip-value">{template.label}</span>
          </span>
        </button>

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

        <div className="cn-editor-segment cn-editor-segment--tone" role="group" aria-label="Tono de papel">
          <Palette size={14} className="text-white/40" />
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="cn-editor-segment-btn cn-editor-segment-btn--mini"
              data-active={paperTone === t.id}
              onClick={() => {
                onPaperToneChange(t.id);
                savePaperTone(t.id);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function useEditorChromeState() {
  const [layoutMode, setLayoutMode] = useState<CuadernoLayoutMode>("fullscreen");
  const [paperTone, setPaperTone] = useState<CuadernoPaperTone>("warm");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  useEffect(() => {
    setLayoutMode(getLayoutMode());
    setPaperTone(getPaperTone());
  }, []);

  return {
    layoutMode,
    setLayoutMode,
    paperTone,
    setPaperTone,
    templatePickerOpen,
    setTemplatePickerOpen,
  };
}
