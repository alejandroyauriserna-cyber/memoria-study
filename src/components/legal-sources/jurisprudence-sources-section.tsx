"use client";

import type { ReactNode } from "react";
import { FileUp, Gavel, Globe, RefreshCw, Upload } from "lucide-react";
import { LpUrlEditor } from "@/components/legal-sources/lp-url-editor";
import { JURISPRUDENCE_UPLOAD_TEMPLATES } from "@/lib/legal-sources/jurisprudence-templates";
import type { LegalSourceRecord } from "@/types/legal-sources";

type JurisprudenceSourcesSectionProps = {
  sources: LegalSourceRecord[];
  templateUrls: Record<string, string[]>;
  syncingWebTemplateId: string | null;
  onQuickUpload: (templateId: string) => void;
  onTemplateUrlsChange: (templateId: string, urls: string[]) => void;
  onSyncWebUrl: (templateId: string, urls: string[]) => void;
  renderSourceRow: (source: LegalSourceRecord) => ReactNode;
};

export function JurisprudenceSourcesSection({
  sources,
  templateUrls,
  syncingWebTemplateId,
  onQuickUpload,
  onTemplateUrlsChange,
  onSyncWebUrl,
  renderSourceRow,
}: JurisprudenceSourcesSectionProps) {
  return (
    <section className="tron-panel rounded-2xl p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
        <Gavel size={16} className="text-[#C4B5FD]" />
        Jurisprudencia (PDF o URL)
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Sube PDF o sincroniza páginas de LP, TC, PJ o SUNAT. El tutor cita fragmentos del texto
        indexado (expediente, fecha, párrafo) — no valida artículos del código.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-1">
        {JURISPRUDENCE_UPLOAD_TEMPLATES.map((template) => {
          const urls =
            templateUrls[template.id]?.length
              ? templateUrls[template.id]!
              : template.exampleUrl
                ? [template.exampleUrl]
                : [""];
          const busy = syncingWebTemplateId === template.id;
          const synced = sources.find((s) => s.webTemplateId === template.id);

          return (
            <div
              key={template.id}
              className="rounded-xl border border-[rgba(196,181,253,0.2)] bg-[rgba(196,181,253,0.05)] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#F5F7FA]">{template.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{template.subtitle}</p>
                </div>
                {synced?.lastSyncedAt ? (
                  <span className="text-[10px] text-[#86EFAC]">
                    Web sync · {new Date(synced.lastSyncedAt).toLocaleDateString("es-PE")}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onQuickUpload(template.id)}
                  className="tron-btn-secondary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold"
                >
                  <Upload size={13} />
                  Subir PDF
                </button>
              </div>

              <div className="mt-3">
                <LpUrlEditor
                  urls={urls}
                  catalogUrl={template.exampleUrl}
                  disabled={Boolean(syncingWebTemplateId)}
                  compact
                  allowedHostsHint="LP · TC · PJ · SUNAT · SPIJ"
                  onChange={(next) => onTemplateUrlsChange(template.id, next)}
                />
                <button
                  type="button"
                  disabled={Boolean(syncingWebTemplateId)}
                  onClick={() => onSyncWebUrl(template.id, urls)}
                  className="tron-btn-secondary mt-2 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Sincronizando URL…
                    </>
                  ) : (
                    <>
                      <Globe size={13} />
                      Sincronizar URL
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {sources.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Tus fuentes de jurisprudencia
          </p>
          {sources.map((source) => renderSourceRow(source))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-[rgba(196,181,253,0.2)] bg-[rgba(0,0,0,0.15)] px-4 py-8 text-center">
          <FileUp size={28} className="text-[#C4B5FD]/70" />
          <p className="text-sm text-muted-foreground">
            Elige una plantilla: sube PDF o pega la URL de la sentencia / compendio.
          </p>
        </div>
      )}
    </section>
  );
}
