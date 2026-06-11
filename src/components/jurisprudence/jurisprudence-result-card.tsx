"use client";

import { useState } from "react";
import type { JurisprudenceRecord } from "@/types/jurisprudence";
import {
  JURISPRUDENCE_MATERIA_LABELS,
  JURISPRUDENCE_TIPO_LABELS,
} from "@/lib/jurisprudence/labels";
import { hasUsableJurisprudencePdfUrl } from "@/lib/jurisprudence/pdf-url";
import { JurisprudenceReportModal } from "@/components/jurisprudence/jurisprudence-report-modal";
import { Bookmark, ExternalLink, Flag, Scale } from "lucide-react";

type Props = {
  record: JurisprudenceRecord;
  saved: boolean;
  canReport?: boolean;
  highlighted?: boolean;
  onToggleSave: (id: string) => void;
};

export function JurisprudenceResultCard({
  record,
  saved,
  canReport,
  highlighted,
  onToggleSave,
}: Props) {
  const hasPdf = hasUsableJurisprudencePdfUrl(record.pdfUrl);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  async function submitReport(reason: string): Promise<boolean> {
    const response = await fetch("/api/jurisprudence/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: record.id, reason }),
    });
    if (response.ok) {
      setReportSent(true);
      return true;
    }
    return false;
  }

  return (
    <>
      <article
        className={`bj-card${highlighted ? " bj-card--highlight" : ""}`}
        id={`doc-${record.id}`}
      >
        <div className="bj-card__head">
          <div className="bj-card__badges">
            <div className="bj-card__type">{JURISPRUDENCE_TIPO_LABELS[record.tipo]}</div>
            {record.isCommunityContribution ? (
              <span className="bj-card__community">Comunidad</span>
            ) : null}
          </div>
          <span className="bj-card__year">{record.year}</span>
        </div>

        <h3 className="bj-card__title">{record.title}</h3>

        <dl className="bj-card__meta">
          <div>
            <dt>Materia</dt>
            <dd>{JURISPRUDENCE_MATERIA_LABELS[record.materia]}</dd>
          </div>
          <div>
            <dt>Tema</dt>
            <dd>{record.submateria}</dd>
          </div>
          <div className="bj-card__meta-wide">
            <dt>Órgano</dt>
            <dd>{record.organo}</dd>
          </div>
        </dl>

        <p className="bj-card__summary">{record.summary}</p>

        <div className="bj-card__actions">
          {hasPdf ? (
            <a
              href={record.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bj-card__btn bj-card__btn--primary"
            >
              <ExternalLink size={15} />
              Abrir PDF
            </a>
          ) : (
            <span className="bj-card__btn bj-card__btn--disabled" aria-disabled="true">
              PDF no disponible
            </span>
          )}
          <button
            type="button"
            className={`bj-card__btn bj-card__btn--ghost${saved ? " is-saved" : ""}`}
            onClick={() => onToggleSave(record.id)}
            aria-pressed={saved}
          >
            <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
            {saved ? "Guardado" : "Guardar"}
          </button>
          {canReport && !reportSent ? (
            <button
              type="button"
              className="bj-card__btn bj-card__btn--ghost"
              onClick={() => setReportOpen(true)}
            >
              <Flag size={15} />
              Reportar
            </button>
          ) : null}
          {reportSent ? <span className="bj-card__reported">Reporte enviado</span> : null}
        </div>

        <div className="bj-card__icon" aria-hidden>
          <Scale size={18} strokeWidth={1.5} />
        </div>
      </article>

      <JurisprudenceReportModal
        open={reportOpen}
        documentTitle={record.title}
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
      />
    </>
  );
}
