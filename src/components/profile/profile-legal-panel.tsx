"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gavel, Scale, Sparkles } from "lucide-react";
import {
  getEnabledSources,
  getManageableSources,
  loadLegalSourcesSettings,
} from "@/lib/legal-sources/storage";
import { formatSourceSyncLabel } from "@/lib/legal-sources/source-meta";

export function ProfileLegalPanel() {
  const [enabledCount, setEnabledCount] = useState(0);
  const [hasLp, setHasLp] = useState(false);
  const [hasJuris, setHasJuris] = useState(false);
  const [topSource, setTopSource] = useState<string | null>(null);

  useEffect(() => {
    const settings = loadLegalSourcesSettings();
    const enabled = getEnabledSources(settings);
    const manageable = getManageableSources(settings);
    setEnabledCount(enabled.length);
    setHasLp(
      manageable.some((s) => s.kind === "url" && s.lpPresetId && (s.articleCount ?? 0) > 0),
    );
    setHasJuris(
      manageable.some(
        (s) =>
          (s.category === "jurisprudencia" || s.category === "doctrina") &&
          Boolean(s.extractedText?.trim() || s.lastSyncedAt),
      ),
    );
    const first = enabled[0];
    setTopSource(
      first ? `${first.title}${formatSourceSyncLabel(first) ? ` · ${formatSourceSyncLabel(first)}` : ""}` : null,
    );
  }, []);

  return (
    <section className="rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.55)] p-5">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
        <Gavel size={13} />
        Fuentes jurídicas
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(16,39,48,0.4)] p-3 text-center">
          <p className="text-2xl font-bold text-[#F5F7FA]">{enabledCount}</p>
          <p className="text-[10px] text-muted-foreground">Fuentes activas</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(16,39,48,0.4)] p-3 text-center">
          <Scale size={16} className="mx-auto text-[#00FFD5]" />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {hasLp ? "LP sincronizado" : "Sin normativa LP"}
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(16,39,48,0.4)] p-3 text-center">
          <Gavel size={16} className="mx-auto text-[#C084FC]" />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {hasJuris ? "Jurisprudencia lista" : "Sin jurisprudencia"}
          </p>
        </div>
      </div>
      {topSource ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Principal: <span className="text-[#F5F7FA]/85">{topSource}</span>
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/fuentes-juridicas"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[rgba(0,255,213,0.12)] px-3 py-2 text-xs font-semibold text-[#00FFD5]"
        >
          Gestionar fuentes
          <ArrowRight size={12} />
        </Link>
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(0,255,213,0.15)] px-3 py-2 text-xs font-semibold text-[#F5F7FA]"
        >
          <Sparkles size={12} />
          Estudio guiado
        </Link>
      </div>
    </section>
  );
}
