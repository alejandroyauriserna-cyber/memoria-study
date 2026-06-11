"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, Users, X } from "lucide-react";
import {
  JURISPRUDENCE_MATERIA_LABELS,
  JURISPRUDENCE_TIPO_LABELS,
} from "@/lib/jurisprudence/labels";
import { JURISPRUDENCE_MATERIAS, JURISPRUDENCE_TIPOS } from "@/types/jurisprudence";
import type { JurisprudenceRecord } from "@/types/jurisprudence";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitted: (record: JurisprudenceRecord) => void;
};

export function JurisprudenceContributePanel({ open, onClose, onSubmitted }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tipo, setTipo] = useState(JURISPRUDENCE_TIPOS[0]);
  const [materia, setMateria] = useState(JURISPRUDENCE_MATERIAS[0]);
  const [submateria, setSubmateria] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [organo, setOrgano] = useState("");
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState("");
  const [expediente, setExpediente] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [useLink, setUseLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setSubmateria("");
    setOrgano("");
    setSummary("");
    setKeywords("");
    setExpediente("");
    setPdfUrl("");
    setError("");
    setSuccess("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("tipo", tipo);
      formData.set("materia", materia);
      formData.set("submateria", submateria);
      formData.set("year", year);
      formData.set("organo", organo);
      formData.set("summary", summary);
      formData.set("keywords", keywords);
      if (expediente) formData.set("expediente", expediente);
      if (useLink && pdfUrl) formData.set("pdfUrl", pdfUrl);
      if (!useLink && file) formData.set("file", file);

      const response = await fetch("/api/jurisprudence/submit", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo publicar el aporte.");
      }

      setSuccess(
        payload.autoPublished
          ? "Publicado. Tu historial de aportes aprobados permite publicación automática."
          : "Recibido. Tu aporte está pendiente de revisión por un moderador UNT.",
      );
      onSubmitted(payload.document as JurisprudenceRecord);
      setTimeout(() => handleClose(), 1400);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al subir.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bj-contribute-overlay" role="dialog" aria-modal="true" aria-labelledby="bj-contribute-title">
      <button type="button" className="bj-contribute-backdrop" onClick={handleClose} aria-label="Cerrar" />
      <div className="bj-contribute-panel">
        <header className="bj-contribute-head">
          <div>
            <p className="bj-contribute-kicker">
              <Users size={14} />
              Aporte comunitario
            </p>
            <h2 id="bj-contribute-title">Comparte una sentencia o resolución</h2>
            <p className="bj-contribute-lead">
              Solo cuentas @unitru.edu.pe con correo confirmado. Sube el PDF o pega un enlace oficial (PJ, TC, SUNAT, SPIJ o LP).
              Los primeros aportes pasan por moderación; tras varios aprobados se publican automáticamente.
            </p>
          </div>
          <button type="button" className="bj-contribute-close" onClick={handleClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <form className="bj-contribute-form" onSubmit={handleSubmit}>
          <div className="bj-contribute-grid">
            <label className="bj-contribute-field bj-contribute-field--wide">
              <span>Título *</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Casación 1465-2007-Lima"
                required
              />
            </label>

            <label className="bj-contribute-field">
              <span>Tipo *</span>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
                {JURISPRUDENCE_TIPOS.map((value) => (
                  <option key={value} value={value}>
                    {JURISPRUDENCE_TIPO_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="bj-contribute-field">
              <span>Materia *</span>
              <select value={materia} onChange={(e) => setMateria(e.target.value as typeof materia)}>
                {JURISPRUDENCE_MATERIAS.map((value) => (
                  <option key={value} value={value}>
                    {JURISPRUDENCE_MATERIA_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="bj-contribute-field">
              <span>Tema / Submateria *</span>
              <input
                value={submateria}
                onChange={(e) => setSubmateria(e.target.value)}
                placeholder="Ej. Simulación absoluta"
                required
              />
            </label>

            <label className="bj-contribute-field">
              <span>Año *</span>
              <input
                type="number"
                min={1900}
                max={2100}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
            </label>

            <label className="bj-contribute-field bj-contribute-field--wide">
              <span>Órgano emisor *</span>
              <input
                value={organo}
                onChange={(e) => setOrgano(e.target.value)}
                placeholder="Ej. Sala Civil Permanente — Corte Suprema"
                required
              />
            </label>

            <label className="bj-contribute-field">
              <span>Expediente</span>
              <input
                value={expediente}
                onChange={(e) => setExpediente(e.target.value)}
                placeholder="Ej. 1465-2007-Lima"
              />
            </label>

            <label className="bj-contribute-field">
              <span>Palabras clave</span>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="simulación, acto jurídico, nulidad"
              />
            </label>

            <label className="bj-contribute-field bj-contribute-field--wide">
              <span>Resumen breve *</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                placeholder="Resume el criterio jurídico principal en 2-4 oraciones..."
                required
                minLength={40}
              />
            </label>
          </div>

          <div className="bj-contribute-source">
            <div className="bj-contribute-source-tabs">
              <button
                type="button"
                className={!useLink ? "is-active" : ""}
                onClick={() => setUseLink(false)}
              >
                Subir PDF
              </button>
              <button
                type="button"
                className={useLink ? "is-active" : ""}
                onClick={() => setUseLink(true)}
              >
                Enlace oficial
              </button>
            </div>

            {!useLink ? (
              <label className="bj-contribute-upload">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Upload size={18} />
                {file ? file.name : "Seleccionar PDF (máx. 20 MB)"}
              </label>
            ) : (
              <label className="bj-contribute-field bj-contribute-field--wide">
                <span>URL del PDF o portal oficial *</span>
                <input
                  type="url"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://juris.pj.gob.pe/..."
                  required={useLink}
                />
              </label>
            )}
          </div>

          {error ? <p className="bj-contribute-error">{error}</p> : null}
          {success ? <p className="bj-contribute-success">{success}</p> : null}

          <div className="bj-contribute-actions">
            <button type="button" className="bj-contribute-btn-ghost" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="bj-contribute-btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Publicando…
                </>
              ) : (
                "Enviar a revisión"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
