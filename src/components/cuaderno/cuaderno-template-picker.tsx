"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TEMPLATE_GALLERY_GROUPS, templatesByCategory, type CuadernoTemplateId } from "@/lib/cuaderno/templates";
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
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="cn-template-gallery-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="cn-template-gallery-panel"
            role="dialog"
            aria-labelledby="template-gallery-title"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cn-template-gallery-header">
              <div>
                <p className="cn-template-gallery-eyebrow">Nueva hoja</p>
                <h2 id="template-gallery-title" className="cn-template-gallery-title">
                  Galería de plantillas
                </h2>
                <p className="cn-template-gallery-sub">
                  Elige una plantilla con estructura visual real — como GoodNotes.
                </p>
              </div>
              <button type="button" onClick={onClose} className="cn-template-gallery-close" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            {TEMPLATE_GALLERY_GROUPS.map((group) => (
              <section key={group.key} className="cn-template-gallery-section">
                <h3>{group.title}</h3>
                <div className="cn-template-gallery-grid">
                  {templatesByCategory(group.key).map((template, i) => (
                    <motion.button
                      key={template.id}
                      type="button"
                      className="cn-template-gallery-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => onSelect(template.id)}
                    >
                      <CuadernoPaperPreview template={template} size="lg" />
                      <div className="cn-template-gallery-card-text">
                        <span className="cn-template-gallery-card-icon">{template.icon}</span>
                        <div>
                          <p className="cn-template-gallery-card-name">{template.label}</p>
                          <p className="cn-template-gallery-card-desc">{template.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            ))}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
