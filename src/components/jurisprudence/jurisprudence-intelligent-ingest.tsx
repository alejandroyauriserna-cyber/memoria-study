"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Cpu,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  JURISPRUDENCE_MATERIA_LABELS,
  JURISPRUDENCE_TIPO_LABELS,
} from "@/lib/jurisprudence/labels";
import type { IngestBatchSummary, IngestReviewItem } from "@/types/jurisprudence-ingest";
import type { JurisprudenceMateria } from "@/types/jurisprudence";

function confidenceClass(value?: number): string {
  if (value === undefined) return "";
  if (value >= 0.85) return "is-high";
  if (value >= 0.7) return "is-mid";
  return "is-low";
}

function formatConfidence(value?: number): string {
  if (value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

function statusLabel(status: string): string {
  switch (status) {
    case "queued":
      return "En cola";
    case "extracting":
      return "Extrayendo…";
    case "analyzing":
      return "IA analizando…";
    case "ready":
      return "Listo";
    case "low_confidence":
      return "Revisar";
    case "duplicate":
      return "Duplicado";
    case "failed":
      return "Error";
    case "published":
      return "Publicado";
    case "approved":
      return "Aprobado";
    default:
      return status;
  }
}

export function JurisprudenceIntelligentIngest({ onPublished }: { onPublished?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [batches, setBatches] = useState<IngestBatchSummary[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [items, setItems] = useState<IngestReviewItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadBusy, setUploadBusy] = useState(false);
  const [processBusy, setProcessBusy] = useState(false);
  const [approveBusy, setApproveBusy] = useState(false);
  const [batchLabel, setBatchLabel] = useState("");
  const [publishOnApprove, setPublishOnApprove] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [batchEditMateria, setBatchEditMateria] = useState<JurisprudenceMateria | "">("");

  const loadBatches = useCallback(async () => {
    const res = await fetch("/api/jurisprudence/admin/ingest");
    if (!res.ok) return;
    const payload = await res.json();
    setBatches(payload.batches ?? []);
  }, []);

  const loadBatch = useCallback(async (batchId: string) => {
    const res = await fetch(`/api/jurisprudence/admin/ingest?batchId=${batchId}`);
    if (!res.ok) throw new Error("No se pudo cargar el lote.");
    const payload = await res.json();
    setItems(payload.items ?? []);
    setActiveBatchId(batchId);
    setSelected(new Set());
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploadBusy(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }
      if (batchLabel.trim()) formData.set("label", batchLabel.trim());

      const res = await fetch("/api/jurisprudence/admin/ingest", {
        method: "POST",
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error al subir.");

      setMessage(
        `Subidos ${payload.uploaded} PDFs${payload.failed ? ` · ${payload.failed} fallidos` : ""}.`,
      );
      await loadBatches();
      if (payload.batchId) {
        await loadBatch(payload.batchId);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error de subida.");
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function runProcess(loop = false) {
    if (!activeBatchId) return;
    setProcessBusy(true);
    setError("");
    try {
      let remaining = 1;
      let totalProcessed = 0;

      while (remaining > 0) {
        const res = await fetch("/api/jurisprudence/admin/ingest/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: activeBatchId, limit: 5 }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Error al procesar.");
        totalProcessed += payload.processed ?? 0;
        remaining = payload.remaining ?? 0;
        await loadBatch(activeBatchId);
        if (!loop) break;
      }

      setMessage(`IA procesó ${totalProcessed} documento(s).`);
      await loadBatches();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error de procesamiento.");
    } finally {
      setProcessBusy(false);
    }
  }

  async function approveSelected(approveAll = false) {
    if (!activeBatchId) return;
    setApproveBusy(true);
    setError("");
    try {
      const res = await fetch("/api/jurisprudence/admin/ingest/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: activeBatchId,
          approveAll,
          itemIds: approveAll ? undefined : [...selected],
          publish: publishOnApprove,
          onlyReady: approveAll,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error al aprobar.");
      setMessage(`Publicados/aprobados: ${payload.approved}. Fallidos: ${payload.failed}.`);
      await loadBatch(activeBatchId);
      await loadBatches();
      onPublished?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al aprobar.");
    } finally {
      setApproveBusy(false);
    }
  }

  async function reprocessSelected() {
    if (!selected.size) return;
    setProcessBusy(true);
    try {
      await fetch("/api/jurisprudence/admin/ingest/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reprocess", itemIds: [...selected] }),
      });
      if (activeBatchId) await runProcess(true);
    } finally {
      setProcessBusy(false);
    }
  }

  async function batchEditMateriaApply() {
    if (!batchEditMateria || !selected.size) return;
    setApproveBusy(true);
    try {
      await fetch("/api/jurisprudence/admin/ingest/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "patch",
          itemIds: [...selected],
          patch: { materia: batchEditMateria },
        }),
      });
      if (activeBatchId) await loadBatch(activeBatchId);
    } finally {
      setApproveBusy(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const reviewable = items.filter(
      (i) => i.status === "ready" || i.status === "low_confidence",
    );
    if (selected.size === reviewable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reviewable.map((i) => i.id)));
    }
  }

  const queuedCount = items.filter((i) => i.status === "queued" || i.status === "failed").length;

  return (
    <section className="bj-admin__ingest-ai">
      <div className="bj-admin__import-head">
        <div>
          <h2>
            <Sparkles size={18} className="inline text-accent" /> Ingesta inteligente (PDF)
          </h2>
          <p>
            Sube cientos de PDFs. La IA extrae texto, detecta materia, órgano, asunto y genera el
            resumen. Tú solo revisas y apruebas.
          </p>
        </div>
        <Cpu size={22} aria-hidden />
      </div>

      <div className="bj-ingest-upload-row">
        <input
          type="text"
          placeholder="Nombre del lote (opcional)"
          value={batchLabel}
          onChange={(e) => setBatchLabel(e.target.value)}
          className="bj-ingest-label-input"
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          disabled={uploadBusy}
          onChange={(e) => void handleUpload(e.target.files)}
        />
        {uploadBusy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
      </div>

      {batches.length ? (
        <div className="bj-ingest-batches">
          <p className="bj-ingest-batches-label">Lotes recientes</p>
          <div className="bj-ingest-batch-chips">
            {batches.map((b) => (
              <button
                key={b.id}
                type="button"
                className={activeBatchId === b.id ? "is-active" : ""}
                onClick={() => void loadBatch(b.id)}
              >
                {b.label || `Lote ${b.id.slice(0, 8)}`} · {b.processedCount}/{b.totalCount}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeBatchId ? (
        <>
          <div className="bj-ingest-toolbar">
            <button
              type="button"
              disabled={processBusy || !queuedCount}
              onClick={() => void runProcess(true)}
            >
              {processBusy ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
              Analizar con IA {queuedCount ? `(${queuedCount})` : ""}
            </button>
            <button type="button" disabled={approveBusy} onClick={() => void approveSelected(true)}>
              {approveBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              Aprobar todos listos
            </button>
            <button
              type="button"
              disabled={approveBusy || !selected.size}
              onClick={() => void approveSelected(false)}
            >
              <Check size={14} />
              Aprobar seleccionados ({selected.size})
            </button>
            <button
              type="button"
              disabled={processBusy || !selected.size}
              onClick={() => void reprocessSelected()}
            >
              <RefreshCw size={14} />
              Reprocesar
            </button>
            <label className="bj-ingest-publish-flag">
              <input
                type="checkbox"
                checked={publishOnApprove}
                onChange={(e) => setPublishOnApprove(e.target.checked)}
              />
              Publicar al aprobar
            </label>
            <div className="bj-ingest-batch-edit">
              <select
                value={batchEditMateria}
                onChange={(e) => setBatchEditMateria(e.target.value as JurisprudenceMateria | "")}
              >
                <option value="">Editar materia en lote…</option>
                {Object.entries(JURISPRUDENCE_MATERIA_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!batchEditMateria || !selected.size || approveBusy}
                onClick={() => void batchEditMateriaApply()}
              >
                Aplicar
              </button>
            </div>
          </div>

          <div className="bj-ingest-table-wrap">
            <table className="bj-ingest-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      onChange={toggleSelectAll}
                      checked={
                        selected.size > 0 &&
                        selected.size ===
                          items.filter((i) => i.status === "ready" || i.status === "low_confidence")
                            .length
                      }
                    />
                  </th>
                  <th>Documento</th>
                  <th>Materia</th>
                  <th>Submateria</th>
                  <th>Confianza</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      item.needsReview ? "needs-review" : item.status === "ready" ? "is-ready" : ""
                    }
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        disabled={
                          item.status !== "ready" && item.status !== "low_confidence"
                        }
                      />
                    </td>
                    <td className="bj-ingest-doc-cell">
                      <strong title={item.suggested?.title ?? item.fileName}>
                        {item.suggested?.title?.slice(0, 72) ?? item.fileName}
                      </strong>
                      {item.suggested?.summary ? (
                        <p className="bj-ingest-summary">{item.suggested.summary}</p>
                      ) : null}
                      {item.duplicateOf ? (
                        <p className="bj-ingest-dup">Duplicado: {item.duplicateOf}</p>
                      ) : null}
                      {item.errorMessage ? (
                        <p className="bj-ingest-err">{item.errorMessage}</p>
                      ) : null}
                    </td>
                    <td>
                      {item.suggested?.materia ? (
                        <span
                          className={`bj-ingest-conf ${confidenceClass(item.confidence?.materia)}`}
                        >
                          {JURISPRUDENCE_MATERIA_LABELS[item.suggested.materia]} (
                          {formatConfidence(item.confidence?.materia)})
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {item.suggested?.submateria ? (
                        <span
                          className={`bj-ingest-conf ${confidenceClass(item.confidence?.submateria)}`}
                        >
                          {item.suggested.submateria} (
                          {formatConfidence(item.confidence?.submateria)})
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span
                        className={`bj-ingest-overall ${item.overallConfidence >= 85 ? "is-high" : item.overallConfidence >= 70 ? "is-mid" : "is-low"}`}
                      >
                        {item.overallConfidence}%
                      </span>
                    </td>
                    <td>
                      <span className={`bj-ingest-status bj-ingest-status--${item.status}`}>
                        {statusLabel(item.status)}
                      </span>
                      {item.suggested?.tipo ? (
                        <span className="bj-ingest-tipo">
                          {JURISPRUDENCE_TIPO_LABELS[item.suggested.tipo]}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {message ? <p className="bj-admin__import-result">{message}</p> : null}
      {error ? (
        <p className="bj-results__error">
          <X size={14} /> {error}
        </p>
      ) : null}
    </section>
  );
}
