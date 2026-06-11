"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, FileText, X } from "lucide-react";
import type { DiagramNodeDetail } from "@/lib/organizers/visual-ai-diagram/build-diagram-node-detail";

export function InteractiveDiagramPanel({
  open,
  detail,
  onClose,
}: {
  open: boolean;
  detail: DiagramNodeDetail | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && detail ? (
        <motion.aside
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="interactive-diagram-panel diagram-study-panel"
        >
          <div className="interactive-diagram-panel__head">
            <div>
              <p className="interactive-diagram-panel__kicker">Concepto seleccionado</p>
              <h3 className="interactive-diagram-panel__title">{detail.label}</h3>
            </div>
            <button type="button" onClick={onClose} className="interactive-diagram-panel__close" aria-label="Cerrar panel">
              <X size={16} />
            </button>
          </div>

          <div className="interactive-diagram-panel__body">
            <section>
              <h4>Resumen</h4>
              <p>{detail.simpleExplanation}</p>
            </section>
            <section>
              <h4>Base jurídica</h4>
              <p>{detail.legalBasis}</p>
            </section>
            <section>
              <h4>Ejemplo práctico</h4>
              <p>{detail.practicalExample}</p>
            </section>
            <section className="interactive-diagram-panel__pdf">
              <h4>
                <FileText size={14} />
                Fuente del PDF
              </h4>
              <p>{detail.pdfSource}</p>
            </section>
            <section>
              <h4>
                <BookOpen size={14} />
                Pregunta de examen
              </h4>
              <p className="font-semibold">{detail.examQuestion}</p>
              <p className="mt-2 text-sm opacity-80">{detail.examAnswer}</p>
            </section>
            {detail.relatedConcepts.length ? (
              <section>
                <h4>Relacionados</h4>
                <div className="interactive-diagram-panel__chips">
                  {detail.relatedConcepts.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
