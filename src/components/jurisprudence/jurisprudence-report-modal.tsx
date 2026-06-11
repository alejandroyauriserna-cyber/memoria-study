"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

type Props = {
  open: boolean;
  documentTitle: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<boolean>;
};

export function JurisprudenceReportModal({ open, documentTitle, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError("Describe el problema con al menos 10 caracteres.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const ok = await onSubmit(trimmed);
      if (ok) {
        onClose();
      } else {
        setError("No se pudo enviar el reporte. Inténtalo de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bj-contribute-overlay" role="presentation">
      <button type="button" className="bj-contribute-backdrop" aria-label="Cerrar" onClick={onClose} />
      <div className="bj-report-modal" role="dialog" aria-labelledby="bj-report-title" aria-modal="true">
        <header className="bj-report-modal__head">
          <div>
            <p className="bj-contribute-kicker">Reportar resolución</p>
            <h2 id="bj-report-title">{documentTitle}</h2>
          </div>
          <button type="button" className="bj-contribute-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)} className="bj-report-modal__body">
          <label className="bj-contribute-field bj-contribute-field--wide">
            <span>¿Qué problema encontraste?</span>
            <textarea
              ref={textareaRef}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              placeholder="Ej.: enlace PDF roto, resumen incorrecto, duplicado, contenido inapropiado…"
              disabled={submitting}
            />
          </label>

          {error ? <p className="bj-contribute-error">{error}</p> : null}

          <div className="bj-contribute-actions">
            <button type="button" className="bj-contribute-btn-ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="bj-contribute-btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Enviar reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
