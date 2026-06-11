"use client";

import { useEffect, useState } from "react";
import { ImageGenerationCostDashboard } from "@/components/organizers/sections/image-generation-cost-dashboard";
import { ImageGenerationProviderTimeline } from "@/components/organizers/sections/image-generation-provider-timeline";
import type { ImageGenerationDiagnostics } from "@/lib/ai/image-generation-types";
import type { ImageGenerationEnvStatus } from "@/lib/ai/image-generation-env";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageGenerationDiagnosticsPanel({
  diagnostics,
}: {
  diagnostics?: ImageGenerationDiagnostics | null;
}) {
  const [envStatus, setEnvStatus] = useState<ImageGenerationEnvStatus | null>(null);
  const [envError, setEnvError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    fetch("/api/dev/image-generation-env")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<ImageGenerationEnvStatus>;
      })
      .then(setEnvStatus)
      .catch((caught) => {
        setEnvError(caught instanceof Error ? caught.message : "Error cargando env");
      });
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <details className="mt-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-left">
      <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-amber-300">
        Diagnóstico imagen (dev)
      </summary>

      <div className="mt-3 space-y-3 text-[11px] text-[#C5D0DB]">
        <ImageGenerationCostDashboard />

        {diagnostics ? (
          <>
            <ImageGenerationProviderTimeline diagnostics={diagnostics} />

            <section>
              <p className="mb-1 font-semibold text-[#F5F7FA]">Detalle técnico</p>
              <ul className="space-y-1 font-mono">
                <li>Modelo: {diagnostics.model ?? "—"}</li>
                <li>Tamaño imagen: {formatBytes(diagnostics.imageSizeBytes)}</li>
                <li>MIME: {diagnostics.mimeType}</li>
                <li>Cadena configurada: {diagnostics.env.chainKey ?? "default"}</li>
              </ul>
            </section>
          </>
        ) : (
          <p className="text-muted-foreground">Genera una imagen para ver la timeline de proveedores.</p>
        )}

        <section>
          <p className="mb-1 font-semibold text-[#F5F7FA]">Variables de entorno</p>
          {envError ? (
            <p className="text-red-400">No se pudo leer env: {envError}</p>
          ) : envStatus ? (
            <ul className="space-y-1 font-mono">
              <li>
                HF_TOKEN:{" "}
                <span className={envStatus.hfTokenConfigured ? "text-emerald-400" : "text-red-400"}>
                  {envStatus.hfTokenConfigured ? `configurado (${envStatus.hfTokenPreview})` : "NO configurado"}
                </span>
              </li>
              <li>
                HF_IMAGE_MODEL:{" "}
                <span className="text-[#00FFD5]">{envStatus.hfImageModel}</span>
                {envStatus.hfImageModelFromEnv ? " (desde .env.local)" : " (default del código)"}
              </li>
              <li>
                GEMINI_API_KEY:{" "}
                <span className={envStatus.geminiImageConfigured ? "text-emerald-400" : "text-amber-400"}>
                  {envStatus.geminiImageConfigured ? "configurado" : "no configurado"}
                </span>
              </li>
            </ul>
          ) : (
            <p className="text-muted-foreground">Cargando env…</p>
          )}
        </section>
      </div>
    </details>
  );
}
