"use client";

import {
  createPostIt,
  type DecorationObject,
  type PostItColor,
} from "@/lib/cuaderno/decoration-objects";
import {
  DECORATION_DRAG_MIME,
  encodeDecorationDrag,
} from "@/lib/cuaderno/decoration-drag";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const POSTIT_ORDER: PostItColor[] = ["yellow", "pink", "blue", "green", "purple"];

const POSTIT_LABELS: Record<PostItColor, string> = {
  yellow: "Amarillo",
  pink: "Rosa",
  blue: "Azul",
  green: "Verde",
  purple: "Morado",
};

export function CuadernoPostItPanel({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: DecorationObject) => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="cn-sticker-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="cn-sticker-panel cn-postit-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            role="dialog"
            aria-label="Post-its"
          >
            <header className="cn-sticker-panel-head">
              <div>
                <span>📝 Post-its</span>
                <p className="cn-sticker-panel-hint">Arrastra a la hoja · clic para insertar</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>
            <div className="cn-sticker-panel-body">
              <div className="cn-sticker-postits">
                <p className="cn-sticker-section-lead">
                  Notas adhesivas editables — muévelas y escribe dentro
                </p>
                <div className="cn-sticker-postit-grid">
                  {POSTIT_ORDER.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`cn-sticker-postit-btn cn-postit-${c} cn-draggable-source`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          DECORATION_DRAG_MIME,
                          encodeDecorationDrag({ type: "postit", color: c }),
                        );
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => onAdd(createPostIt(c))}
                    >
                      <span className="cn-sticker-postit-swatch" />
                      {POSTIT_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
