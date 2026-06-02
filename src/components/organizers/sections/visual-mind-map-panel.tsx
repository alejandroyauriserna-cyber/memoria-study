"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Loader2, Map, Sparkles, Wand2 } from "lucide-react";
import { AcademicInfographicPanel } from "@/components/organizers/sections/academic-infographic-panel";
import { VisualMindMapCanvas } from "@/components/organizers/sections/visual-mind-map-canvas";
import type { AcademicInfographic } from "@/lib/organizers/academic-infographic-types";
import type { VisualMindMap } from "@/lib/organizers/visual-mind-map-types";
import { MAX_VISUAL_MIND_MAP_IMAGES } from "@/lib/organizers/visual-mind-map-types";

type MapMode = "interactive" | "illustrated";

export function VisualMindMapPanel({
  organizerId,
  organizerTitle,
  visualMindMap,
  academicInfographic,
  onGenerated,
}: {
  organizerId: string;
  organizerTitle?: string;
  visualMindMap?: VisualMindMap | null;
  academicInfographic?: AcademicInfographic | null;
  onGenerated?: (content: unknown) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMap, setLocalMap] = useState<VisualMindMap | null>(visualMindMap ?? null);
  const [mode, setMode] = useState<MapMode>("interactive");

  useEffect(() => {
    if (visualMindMap) setLocalMap(visualMindMap);
  }, [visualMindMap]);

  const map = localMap ?? visualMindMap;
  const title = organizerTitle ?? map?.centralTopic ?? "Organizador";

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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#A855F7] text-white shadow-[0_0_32px_rgba(59,130,246,0.35)]">
          <Wand2 size={28} />
        </div>
        <div className="max-w-md space-y-2">
          <h4 className="text-lg font-bold text-[#F5F7FA]">Mapa mental visual con IA</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Explora conocimiento con jerarquía visual, colores por categoría, mini ilustraciones IA
            y un modo infografía completa generado por Gemini.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Generación opcional · hasta {MAX_VISUAL_MIND_MAP_IMAGES} ilustraciones por nodo
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
            Extrayendo conceptos, diseñando layout radial y generando imágenes con Gemini…
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#60A5FA]">Mapa mental visual IA</p>
          <p className="truncate text-[11px] text-muted-foreground">{map.centralTopic}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ModeTab
            active={mode === "interactive"}
            onClick={() => setMode("interactive")}
            icon={Map}
            label="Explorar"
          />
          <ModeTab
            active={mode === "illustrated"}
            onClick={() => setMode("illustrated")}
            icon={ImageIcon}
            label="Mapa ilustrado IA"
            accent="#A855F7"
          />
          {mode === "interactive" ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B82F6]/35 px-3 py-1.5 text-[11px] font-semibold text-[#60A5FA] transition hover:bg-[#3B82F6]/10 disabled:opacity-50"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Regenerar
            </button>
          ) : null}
        </div>
      </div>

      {error && mode === "interactive" ? (
        <p className="shrink-0 px-4 py-2 text-xs text-red-400">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1">
        {mode === "interactive" ? (
          <div className="h-full p-3">
            <VisualMindMapCanvas map={map} fullscreen />
          </div>
        ) : (
          <VisualMindMapIllustratedMode
            organizerId={organizerId}
            organizerTitle={title}
            centralTopic={map.centralTopic}
            academicInfographic={academicInfographic}
            illustratedImageUrl={map.illustratedImageUrl}
            onGenerated={onGenerated}
          />
        )}
      </div>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  icon: Icon,
  label,
  accent = "#3B82F6",
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Map;
  label: string;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
        active ? "text-[#F5F7FA]" : "text-muted-foreground hover:text-[#F5F7FA]/80"
      }`}
      style={
        active
          ? {
              background: `${accent}22`,
              border: `1px solid ${accent}55`,
              color: accent,
            }
          : { border: "1px solid transparent" }
      }
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function VisualMindMapIllustratedMode({
  organizerId,
  organizerTitle,
  centralTopic,
  academicInfographic,
  illustratedImageUrl,
  onGenerated,
}: {
  organizerId: string;
  organizerTitle: string;
  centralTopic: string;
  academicInfographic?: AcademicInfographic | null;
  illustratedImageUrl?: string | null;
  onGenerated?: (content: unknown) => void;
}) {
  const infographicFromMap =
    illustratedImageUrl && !academicInfographic
      ? ({
          centralTopic,
          subtopics: [],
          imageUrl: illustratedImageUrl,
          prompt: "",
          generatedAt: "",
          source: "gemini" as const,
        } satisfies AcademicInfographic)
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[#A855F7]/15 bg-[#A855F7]/5 px-4 py-2.5">
        <p className="text-[11px] leading-relaxed text-[#F5F7FA]/75">
          <span className="font-semibold text-[#A855F7]">Mapa mental ilustrado IA</span>
          {" · "}
          Gemini genera una infografía académica completa — iconografía, conexiones visuales y
          elementos educativos, no solo nodos sueltos.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <AcademicInfographicPanel
          organizerId={organizerId}
          organizerTitle={organizerTitle}
          academicInfographic={academicInfographic ?? infographicFromMap}
          onGenerated={onGenerated}
        />
      </div>
    </div>
  );
}
