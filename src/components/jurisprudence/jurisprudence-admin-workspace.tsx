"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  Command,
  ExternalLink,
  Eye,
  EyeOff,
  Flag,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  JURISPRUDENCE_MATERIA_LABELS,
  JURISPRUDENCE_TIPO_LABELS,
} from "@/lib/jurisprudence/labels";
import type { JurisprudenceRecord } from "@/types/jurisprudence";
import { JurisprudenceIntelligentIngest } from "@/components/jurisprudence/jurisprudence-intelligent-ingest";

type AdminStats = {
  totals: {
    all: number;
    published: number;
    pending: number;
    rejected: number;
    community: number;
    openReports: number;
    submissionsLast7Days: number;
  };
  topMaterias: Array<{ materia: string; count: number }>;
};

type AdminReport = {
  id: string;
  documentId: string;
  documentTitle: string;
  reason: string;
  createdAt: string;
};

type ModeratorRow = {
  email: string;
  created_at: string;
};

type TabId = "pending" | "published" | "rejected" | "reports";

export function JurisprudenceAdminWorkspace() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tab, setTab] = useState<TabId>("pending");
  const [documents, setDocuments] = useState<JurisprudenceRecord[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const [importPublish, setImportPublish] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState("");
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [moderators, setModerators] = useState<ModeratorRow[]>([]);
  const [moderatorEmail, setModeratorEmail] = useState("");
  const [moderatorBusy, setModeratorBusy] = useState(false);

  const loadStats = useCallback(async () => {
    const response = await fetch("/api/jurisprudence/admin/stats");
    if (!response.ok) throw new Error("No se pudieron cargar las estadísticas.");
    return (await response.json()) as AdminStats;
  }, []);

  const loadDocuments = useCallback(async (status: TabId) => {
    if (status === "reports") return [];
    const response = await fetch(`/api/jurisprudence/admin/documents?status=${status}`);
    if (!response.ok) throw new Error("No se pudieron cargar los documentos.");
    const payload = (await response.json()) as { items: JurisprudenceRecord[] };
    return payload.items ?? [];
  }, []);

  const loadReports = useCallback(async () => {
    const response = await fetch("/api/jurisprudence/admin/reports");
    if (!response.ok) throw new Error("No se pudieron cargar los reportes.");
    const payload = (await response.json()) as { items: AdminReport[] };
    return payload.items ?? [];
  }, []);

  const loadModerators = useCallback(async () => {
    const response = await fetch("/api/jurisprudence/admin/moderators");
    if (!response.ok) throw new Error("No se pudieron cargar los moderadores.");
    const payload = (await response.json()) as { items: ModeratorRow[] };
    return payload.items ?? [];
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextStats, docs, reps, mods] = await Promise.all([
        loadStats(),
        tab === "reports" ? Promise.resolve([]) : loadDocuments(tab),
        loadReports(),
        loadModerators(),
      ]);
      setStats(nextStats);
      setDocuments(docs);
      setReports(reps);
      setModerators(mods);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al cargar el panel.");
    } finally {
      setLoading(false);
    }
  }, [loadDocuments, loadReports, loadStats, tab]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function moderate(documentId: string, action: "approve" | "reject" | "delete", reason?: string) {
    setBusyId(documentId);
    setError("");
    try {
      const response = await fetch("/api/jurisprudence/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          action,
          rejectionReason: reason,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Acción fallida.");
      setRejectId(null);
      setRejectReason("");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error de moderación.");
    } finally {
      setBusyId(null);
    }
  }

  async function resolveReport(reportId: string) {
    setBusyId(reportId);
    try {
      await fetch("/api/jurisprudence/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleBulkImport(file: File) {
    setImportBusy(true);
    setImportResult("");
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      if (importPublish) formData.set("publish", "1");
      const response = await fetch("/api/jurisprudence/admin/import", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        error?: string;
        imported?: number;
        failed?: number;
      };
      if (!response.ok) throw new Error(payload.error ?? "Importación fallida.");
      setImportResult(
        `Importados: ${payload.imported ?? 0}. Fallidos: ${payload.failed ?? 0}.`,
      );
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al importar CSV.");
    } finally {
      setImportBusy(false);
      if (importRef.current) importRef.current.value = "";
    }
  }

  async function addModerator(event: React.FormEvent) {
    event.preventDefault();
    const email = moderatorEmail.trim();
    if (!email) return;
    setModeratorBusy(true);
    setError("");
    try {
      const response = await fetch("/api/jurisprudence/admin/moderators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo añadir moderador.");
      setModeratorEmail("");
      setModerators(await loadModerators());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al añadir moderador.");
    } finally {
      setModeratorBusy(false);
    }
  }

  async function removeModerator(email: string) {
    if (!window.confirm(`¿Quitar a ${email} como moderador?`)) return;
    setModeratorBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/jurisprudence/admin/moderators?email=${encodeURIComponent(email)}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo quitar moderador.");
      setModerators(await loadModerators());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al quitar moderador.");
    } finally {
      setModeratorBusy(false);
    }
  }

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: "pending", label: "Pendientes", count: stats?.totals.pending },
    { id: "published", label: "Publicados", count: stats?.totals.published },
    { id: "rejected", label: "Rechazados", count: stats?.totals.rejected },
    { id: "reports", label: "Reportes", count: stats?.totals.openReports },
  ];

  return (
    <div className="bj-admin">
      <header className="bj-admin-hero bj-hero">
        <div className="bj-hero__copy">
          <Link href="/biblioteca-juridica" className="bj-admin__back">
            <ArrowLeft size={14} />
            Volver a Biblioteca Jurídica
          </Link>
          <p className="ms-home-kicker">
            <ShieldCheck size={14} />
            Moderación jurídica UNT
          </p>
          <h1>Centro de control de la Biblioteca Jurídica.</h1>
          <p className="ms-home-lead">
            Aprueba aportes estudiantiles, revisa reportes, ingesta masiva con IA o importa CSV y
            mantén la jurisprudencia curada para toda la comunidad.
          </p>
          <div className="bj-hero__signals" aria-label="Acciones de moderación">
            <span>
              <Check size={15} />
              Aprobar aportes
            </span>
            <span>
              <Flag size={15} />
              Gestionar reportes
            </span>
            <span>
              <Upload size={15} />
              Ingesta IA / CSV
            </span>
          </div>
        </div>

        <div className="bj-hero__console" aria-label="Resumen del panel admin">
          <div className="bj-hero__console-top">
            <span>
              <Command size={14} />
              Legal admin OS
            </span>
            <em>Live</em>
          </div>

          {stats ? (
            <>
              <div className="bj-admin__pulse">
                <AlertTriangle size={18} />
                <div>
                  <strong>{stats.totals.pending}</strong>
                  <span>aportes pendientes de revisión</span>
                </div>
              </div>
              <div className="bj-admin__stats bj-admin__stats--console">
                <div className="bj-admin__stat">
                  <span className="bj-admin__stat-icon">
                    <BarChart3 size={18} />
                  </span>
                  <span>
                    <strong>{stats.totals.published}</strong>
                    <em>Publicados</em>
                  </span>
                </div>
                <div className="bj-admin__stat is-warn">
                  <span className="bj-admin__stat-icon is-warn">
                    <AlertTriangle size={18} />
                  </span>
                  <span>
                    <strong>{stats.totals.pending}</strong>
                    <em>Pendientes</em>
                  </span>
                </div>
                <div className="bj-admin__stat">
                  <span className="bj-admin__stat-icon is-purple">
                    <Flag size={18} />
                  </span>
                  <span>
                    <strong>{stats.totals.openReports}</strong>
                    <em>Reportes</em>
                  </span>
                </div>
                <div className="bj-admin__stat">
                  <span className="bj-admin__stat-icon">
                    <Users size={18} />
                  </span>
                  <span>
                    <strong>{stats.totals.community}</strong>
                    <em>Comunidad</em>
                  </span>
                </div>
                <div className="bj-admin__stat">
                  <span className="bj-admin__stat-icon is-blue">
                    <Sparkles size={18} />
                  </span>
                  <span>
                    <strong>{stats.totals.submissionsLast7Days}</strong>
                    <em>Últimos 7 días</em>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="bj-admin__loading">
              <Loader2 size={18} className="animate-spin" /> Cargando resumen…
            </p>
          )}
        </div>
      </header>

      {stats?.topMaterias.length ? (
        <div className="bj-admin__materias">
          <p>Top materias publicadas</p>
          <div className="bj-admin__chips">
            {stats.topMaterias.map((entry) => (
              <span key={entry.materia} className="bj-admin__chip">
                {JURISPRUDENCE_MATERIA_LABELS[entry.materia as keyof typeof JURISPRUDENCE_MATERIA_LABELS] ??
                  entry.materia}{" "}
                · {entry.count}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <section className="bj-admin__panel">
        <JurisprudenceIntelligentIngest onPublished={() => void refresh()} />

        <section className="bj-admin__import">
          <div className="bj-admin__import-head">
            <div>
              <h2>Importación masiva (CSV)</h2>
              <p>
                Cabeceras: title, tipo, materia, submateria, year, organo, summary, keywords,
                expediente, pdfUrl. Docentes preparan el archivo y tú decides si publicar al importar.
              </p>
            </div>
            <Upload size={22} aria-hidden />
          </div>
          <div className="bj-admin__import-row">
            <input
              ref={importRef}
              type="file"
              accept=".csv,text/csv"
              disabled={importBusy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleBulkImport(file);
              }}
            />
            <label>
              <input
                type="checkbox"
                checked={importPublish}
                onChange={(event) => setImportPublish(event.target.checked)}
              />
              Publicar al importar
            </label>
            {importBusy ? <Loader2 size={16} className="animate-spin" /> : null}
          </div>
          {importResult ? <p className="bj-admin__import-result">{importResult}</p> : null}
        </section>

        <section className="bj-admin__moderators">
          <div className="bj-admin__import-head">
            <div>
              <h2>Moderadores</h2>
              <p>
                Añade correos UNT con permiso de revisión sin tocar Vercel ni SQL manual.
                También se respetan los de <code>JURISPRUDENCE_MODERATOR_EMAILS</code>.
              </p>
            </div>
            <Users size={22} aria-hidden />
          </div>
          <form className="bj-admin__moderators-form" onSubmit={(e) => void addModerator(e)}>
            <Mail size={16} aria-hidden />
            <input
              type="email"
              value={moderatorEmail}
              onChange={(e) => setModeratorEmail(e.target.value)}
              placeholder="docente@unitru.edu.pe"
              disabled={moderatorBusy}
            />
            <button type="submit" disabled={moderatorBusy || !moderatorEmail.trim()}>
              {moderatorBusy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Añadir
            </button>
          </form>
          <ul className="bj-admin__moderators-list">
            {moderators.length === 0 ? (
              <li className="bj-admin__moderators-empty">
                Sin moderadores en base de datos — usa variables de entorno o añade uno arriba.
              </li>
            ) : (
              moderators.map((row) => (
                <li key={row.email}>
                  <span>{row.email}</span>
                  <button
                    type="button"
                    disabled={moderatorBusy}
                    onClick={() => void removeModerator(row.email)}
                    aria-label={`Quitar ${row.email}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="bj-admin__tabs" role="tablist" aria-label="Secciones de moderación">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "is-active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {item.count !== undefined ? (
                <span className="bj-admin__tab-count">{item.count}</span>
              ) : null}
            </button>
          ))}
        </div>

        {error ? <p className="bj-results__error">{error}</p> : null}

        {loading ? (
          <p className="bj-admin__loading">
            <Loader2 size={18} className="animate-spin" /> Cargando…
          </p>
        ) : null}

        {!loading && tab !== "reports" ? (
          <ul className="bj-admin__list">
            {documents.length === 0 ? (
              <li className="bj-admin__empty">
                {tab === "pending" ? (
                  <>
                    No hay aportes pendientes.{" "}
                    <button type="button" onClick={() => setTab("published")}>
                      Ver publicados
                    </button>
                  </>
                ) : tab === "rejected" ? (
                  "No hay documentos rechazados."
                ) : (
                  "No hay documentos en esta categoría."
                )}
              </li>
            ) : (
              documents.map((doc) => (
                <li key={doc.id} className="bj-admin__item">
                  <div className="bj-admin__item-copy">
                    <strong>{doc.title}</strong>
                    <span>
                      {JURISPRUDENCE_TIPO_LABELS[doc.tipo]} ·{" "}
                      {JURISPRUDENCE_MATERIA_LABELS[doc.materia]} · {doc.year}
                    </span>
                    <p>{doc.summary}</p>
                    {doc.rejectionReason ? (
                      <p className="bj-admin__reject-reason">Motivo: {doc.rejectionReason}</p>
                    ) : null}
                    {previewDocId === doc.id && doc.pdfUrl ? (
                      <iframe
                        title={`Vista previa: ${doc.title}`}
                        src={doc.pdfUrl}
                        className="bj-admin__pdf-preview"
                      />
                    ) : null}
                  </div>
                  <div className="bj-admin__item-actions">
                    {doc.pdfUrl ? (
                      <>
                        <button
                          type="button"
                          className="bj-admin__icon-btn"
                          aria-label={previewDocId === doc.id ? "Ocultar PDF" : "Vista previa PDF"}
                          onClick={() =>
                            setPreviewDocId((current) => (current === doc.id ? null : doc.id))
                          }
                        >
                          {previewDocId === doc.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <a
                          href={doc.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bj-admin__icon-btn"
                          aria-label="Abrir PDF en pestaña nueva"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </>
                    ) : null}
                    {tab === "pending" ? (
                      <>
                        <button
                          type="button"
                          className="bj-admin__icon-btn is-approve"
                          disabled={busyId === doc.id}
                          onClick={() => void moderate(doc.id, "approve")}
                          aria-label="Aprobar"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="bj-admin__icon-btn is-reject"
                          disabled={busyId === doc.id}
                          onClick={() => {
                            setRejectId(doc.id);
                            setRejectReason("");
                          }}
                          aria-label="Rechazar"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="bj-admin__icon-btn is-delete"
                      disabled={busyId === doc.id}
                      onClick={() => {
                        if (window.confirm("¿Eliminar permanentemente este documento?")) {
                          void moderate(doc.id, "delete");
                        }
                      }}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        ) : null}

        {!loading && tab === "reports" ? (
          <ul className="bj-admin__list">
            {reports.length === 0 ? (
              <li className="bj-admin__empty">No hay reportes abiertos.</li>
            ) : (
              reports.map((report) => (
                <li key={report.id} className="bj-admin__item">
                  <div className="bj-admin__item-copy">
                    <strong>{report.documentTitle}</strong>
                    <span>{new Date(report.createdAt).toLocaleString("es-PE")}</span>
                    <p>{report.reason}</p>
                  </div>
                  <div className="bj-admin__item-actions">
                    <Link
                      href={`/biblioteca-juridica?q=${encodeURIComponent(report.documentTitle)}`}
                      className="bj-admin__icon-btn"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    <button
                      type="button"
                      className="bj-admin__icon-btn is-approve"
                      disabled={busyId === report.id}
                      onClick={() => void resolveReport(report.id)}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </section>

      {rejectId ? (
        <div className="bj-admin__modal" role="dialog" aria-modal="true">
          <div className="bj-admin__modal-card">
            <h2>Rechazar aporte</h2>
            <p>Indica el motivo (visible para el estudiante en Mis aportes).</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Ej. El PDF no corresponde a una resolución oficial o el enlace no funciona."
            />
            <div className="bj-admin__modal-actions">
              <button type="button" onClick={() => setRejectId(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="is-reject"
                disabled={busyId === rejectId}
                onClick={() =>
                  void moderate(rejectId, "reject", rejectReason || "Rechazado por moderación.")
                }
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
