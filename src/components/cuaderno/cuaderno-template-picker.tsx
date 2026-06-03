"use client";

import { CUADERNO_TEMPLATES, type CuadernoTemplateId } from "@/lib/cuaderno/templates";
import { X } from "lucide-react";

export function CuadernoTemplatePicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: CuadernoTemplateId) => void;
}) {
  if (!open) return null;

  const base = CUADERNO_TEMPLATES.filter((t) => t.category === "base");
  const legal = CUADERNO_TEMPLATES.filter((t) => t.category === "juridica");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="cn-premium-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0f1419] p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="template-picker-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">
              Nueva clase
            </p>
            <h2 id="template-picker-title" className="cn-hero-title mt-1 text-2xl font-bold text-[#F5F7FA]">
              Elige una plantilla
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Como en GoodNotes: hoja, cuadrícula o formato jurídico.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-[#F5F7FA]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <TemplateGroup title="Básicas" templates={base} onSelect={onSelect} />
        <TemplateGroup title="Plantillas jurídicas" templates={legal} onSelect={onSelect} />
      </div>
    </div>
  );
}

function TemplateGroup({
  title,
  templates,
  onSelect,
}: {
  title: string;
  templates: typeof CUADERNO_TEMPLATES;
  onSelect: (id: CuadernoTemplateId) => void;
}) {
  return (
    <div className="mt-6">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className="cn-template-tile p-4 text-left"
            onClick={() => onSelect(template.id)}
          >
            <p className="text-sm font-semibold text-[#F5F7FA]">{template.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
