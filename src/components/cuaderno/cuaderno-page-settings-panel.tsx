"use client";

import { Settings2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CuadernoPage } from "@/lib/cuaderno/cuaderno-pages";
import type { CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";
import type { CuadernoPageMargin } from "@/lib/cuaderno/page-settings";
import { WRITING_LAYOUT_OPTIONS } from "@/lib/cuaderno/page-settings";
import { PAGE_SIZE_OPTIONS } from "@/lib/cuaderno/page-size";
import { getTemplate } from "@/lib/cuaderno/templates";
import { CuadernoPaperPreview } from "@/components/cuaderno/cuaderno-paper-preview";

const TONES: { id: CuadernoPaperTone; label: string }[] = [
  { id: "white", label: "Blanco" },
  { id: "ivory", label: "Marfil" },
  { id: "beige", label: "Beige" },
  { id: "warm", label: "Cálido" },
  { id: "cool", label: "Frío" },
  { id: "dark", label: "Oscuro" },
];

const MARGINS: { id: CuadernoPageMargin; label: string }[] = [
  { id: "narrow", label: "Estrechos" },
  { id: "normal", label: "Normales" },
  { id: "wide", label: "Amplios" },
];

export function CuadernoPageSettingsPanel({
  open,
  onClose,
  page,
  onChange,
  onOpenTemplateGallery,
}: {
  open: boolean;
  onClose: () => void;
  page: CuadernoPage;
  onChange: (patch: Partial<CuadernoPage>) => void;
  onOpenTemplateGallery?: () => void;
}) {
  const template = getTemplate(page.templateId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const panel = (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="cn-page-settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="cn-page-settings-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <header className="cn-page-settings-head">
              <div className="cn-page-settings-head-icon">
                <Settings2 size={18} />
              </div>
              <div>
                <h2>Configuración de página</h2>
                <p>Solo afecta esta hoja — las demás mantienen su plantilla.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>

            <section className="cn-page-settings-section">
              <p className="cn-page-settings-label">Plantilla actual</p>
              <div className="cn-page-settings-current">
                <CuadernoPaperPreview template={template} size="sm" />
                <div className="cn-page-settings-current-meta">
                  <strong>{template.icon} {template.label}</strong>
                  <span>{template.description}</span>
                </div>
              </div>
              <button type="button" className="cn-page-settings-cta" onClick={onOpenTemplateGallery}>
                Cambiar plantilla…
              </button>
              <p className="cn-page-settings-template-hint">
                Ahí eliges el tipo de hoja: cuadriculado, rayado, Cornell o formatos para apuntes de derecho.
              </p>
            </section>

            <section className="cn-page-settings-section">
              <p className="cn-page-settings-label">Color de papel</p>
              <div className="cn-page-settings-chips">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="cn-page-settings-chip"
                    data-active={page.paperTone === t.id}
                    onClick={() => onChange({ paperTone: t.id })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="cn-page-settings-section">
              <p className="cn-page-settings-label">Modo de escritura</p>
              <div className="cn-page-settings-chips cn-page-settings-chips--stack">
                {WRITING_LAYOUT_OPTIONS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className="cn-page-settings-chip cn-page-settings-chip--desc"
                    data-active={page.writingLayout === w.id}
                    onClick={() =>
                      onChange({
                        writingLayout: w.id,
                        ...(w.id === "free" ? { pageSizeMode: "infinite" as const } : {}),
                      })
                    }
                  >
                    <span>{w.label}</span>
                    <span className="cn-page-settings-chip-hint">{w.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="cn-page-settings-section">
              <p className="cn-page-settings-label">Tamaño de hoja</p>
              <div className="cn-page-settings-chips">
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="cn-page-settings-chip"
                    data-active={page.pageSizeMode === s.id}
                    onClick={() => onChange({ pageSizeMode: s.id })}
                    title={s.description}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="cn-page-settings-section">
              <p className="cn-page-settings-label">Márgenes</p>
              <div className="cn-page-settings-chips">
                {MARGINS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="cn-page-settings-chip"
                    data-active={page.marginMode === m.id}
                    onClick={() => onChange({ marginMode: m.id })}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="cn-page-settings-section">
              <p className="cn-page-settings-label">Portada de página</p>
              <div className="cn-page-settings-cover-row">
                <span className="cn-page-settings-cover-emoji">
                  {page.cover?.emoji ?? page.cover?.icon ?? template.icon}
                </span>
                <input
                  type="text"
                  placeholder="Emoji (ej. ⚖)"
                  maxLength={4}
                  defaultValue={page.cover?.emoji ?? ""}
                  onBlur={(e) => {
                    const emoji = e.target.value.trim() || template.icon;
                    onChange({
                      cover: {
                        icon: emoji,
                        emoji,
                        keyword: page.title,
                        tint: page.cover?.tint ?? "#00E5C3",
                      },
                    });
                  }}
                />
              </div>
            </section>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}

/** Botón flotante sobre la hoja */
export function CuadernoPageSettingsTrigger({
  page,
  onClick,
}: {
  page: CuadernoPage;
  onClick: () => void;
}) {
  const template = getTemplate(page.templateId);
  return (
    <button type="button" className="cn-page-settings-trigger" onClick={onClick}>
      <Settings2 size={14} />
      <span className="cn-page-settings-trigger-template">
        {template.icon} {template.label}
      </span>
    </button>
  );
}
