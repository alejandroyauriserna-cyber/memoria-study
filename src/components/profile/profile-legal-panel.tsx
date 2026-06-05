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
    <section className="profile-panel">
      <p className="profile-kicker flex items-center gap-2">
        <Gavel size={13} />
        Fuentes jurídicas
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="profile-subcard text-center">
          <p className="profile-stat-value !mt-0 text-2xl">{enabledCount}</p>
          <p className="text-[10px] text-muted-foreground">Fuentes activas</p>
        </div>
        <div className="profile-subcard text-center">
          <Scale size={16} className="mx-auto text-accent" />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {hasLp ? "LP sincronizado" : "Sin normativa LP"}
          </p>
        </div>
        <div className="profile-subcard text-center">
          <Gavel size={16} className="mx-auto text-[#C084FC]" />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {hasJuris ? "Jurisprudencia lista" : "Sin jurisprudencia"}
          </p>
        </div>
      </div>
      {topSource ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Principal: <span className="profile-text">{topSource}</span>
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/fuentes-juridicas" className="profile-link-btn profile-link-btn--primary">
          Gestionar fuentes
          <ArrowRight size={12} />
        </Link>
        <Link href="/library" className="profile-link-btn profile-link-btn--ghost">
          <Sparkles size={12} />
          Estudio guiado
        </Link>
      </div>
    </section>
  );
}
