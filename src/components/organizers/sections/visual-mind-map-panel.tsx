"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { VisualMindMapCanvas } from "@/components/organizers/sections/visual-mind-map-canvas";
import type { VisualMindMap } from "@/lib/organizers/visual-mind-map-types";
import { MAX_VISUAL_MIND_MAP_IMAGES } from "@/lib/organizers/visual-mind-map-types";

export function VisualMindMapPanel({
  organizerId,
  visualMindMap,
  onGenerated,
}: {
  organizerId: string;
  visualMindMap?: VisualMindMap | null;
  onGenerated?: (content: unknown) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMap, setLocalMap] = useState<VisualMindMap | null>(visualMindMap ?? null);

  useEffect(() => {
    if (visualMindMap) setLocalMap(visualMindMap);
  }, [visualMindMap]);

  const map = localMap ?? visualMindMap;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizers/${organizerId}/visual-map`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo generar el mapa visual.");
      }

      const nextMap = payload.visualMindMap as VisualMindMap;
      setLocalMap(nextMap);
      onGenerated?.(payload.organizer?.content);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al generar el mapa visual.");
    } finally {
      setGenerating(false);
    }
  }

  if (!map) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00FFD5] to-[#00BFFF] text-[#07131A] shadow-[0_0_32px_rgba(0,255,213,0.35)]">
          <Wand2 size={28} />
        </div>
        <div className="max-w-md space-y-2">
          <h4 className="text-lg font-bold text-[#F5F7FA]">Mapa mental visual con IA</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Genera un mapa interactivo con iconos e imágenes IA para cada concepto. Ideal para
            recordar visualmente — inspirado en Napkin AI y MindMeister.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Generación opcional · hasta {MAX_VISUAL_MIND_MAP_IMAGES} imágenes IA por mapa
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="tron-btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generando mapa visual…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generar mapa visual IA
            </>
          )}
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {generating ? (
          <p className="max-w-sm text-xs text-muted-foreground">
            Extrayendo conceptos, construyendo estructura y generando imágenes con Gemini…
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgba(0,255,213,0.12)] px-4 py-2.5">
        <div>
          <p className="text-xs font-semibold text-[#00FFD5]">Mapa visual IA</p>
          <p className="text-[11px] text-muted-foreground">{map.centralTopic}</p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(0,255,213,0.25)] px-3 py-1.5 text-[11px] font-semibold text-[#00FFD5] transition hover:bg-[rgba(0,255,213,0.1)] disabled:opacity-50"
        >
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Regenerar
        </button>
      </div>
      {error ? <p className="shrink-0 px-4 py-2 text-xs text-red-400">{error}</p> : null}
      <div className="min-h-0 flex-1 p-3">
        <VisualMindMapCanvas map={map} fullscreen />
      </div>
    </div>
  );
}
