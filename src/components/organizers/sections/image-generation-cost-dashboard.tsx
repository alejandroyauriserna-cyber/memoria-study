"use client";

import { useEffect, useState } from "react";
import type { ImageGenerationCostMonthlySummary } from "@/lib/ai/image-generation-cost-store";

const PROVIDER_LABELS: Record<string, string> = {
  flux: "FLUX",
  gemini: "Gemini",
  replicate: "Replicate",
  ideogram: "Ideogram",
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year!, mon! - 1, 1));
  return date.toLocaleDateString("es-PE", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function ImageGenerationCostDashboard() {
  const [summary, setSummary] = useState<ImageGenerationCostMonthlySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    fetch("/api/dev/image-generation-costs")
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<ImageGenerationCostMonthlySummary>;
      })
      .then(setSummary)
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Error cargando costes");
      });
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <section className="rounded-lg border border-dashed border-emerald-500/35 bg-emerald-500/5 px-3 py-2">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
        Costes estimados (admin)
      </p>

      {error ? (
        <p className="text-[11px] text-red-400">{error}</p>
      ) : !summary ? (
        <p className="text-[11px] text-muted-foreground">Cargando resumen…</p>
      ) : (
        <div className="space-y-2 text-[11px] text-[#C5D0DB]">
          <p className="font-semibold text-[#F5F7FA]">
            {formatMonthLabel(summary.month)}
          </p>

          {summary.providers.length ? (
            <ul className="space-y-2">
              {summary.providers.map((row) => (
                <li
                  key={row.provider}
                  className="rounded border border-white/10 bg-black/20 px-2 py-1.5 font-mono"
                >
                  <p className="font-semibold text-[#00FFD5]">
                    {PROVIDER_LABELS[row.provider] ?? row.provider.toUpperCase()}
                  </p>
                  <p>{row.imageCount} imágenes</p>
                  <p>{formatUsd(row.estimatedCostUsd)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Sin generaciones facturables este mes.</p>
          )}

          <div className="border-t border-white/10 pt-2 font-semibold text-[#F5F7FA]">
            <p>Total</p>
            <p className="font-mono text-emerald-300">{formatUsd(summary.totalCostUsd)}</p>
            <p className="font-normal text-muted-foreground">{summary.totalImages} imágenes</p>
          </div>
        </div>
      )}
    </section>
  );
}
