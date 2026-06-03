"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CUADERNO_TEMPLATES, type CuadernoTemplateId } from "@/lib/cuaderno/templates";
import { CuadernoPaperPreview } from "@/components/cuaderno/cuaderno-paper-preview";
import { X } from "lucide-react";
import "./cuaderno-paper.css";

export function CuadernoTemplatePicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: CuadernoTemplateId) => void;
}) {
  const base = CUADERNO_TEMPLATES.filter((t) => t.category === "base");
  const legal = CUADERNO_TEMPLATES.filter((t) => t.category === "juridica");

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-md sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="cn-template-picker-panel w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c1018]/95 p-6 shadow-2xl"
            role="dialog"
            aria-labelledby="template-picker-title"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">
                  Nueva hoja
                </p>
                <h2 id="template-picker-title" className="cn-hero-title mt-1 text-2xl font-bold text-[#F5F7FA]">
                  Elige tu plantilla
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cada plantilla cambia el fondo de la hoja — como GoodNotes o Notability.
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
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
    <div className="mt-8">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, i) => (
          <motion.button
            key={template.id}
            type="button"
            className="cn-template-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(template.id)}
          >
            <CuadernoPaperPreview template={template} size="lg" />
            <div className="cn-template-card-text">
              <span className="cn-template-card-icon">{template.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[#F5F7FA]">{template.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
