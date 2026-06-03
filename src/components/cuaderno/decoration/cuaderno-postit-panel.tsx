"use client";

import { useState } from "react";
import {
  createPostIt,
  type DecorationObject,
  type PostItColor,
} from "@/lib/cuaderno/decoration-objects";
import {
  DECORATION_DRAG_MIME,
  encodeDecorationDrag,
} from "@/lib/cuaderno/decoration-drag";
import {
  POSTIT_CATEGORIES,
  POSTIT_PREMIUM_STYLES,
  type PostItCategory,
} from "@/lib/cuaderno/postit-premium";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, X } from "lucide-react";

export function CuadernoPostItPanel({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: DecorationObject) => void;
}) {
  const [category, setCategory] = useState<PostItCategory>("pastel");

  const styles = POSTIT_PREMIUM_STYLES[category];

  const addPostIt = (color: PostItColor) => {
    onAdd(createPostIt(color, "", category));
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="cn-sticker-panel-backdrop cn-glass-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="cn-sticker-panel cn-postit-panel cn-sticker-panel--glass"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            role="dialog"
            aria-label="Post-its"
          >
            <header className="cn-sticker-panel-head">
              <div>
                <StickyNote size={18} />
                <span className="cn-sticker-panel-title">Post-its</span>
                <p className="cn-sticker-panel-hint">Editables · redimensionables en la hoja</p>
              </div>
              <button type="button" className="cn-glass-icon-btn" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>

            <div className="cn-sticker-panel-body">
              <div className="cn-sticker-pack-filters">
                {POSTIT_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={category === c.id ? "is-on" : ""}
                    onClick={() => setCategory(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="cn-sticker-postit-grid cn-sticker-postit-grid--premium">
                {styles.map((s) => (
                  <button
                    key={`${category}-${s.color}`}
                    type="button"
                    className="cn-sticker-postit-btn cn-draggable-source"
                    style={{
                      background: s.bg,
                      borderColor: s.border,
                      color: s.text,
                      boxShadow: `0 4px 14px ${s.shadow}`,
                    }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        DECORATION_DRAG_MIME,
                        encodeDecorationDrag({
                          type: "postit",
                          color: s.color,
                          category,
                        }),
                      );
                    }}
                    onClick={() => addPostIt(s.color)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
