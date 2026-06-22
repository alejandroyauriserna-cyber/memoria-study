"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { Loader2, Scale, Sparkles, Upload, Users, X } from "lucide-react";
import {
  confidenceClass,
  formatConfidencePct,
  markAiFilledFields,
  suggestedToContributionForm,
  type AiFilledFields,
} from "@/lib/jurisprudence/apply-suggested-metadata";
import {
  JURISPRUDENCE_MATERIA_LABELS,
  JURISPRUDENCE_TIPO_LABELS,
} from "@/lib/jurisprudence/labels";
import { JURISPRUDENCE_MATERIAS, JURISPRUDENCE_TIPOS } from "@/types/jurisprudence";
import {
  JURISPRUDENCE_MAX_FILE_SIZE,
  jurisprudenceMaxFileSizeLabel,
} from "@/lib/jurisprudence/upload-limits";
import type { JurisprudenceFieldConfidence, JurisprudenceSuggestedMetadata } from "@/types/jurisprudence-ingest";
import type { JurisprudenceRecord } from "@/types/jurisprudence";
import { parseJsonResponse } from "@/lib/api/parse-json-response";
import { extractStudyDocumentTextClient } from "@/lib/documents/extract-client";
import { preparePdfForUpload } from "@/lib/pdf/prepare-pdf-upload";
import { uploadJurisprudencePdfToStorage } from "@/lib/jurisprudence/upload-jurisprudence-pdf-client";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitted: (record: JurisprudenceRecord) => void;
};

function isPdfFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
}

function FieldLabel({
  children,
  aiFilled,
  confidence,
}: {
  children: React.ReactNode;
  aiFilled?: boolean;
  confidence?: number;
}) {
  const pct = formatConfidencePct(confidence);
  return (
    <span className="bj-contribute-field-label">
      {children}
      {aiFilled ? (
        <span className={`bj-contribute-ai-badge ${confidenceClass(confidence)}`}>
          <Sparkles size={10} aria-hidden />
          IA{pct ? ` ${pct}` : ""}
        </span>
      ) : null}
    </span>
  );
}

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
  const [asuntoPrincipal, setAsuntoPrincipal] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [useLink, setUseLink] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<JurisprudenceFieldConfidence | null>(null);
  const [aiFilled, setAiFilled] = useState<AiFilledFields>({});
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [analyzeMessage, setAnalyzeMessage] = useState("");

  const resetForm = useCallback(() => {
    setFile(null);
    setTitle("");
    setSubmateria("");
    setOrgano("");
    setSummary("");
    setKeywords("");
    setExpediente("");
    setAsuntoPrincipal("");
    setPdfUrl("");
    setIsDragging(false);
    setAnalyzed(false);
    setPreparing(false);
    setManualEntry(false);
    setAiConfidence(null);
    setAiFilled({});
    setOverallConfidence(null);
    setAnalyzeMessage("");
    setError("");
    setSuccess("");
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const applySuggested = useCallback(
    (
      suggested: JurisprudenceSuggestedMetadata,
      confidence: JurisprudenceFieldConfidence,
      overall: number,
      asunto?: string | null,
    ) => {
      const form = suggestedToContributionForm(suggested);
      setTitle(form.title);
      setTipo(form.tipo as typeof tipo);
      setMateria(form.materia as typeof materia);
      setSubmateria(form.submateria);
      setYear(form.year);
      setOrgano(form.organo);
      setSummary(form.summary);
      setKeywords(form.keywords);
      setExpediente(form.expediente);
      setAsuntoPrincipal(asunto ?? suggested.asuntoPrincipal ?? "");
      setAiConfidence(confidence);
      setAiFilled(markAiFilledFields(confidence));
      setOverallConfidence(overall);
      setAnalyzed(true);
    },
    [],
  );

  const analyzeSource = useCallback(
    async (nextFile?: File | null, nextUrl?: string) => {
      setAnalyzing(true);
      setError("");
      setAnalyzeMessage("Leyendo PDF…");

      try {
        let response: Response;

        if (nextFile) {
          setAnalyzeMessage("Leyendo PDF en tu navegador…");
          const { text, method } = await extractStudyDocumentTextClient(nextFile, {
            onProgress: setAnalyzeMessage,
          });

          setAnalyzeMessage("La IA está catalogando el documento…");

          response = await fetch("/api/jurisprudence/analyze-contribution", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              fileName: nextFile.name,
              text,
              extractionMethod: method,
            }),
          });
        } else if (nextUrl?.trim()) {
          const formData = new FormData();
          formData.set("pdfUrl", nextUrl.trim());

          setAnalyzeMessage("La IA está catalogando el documento…");

          response = await fetch("/api/jurisprudence/analyze-contribution", {
            method: "POST",
            body: formData,
          });
        } else {
          throw new Error("Selecciona un PDF o pega un enlace oficial.");
        }

        const payload = await parseJsonResponse<{
          error?: string;
          manualEntryAllowed?: boolean;
          aiProviders?: {
            gemini?: boolean;
            openrouter?: boolean;
            openRouterAttempted?: boolean;
          };
          suggested?: JurisprudenceSuggestedMetadata;
          confidence?: JurisprudenceFieldConfidence;
          overallConfidence?: number;
          needsReview?: boolean;
          asuntoPrincipal?: string | null;
          catalogProvider?: "gemini" | "openrouter" | "xai" | "openai";
          catalogModel?: string;
        }>(response);

        if (!response.ok) {
          if (payload.manualEntryAllowed || payload.error) {
            setManualEntry(true);
          }
          throw new Error(payload.error ?? "No se pudo analizar el documento.");
        }

        if (!payload.suggested || !payload.confidence) {
          throw new Error("El servidor no devolvió metadatos sugeridos.");
        }

        applySuggested(
          payload.suggested,
          payload.confidence,
          payload.overallConfidence as number,
          payload.asuntoPrincipal ?? null,
        );

        const fallbackNote =
          payload.catalogProvider === "openrouter"
            ? " Catalogado con OpenRouter (respaldo gratuito)."
            : "";

        setAnalyzeMessage(
          (payload.needsReview
            ? "Revisa los campos marcados en amarillo antes de enviar."
            : "Metadatos detectados. Revisa y envía cuando estés listo.") + fallbackNote,
        );
        setManualEntry(false);
      } catch (caught) {
        const raw = caught instanceof Error ? caught.message : "Error al analizar.";
        setManualEntry(true);
        setError(raw);
        setAnalyzeMessage("Completa el formulario manualmente. Tu PDF ya está listo para enviar.");
      } finally {
        setAnalyzing(false);
      }
    },
    [applySuggested],
  );

  const acceptPdfFile = useCallback(
    async (next: File | null | undefined) => {
      if (!next) return;
      if (!isPdfFile(next)) {
        setError("Solo se admiten archivos PDF.");
        return;
      }
      if (next.size > JURISPRUDENCE_MAX_FILE_SIZE) {
        setError(`El PDF no puede superar ${jurisprudenceMaxFileSizeLabel()}.`);
        return;
      }
      setUseLink(false);
      setError("");
      setAnalyzed(false);
      setManualEntry(false);
      setAiConfidence(null);
      setAiFilled({});
      setOverallConfidence(null);
      setFile(next);
      setPreparing(true);
      setAnalyzeMessage("Recibimos tu PDF. Preparando…");

      let workingFile = next;
      try {
        const prepared = await preparePdfForUpload(next, { onProgress: setAnalyzeMessage });
        workingFile = prepared.file;
        setFile(prepared.file);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo preparar el PDF.");
        setAnalyzeMessage("");
        setPreparing(false);
        return;
      }

      setPreparing(false);
      await analyzeSource(workingFile);
    },
    [analyzeSource],
  );

  const onDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!useLink) setIsDragging(true);
  }, [useLink]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    if (!useLink) setIsDragging(true);
  }, [useLink]);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      if (useLink) return;
      void acceptPdfFile(event.dataTransfer.files?.[0]);
    },
    [acceptPdfFile, useLink],
  );

  useEffect(() => {
    if (!open) return;
    const blockWindowDrop = (event: globalThis.DragEvent) => {
      event.preventDefault();
    };
    window.addEventListener("dragover", blockWindowDrop);
    window.addEventListener("drop", blockWindowDrop);
    return () => {
      window.removeEventListener("dragover", blockWindowDrop);
      window.removeEventListener("drop", blockWindowDrop);
    };
  }, [open]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (next: File | null) => {
    void acceptPdfFile(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openFilePicker = () => {
    if (!fileRef.current) return;
    fileRef.current.value = "";
    fileRef.current.click();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      let storagePath: string | undefined;
      let uploadedFileName: string | undefined;

      if (!useLink && file) {
        const uploaded = await uploadJurisprudencePdfToStorage(file);
        storagePath = uploaded.storagePath;
        uploadedFileName = uploaded.fileName;
      }

      const response = await fetch("/api/jurisprudence/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title,
          tipo,
          materia,
          submateria,
          year: Number(year),
          organo,
          summary,
          keywords,
          expediente: expediente || null,
          pdfUrl: useLink && pdfUrl.trim() ? pdfUrl.trim() : null,
          storagePath,
          fileName: uploadedFileName,
        }),
      });
      const payload = await parseJsonResponse<{
        error?: string;
        autoPublished?: boolean;
        document?: JurisprudenceRecord;
      }>(response);

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

  const canSubmit =
    (analyzed || manualEntry) &&
    !analyzing &&
    !preparing &&
    (useLink ? Boolean(pdfUrl.trim()) : Boolean(file));

  if (!open) return null;

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
              Sube el PDF y la IA detecta título, materia, expediente y resumen. Los archivos pesados
              se optimizan y suben automáticamente — no necesitas herramientas externas.
              Cuentas @unitru.edu.pe con correo confirmado. Enlaces oficiales: PJ, TC, SUNAT, SPIJ o LP.
            </p>
          </div>
          <button type="button" className="bj-contribute-close" onClick={handleClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <form className="bj-contribute-form" onSubmit={handleSubmit}>
          <section className="bj-contribute-section">
            <div className="bj-contribute-section__head">
              <div>
                <h3>Documento fuente</h3>
                <p>Arrastra el PDF o pega un enlace oficial. La IA catalogará la sentencia por ti.</p>
              </div>
              <span className="bj-contribute-section__icon" aria-hidden>
                <Upload size={18} />
              </span>
            </div>

            <div className="bj-contribute-source bj-contribute-source--first">
            <div className="bj-contribute-source-tabs">
              <button
                type="button"
                className={!useLink ? "is-active" : ""}
                onClick={() => {
                  setUseLink(false);
                  setAnalyzed(false);
                  setManualEntry(false);
                  setAnalyzeMessage("");
                }}
              >
                Subir PDF
              </button>
              <button
                type="button"
                className={useLink ? "is-active" : ""}
                onClick={() => {
                  setUseLink(true);
                  setAnalyzed(false);
                  setManualEntry(false);
                  setAnalyzeMessage("");
                }}
              >
                Enlace oficial
              </button>
            </div>

            {!useLink ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
                <div
                  role="button"
                  tabIndex={0}
                  className={`bj-contribute-upload${isDragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
                  onClick={openFilePicker}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openFilePicker();
                    }
                  }}
                  onDragEnter={onDragEnter}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <Upload size={22} strokeWidth={1.6} />
                  <strong>
                    {file?.name ?? (isDragging ? "Suelta el PDF aquí" : "Arrastra o selecciona tu PDF")}
                  </strong>
                  <span>
                    {file
                      ? "Toca o arrastra otro archivo para cambiar"
                      : `Máximo ${jurisprudenceMaxFileSizeLabel()} · la IA completará el formulario`}
                  </span>
                </div>
              </>
            ) : (
              <div className="bj-contribute-link-row">
                <label className="bj-contribute-field bj-contribute-field--wide">
                  <span>URL del PDF o portal oficial *</span>
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => {
                      setPdfUrl(e.target.value);
                      setAnalyzed(false);
                      setAnalyzeMessage("");
                    }}
                    placeholder="https://juris.pj.gob.pe/..."
                  />
                </label>
                <button
                  type="button"
                  className="bj-contribute-analyze-btn"
                  disabled={analyzing || !pdfUrl.trim()}
                  onClick={() => void analyzeSource(null, pdfUrl)}
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Analizando…
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Analizar con IA
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {preparing || analyzing ? (
            <div className="bj-contribute-analyze-status" role="status">
              <Loader2 size={18} className="animate-spin" />
              <div>
                <p className="bj-contribute-analyze-status__title">
                  {preparing ? "Preparando PDF" : "Analizando documento"}
                </p>
                <p className="bj-contribute-analyze-status__hint">{analyzeMessage || "Procesando…"}</p>
              </div>
            </div>
          ) : null}

          {!preparing && !analyzing && analyzed && overallConfidence !== null ? (
            <div
              className={`bj-contribute-ai-summary ${overallConfidence >= 0.85 ? "is-high" : overallConfidence >= 0.7 ? "is-mid" : "is-low"}`}
            >
              <Sparkles size={16} />
              <div>
                <p className="bj-contribute-ai-summary__title">
                  IA catalogó el documento · confianza {Math.round(overallConfidence * 100)}%
                </p>
                <p className="bj-contribute-ai-summary__hint">
                  {analyzeMessage || "Revisa los campos y envía cuando esté correcto."}
                  {asuntoPrincipal ? ` Asunto: ${asuntoPrincipal}` : ""}
                </p>
              </div>
            </div>
          ) : null}
          </section>

          <fieldset
            className="bj-contribute-section bj-contribute-grid"
            disabled={(!analyzed && !manualEntry) || analyzing || preparing}
          >
            <legend className="sr-only">Metadatos del aporte</legend>

            <div className="bj-contribute-section__head bj-contribute-section__head--grid">
              <div>
                <h3>Metadatos jurídicos</h3>
                <p>Revisa lo detectado por la IA o edita antes de enviar a moderación.</p>
              </div>
              <span className="bj-contribute-section__icon" aria-hidden>
                <Scale size={18} />
              </span>
            </div>

            <label className="bj-contribute-field bj-contribute-field--wide">
              <FieldLabel aiFilled={aiFilled.title} confidence={aiConfidence?.title}>
                Título *
              </FieldLabel>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Casación 1465-2007-Lima"
                required
              />
            </label>

            <label className="bj-contribute-field">
              <FieldLabel aiFilled={aiFilled.tipo} confidence={aiConfidence?.tipo}>
                Tipo *
              </FieldLabel>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
                {JURISPRUDENCE_TIPOS.map((value) => (
                  <option key={value} value={value}>
                    {JURISPRUDENCE_TIPO_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="bj-contribute-field">
              <FieldLabel aiFilled={aiFilled.materia} confidence={aiConfidence?.materia}>
                Materia *
              </FieldLabel>
              <select value={materia} onChange={(e) => setMateria(e.target.value as typeof materia)}>
                {JURISPRUDENCE_MATERIAS.map((value) => (
                  <option key={value} value={value}>
                    {JURISPRUDENCE_MATERIA_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="bj-contribute-field">
              <FieldLabel aiFilled={aiFilled.submateria} confidence={aiConfidence?.submateria}>
                Tema / Submateria *
              </FieldLabel>
              <input
                value={submateria}
                onChange={(e) => setSubmateria(e.target.value)}
                placeholder="Ej. Simulación absoluta"
                required
              />
            </label>

            <label className="bj-contribute-field">
              <FieldLabel aiFilled={aiFilled.year} confidence={aiConfidence?.year}>
                Año *
              </FieldLabel>
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
              <FieldLabel aiFilled={aiFilled.organo} confidence={aiConfidence?.organo}>
                Órgano emisor *
              </FieldLabel>
              <input
                value={organo}
                onChange={(e) => setOrgano(e.target.value)}
                placeholder="Ej. Sala Civil Permanente — Corte Suprema"
                required
              />
            </label>

            <label className="bj-contribute-field">
              <FieldLabel aiFilled={aiFilled.expediente} confidence={aiConfidence?.expediente ?? aiConfidence?.numeroDocumento}>
                Expediente
              </FieldLabel>
              <input
                value={expediente}
                onChange={(e) => setExpediente(e.target.value)}
                placeholder="Ej. 1465-2007-Lima"
              />
            </label>

            <label className="bj-contribute-field">
              <FieldLabel aiFilled={aiFilled.keywords} confidence={aiConfidence?.keywords}>
                Palabras clave
              </FieldLabel>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="simulación, acto jurídico, nulidad"
              />
            </label>

            <label className="bj-contribute-field bj-contribute-field--wide">
              <FieldLabel aiFilled={aiFilled.summary} confidence={aiConfidence?.summary}>
                Resumen breve *
              </FieldLabel>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                placeholder="Resume el criterio jurídico principal en 2-4 oraciones..."
                required
                minLength={40}
              />
            </label>
          </fieldset>

          {!analyzed && !manualEntry && !analyzing && !preparing ? (
            <p className="bj-contribute-hint bj-contribute-hint--section">
              Primero sube el PDF (o analiza un enlace). La IA completará el formulario por ti.
            </p>
          ) : null}

          {manualEntry && !analyzed ? (
            <p className="bj-contribute-hint bj-contribute-hint--section">
              La IA no pudo catalogar este documento. Completa los campos manualmente y envía a revisión.
            </p>
          ) : null}

          {error ? <p className="bj-contribute-error">{error}</p> : null}
          {success ? <p className="bj-contribute-success">{success}</p> : null}

          <div className="bj-contribute-actions">
            <button type="button" className="bj-contribute-btn-ghost" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="bj-contribute-btn-primary" disabled={submitting || !canSubmit}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Publicando…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Enviar a revisión
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
