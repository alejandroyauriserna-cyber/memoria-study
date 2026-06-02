"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ClipboardCopy,
  ExternalLink,
  Loader2,
  Palette,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { VisualPremiumPrompt, VisualPromptMode } from "@/lib/organizers/visual-prompt-types";
import {
  GEMINI_APP_URL,
  VISUAL_PROMPT_MODES,
} from "@/lib/organizers/visual-prompt-types";

export function VisualPremiumPromptPanel({
  organizerId,
  visualPremiumPrompt,
  onGenerated,
}: {
  organizerId: string;
  visualPremiumPrompt?: VisualPremiumPrompt | null;
  onGenerated?: (content: unknown) => void;
}) {
  const [mode, setMode] = useState<VisualPromptMode>(
    visualPremiumPrompt?.mode ?? "infographic",
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [local, setLocal] = useState<VisualPremiumPrompt | null>(visualPremiumPrompt ?? null);

  useEffect(() => {
    if (visualPremiumPrompt) {
      setLocal(visualPremiumPrompt);
      setMode(visualPremiumPrompt.mode);
    }
  }, [visualPremiumPrompt]);

  const result = local ?? visualPremiumPrompt;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch(`/api/organizers/${organizerId}/visual-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo generar el prompt visual.");
      }

      const next = payload.visualPremiumPrompt as VisualPremiumPrompt;
      setLocal(next);
      onGenerated?.(payload.organizer?.content);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al generar el prompt visual.");
    } finally {
      setGenerating(false);
    }
  }

  const copyPrompt = useCallback(async () => {
    if (!result?.prompt) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  }, [result?.prompt]);

  const openGemini = useCallback(async () => {
    if (result?.prompt) {
      try {
        await navigator.clipboard.writeText(result.prompt);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } catch {
        /* clipboard optional */
      }
    }
    window.open(GEMINI_APP_URL, "_blank", "noopener,noreferrer");
  }, [result?.prompt]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[#F59E0B]/20 bg-gradient-to-r from-[#F59E0B]/10 via-[#A855F7]/8 to-transparent px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FBBF24]">
              <Palette size={12} />
              Generar Prompt Visual IA
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#F5F7FA]">
              Convierte tu PDF en un prompt premium para Gemini Image
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#F5F7FA]/70">
              MemoriaStudy analiza el material y construye un prompt hiperdetallado. Tú lo copias,
              lo pegas en Gemini y generas la infografía visual sin costo de imágenes en la plataforma.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-5 text-sm font-bold text-[#1a1005] shadow-[0_0_32px_rgba(245,158,11,0.35)] transition hover:brightness-110 disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analizando material…
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Generar Prompt Visual IA
              </>
            )}
          </button>
        </div>
      </div>

      <div className="shrink-0 border-b border-white/8 px-4 py-3 sm:px-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#F5F7FA]/50">
          Modo de generación
        </p>
        <div className="flex flex-wrap gap-2">
          {VISUAL_PROMPT_MODES.map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? "border-[#F59E0B]/50 bg-[#F59E0B]/12"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#F5F7FA]">
                  <span>{item.emoji}</span>
                  {item.label}
                </span>
                <span className="mt-0.5 block max-w-[220px] text-[10px] leading-snug text-[#F5F7FA]/55">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="shrink-0 px-4 py-2 text-xs text-red-400 sm:px-6">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        {!result ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#F59E0B]/25 bg-[#F59E0B]/5 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#A855F7] text-white shadow-lg">
              <Sparkles size={28} />
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-base font-bold text-[#F5F7FA]">Listo para transformar tu material</p>
              <p className="text-sm text-[#F5F7FA]/65">
                Elige un modo, pulsa generar y obtendrás un prompt listo para crear infografías,
                atlas visuales o pósters académicos en Gemini.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FBBF24]">
                  {VISUAL_PROMPT_MODES.find((m) => m.id === result.mode)?.emoji}{" "}
                  {VISUAL_PROMPT_MODES.find((m) => m.id === result.mode)?.label}
                </p>
                <h4 className="text-lg font-bold text-[#F5F7FA]">{result.title}</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionBtn
                  icon={copied ? Check : ClipboardCopy}
                  label={copied ? "Copiado" : "Copiar Prompt"}
                  onClick={copyPrompt}
                  accent="#F59E0B"
                />
                <ActionBtn
                  icon={ExternalLink}
                  label="Abrir Gemini"
                  onClick={openGemini}
                  accent="#A855F7"
                />
              </div>
            </div>

            {result.analysis ? (
              <AnalysisPreview analysis={result.analysis} />
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-[#F59E0B]/25 bg-[#02060a] shadow-[0_0_48px_rgba(245,158,11,0.08)]">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#F5F7FA]/55">
                  Vista previa del prompt
                </p>
                <span className="text-[10px] text-[#F5F7FA]/40">
                  {result.prompt.length.toLocaleString("es-PE")} caracteres
                </span>
              </div>
              <pre className="max-h-[min(52vh,520px)] overflow-auto whitespace-pre-wrap p-4 text-xs leading-relaxed text-[#F5F7FA]/88">
                {result.prompt}
              </pre>
            </div>

            <p className="text-center text-xs text-[#F5F7FA]/45">
              1. Copia el prompt · 2. Abre Gemini · 3. Pega en generación de imagen · 4. Obtén tu
              infografía visual premium
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  icon: typeof ClipboardCopy;
  label: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition hover:brightness-110"
      style={{
        borderColor: `${accent}55`,
        background: `${accent}18`,
        color: accent,
      }}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function AnalysisPreview({
  analysis,
}: {
  analysis: NonNullable<VisualPremiumPrompt["analysis"]>;
}) {
  const chips = [
    ...analysis.concepts.slice(0, 4).map((c) => ({ label: c, tone: "#3B82F6" })),
    ...analysis.principles.slice(0, 2).map((c) => ({ label: c, tone: "#22C55E" })),
    ...analysis.articles.slice(0, 2).map((c) => ({ label: c, tone: "#EF4444" })),
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#F5F7FA]/50">
        Análisis del documento
      </p>
      <p className="text-sm font-semibold text-[#F5F7FA]">{analysis.centralTopic}</p>
      {chips.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="rounded-md px-2 py-0.5 text-[10px] font-medium"
              style={{ background: `${chip.tone}22`, color: chip.tone }}
            >
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}
      {analysis.visualScenes.length ? (
        <ul className="mt-3 space-y-1 text-[11px] text-[#F5F7FA]/65">
          {analysis.visualScenes.slice(0, 4).map((scene) => (
            <li key={scene.concept}>
              <span className="font-semibold text-[#F5F7FA]/85">{scene.concept}</span>
              {" → "}
              {scene.visualMetaphor}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
