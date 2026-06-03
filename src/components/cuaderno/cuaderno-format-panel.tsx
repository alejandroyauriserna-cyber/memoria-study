"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { CUADERNO_FONTS, type CuadernoFontId } from "@/lib/cuaderno/editor-fonts";
import type { CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";

const TEXT_COLORS = ["#1c1917", "#1e3a5f", "#7f1d1d", "#14532d", "#5b21b6", "#0f766e"];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecdd3", "#e9d5ff", "#fde68a"];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px"];
const LINE_HEIGHTS = [
  { id: "1.5", label: "Compacto" },
  { id: "1.78", label: "Normal" },
  { id: "2", label: "Amplio" },
  { id: "2.25", label: "Espaciado" },
];

const TONES: { id: CuadernoPaperTone; label: string }[] = [
  { id: "white", label: "Blanco" },
  { id: "ivory", label: "Marfil" },
  { id: "beige", label: "Beige" },
  { id: "warm", label: "Cálido" },
  { id: "cool", label: "Frío" },
  { id: "dark", label: "Oscuro" },
];

export function CuadernoFormatPanel({
  open,
  onClose,
  editor,
  paperTone,
  onPaperToneChange,
  lineHeight,
  onLineHeightChange,
  courseAccent,
}: {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
  paperTone: CuadernoPaperTone;
  onPaperToneChange: (tone: CuadernoPaperTone) => void;
  lineHeight: string;
  onLineHeightChange: (lh: string) => void;
  courseAccent: string;
}) {
  const [fontId, setFontId] = useState<CuadernoFontId | "">("");
  const [fontSize, setFontSize] = useState("");

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="cn-format-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="cn-format-panel"
            style={{ "--cn-accent": courseAccent } as React.CSSProperties}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
          >
            <header className="cn-format-panel-head">
              <h2>Formato</h2>
              <button type="button" onClick={onClose} aria-label="Cerrar panel">
                <X size={18} />
              </button>
            </header>

            <div className="cn-format-panel-body">
              <section className="cn-format-panel-section">
                <p className="cn-format-panel-label">Tipografía</p>
                <label className="cn-format-panel-field">
                  Fuente
                  <select
                    value={fontId}
                    onChange={(e) => {
                      const id = e.target.value as CuadernoFontId;
                      setFontId(id);
                      const font = CUADERNO_FONTS.find((f) => f.id === id);
                      if (font && editor) editor.chain().focus().setFontFamily(font.stack).run();
                    }}
                    disabled={!editor}
                  >
                    <option value="">Predeterminada</option>
                    {CUADERNO_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="cn-format-panel-field">
                  Tamaño
                  <select
                    value={fontSize}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFontSize(v);
                      if (editor && v) editor.chain().focus().setFontSize(v).run();
                    }}
                    disabled={!editor}
                  >
                    <option value="">Automático</option>
                    {FONT_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("px", " pt")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="cn-format-panel-field">
                  Interlineado
                  <select
                    value={lineHeight}
                    onChange={(e) => onLineHeightChange(e.target.value)}
                  >
                    {LINE_HEIGHTS.map((lh) => (
                      <option key={lh.id} value={lh.id}>
                        {lh.label}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="cn-format-panel-section">
                <p className="cn-format-panel-label">Color de texto</p>
                <div className="cn-format-panel-swatches">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="cn-format-panel-swatch"
                      style={{ background: c }}
                      disabled={!editor}
                      onClick={() => editor?.chain().focus().setColor(c).run()}
                    />
                  ))}
                </div>
              </section>

              <section className="cn-format-panel-section">
                <p className="cn-format-panel-label">Resaltado</p>
                <div className="cn-format-panel-swatches">
                  {HIGHLIGHTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="cn-format-panel-swatch cn-format-panel-swatch--hi"
                      style={{ background: c }}
                      disabled={!editor}
                      onClick={() => editor?.chain().focus().toggleHighlight({ color: c }).run()}
                    />
                  ))}
                </div>
              </section>

              <section className="cn-format-panel-section">
                <p className="cn-format-panel-label">Tono del papel</p>
                <div className="cn-format-panel-chips">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="cn-format-panel-chip"
                      data-active={paperTone === t.id}
                      onClick={() => onPaperToneChange(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
