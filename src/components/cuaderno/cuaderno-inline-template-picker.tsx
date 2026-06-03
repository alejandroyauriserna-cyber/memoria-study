"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TEMPLATE_GALLERY_GROUPS, templatesByCategory, type CuadernoTemplateId } from "@/lib/cuaderno/templates";
import { CuadernoPaperPreview } from "@/components/cuaderno/cuaderno-paper-preview";

export function CuadernoInlineTemplatePicker({
  open,
  currentId,
  onSelect,
  onClose,
}: {
  open: boolean;
  currentId: CuadernoTemplateId;
  onSelect: (id: CuadernoTemplateId) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="cn-inline-template-picker"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="cn-inline-template-picker-inner">
            <p className="cn-inline-template-title">Galería de plantillas</p>
            {TEMPLATE_GALLERY_GROUPS.map((group) => (
              <div key={group.key} className="cn-inline-template-group">
                <p className="cn-inline-template-group-title">{group.title}</p>
                <div className="cn-inline-template-grid">
                  {templatesByCategory(group.key).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="cn-inline-template-card"
                      data-selected={currentId === t.id}
                      onClick={() => {
                        onSelect(t.id);
                        onClose();
                      }}
                    >
                      <CuadernoPaperPreview template={t} selected={currentId === t.id} size="md" />
                      <span className="cn-inline-template-label">{t.label}</span>
                      <span className="cn-inline-template-desc">{t.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
