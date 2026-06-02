"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ClipboardCopy,
  ExternalLink,
  FileUp,
  Loader2,
  Palette,
  Paperclip,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { isSupportedRubricFile } from "@/lib/organizers/visual-prompt-types";
import type { VisualPremiumPrompt, VisualPromptMode } from "@/lib/organizers/visual-prompt-types";
import {
  GEMINI_APP_URL,
  RUBRIC_ACCEPT,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<VisualPromptMode>(
    visualPremiumPrompt?.mode ?? "infographic",
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [local, setLocal] = useState<VisualPremiumPrompt | null>(visualPremiumPrompt ?? null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);

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
      const formData = new FormData();
      formData.append("mode", mode);
      if (rubricFile) {
        formData.append("rubric", rubricFile);
      }

      const response = await fetch(`/api/organizers/${organizerId}/visual-prompt`, {
        method: "POST",
        body: formData,
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

  function handleRubricPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isSupportedRubricFile(file)) {
      setError("Formato no soportado. Usa PDF, DOCX, JPG o PNG.");
      event.target.value = "";
      return;
    }

    setError(null);
    setRubricFile(file);
    event.target.value = "";
  }

  const copyPrompt = useCallback(async () => {
    if (!result?.prompt) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("No se pudo copiar al portapapeles.");
    }
  }, [result?.prompt]);

  const openGemini = useCallback(() => {
    window.open(GEMINI_APP_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[#F59E0B]/20 bg-gradient-to-r from-[#F59E0B]/10 via-[#A855F7]/8 to-transparent px-4 py-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#FBBF24]">
            <Palette size={12} />
            Generar Prompt Visual IA
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#F5F7FA]">
            Material + rúbrica del docente → prompt premium para Gemini
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#F5F7FA]/70">
            MemoriaStudy analiza tu PDF de estudio y, si adjuntas la rúbrica, adapta el prompt a los
            criterios de evaluación de tu profesor. Copias, pegas en Gemini y generas la infografía
            sin costo de imágenes en la plataforma.
          </p>
        </div>
      </div>

      <div className="shrink-0 border-b border-white/8 px-4 py-3 sm:px-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#F5F7FA]/50">
          Modo visual
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

      <div className="shrink-0 border-b border-white/8 px-4 py-3 sm:px-6">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5F7FA]/50">
          <Paperclip size={11} />
          Adjuntar rúbrica (opcional)
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={RUBRIC_ACCEPT}
            className="hidden"
            onChange={handleRubricPick}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#F59E0B]/40 bg-[#F59E0B]/8 px-4 py-2.5 text-xs font-semibold text-[#FBBF24] transition hover:border-[#F59E0B]/60 hover:bg-[#F59E0B]/12"
          >
            <FileUp size={14} />
            Subir rúbrica
          </button>
          <span className="text-[10px] text-[#F5F7FA]/45">PDF · DOCX · JPG · PNG</span>
          {rubricFile ? (
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-[#F5F7FA]/80">
              {rubricFile.name}
              <button
                type="button"
                onClick={() => setRubricFile(null)}
                className="text-[#F5F7FA]/50 hover:text-red-400"
                aria-label="Quitar rúbrica"
              >
                <X size={12} />
              </button>
            </span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-5 text-sm font-bold text-[#1a1005] shadow-[0_0_32px_rgba(245,158,11,0.35)] transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {rubricFile ? "Analizando material y rúbrica…" : "Analizando material…"}
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Generar Prompt Visual IA
            </>
          )}
        </button>
      </div>

      {error ? (
        <p className="shrink-0 px-4 py-2 text-xs text-red-400 sm:px-6">{error}</p>
      ) : null}

      {copied ? (
        <p className="shrink-0 px-4 py-2 text-xs font-semibold text-[#22C55E] sm:px-6">
          ✓ Prompt copiado correctamente
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        {!result ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#F59E0B]/25 bg-[#F59E0B]/5 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#A855F7] text-white shadow-lg">
              <Sparkles size={28} />
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-base font-bold text-[#F5F7FA]">Personaliza con la rúbrica de tu docente</p>
              <p className="text-sm text-[#F5F7FA]/65">
                Elige un modo, adjunta la rúbrica si la tienes, y obtén un prompt alineado a lo que
                evaluará tu profesor.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            {result.explanation?.length ? (
              <ExplanationBlock lines={result.explanation} hasRubric={result.hasRubric} />
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-[#F59E0B]/30 bg-[#02060a] shadow-[0_0_48px_rgba(245,158,11,0.1)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#FBBF24]">
                    Prompt generado
                  </p>
                  <h4 className="text-base font-bold text-[#F5F7FA]">{result.title}</h4>
                  <p className="text-[10px] text-[#F5F7FA]/45">
                    {VISUAL_PROMPT_MODES.find((m) => m.id === result.mode)?.emoji}{" "}
                    {VISUAL_PROMPT_MODES.find((m) => m.id === result.mode)?.label}
                    {result.hasRubric ? " · Con rúbrica del docente" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-4 py-2.5 text-xs font-bold text-[#1a1005] shadow-lg transition hover:brightness-110"
                  >
                    {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
                    {copied ? "Copiado" : "Copiar Prompt"}
                  </button>
                  <button
                    type="button"
                    onClick={openGemini}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#A855F7]/45 bg-[#A855F7]/15 px-4 py-2.5 text-xs font-semibold text-[#C4B5FD] transition hover:bg-[#A855F7]/25"
                  >
                    <ExternalLink size={14} />
                    Abrir Gemini
                  </button>
                </div>
              </div>
              <pre className="max-h-[min(48vh,480px)] overflow-auto whitespace-pre-wrap p-4 text-xs leading-relaxed text-[#F5F7FA]/88">
                {result.prompt}
              </pre>
              <div className="border-t border-white/8 px-4 py-2 text-[10px] text-[#F5F7FA]/40">
                {result.prompt.length.toLocaleString("es-PE")} caracteres
              </div>
            </div>

            {result.rubricAnalysis ? (
              <RubricPreview analysis={result.rubricAnalysis} />
            ) : null}

            <p className="text-center text-xs text-[#F5F7FA]/45">
              1. Copia el prompt · 2. Abre Gemini · 3. Pega en generación de imagen · 4. Obtén tu
              infografía alineada a la rúbrica
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExplanationBlock({
  lines,
  hasRubric,
}: {
  lines: string[];
  hasRubric: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#22C55E]/25 bg-[#22C55E]/8 p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#86EFAC]">
        ¿Por qué se generó así?
      </p>
      <ul className="space-y-2">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm text-[#F5F7FA]/85">
            <Check size={14} className="mt-0.5 shrink-0 text-[#22C55E]" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {hasRubric ? (
        <p className="mt-3 text-[10px] text-[#86EFAC]/80">
          El prompt incorpora criterios extraídos de la rúbrica adjunta.
        </p>
      ) : null}
    </div>
  );
}

function RubricPreview({
  analysis,
}: {
  analysis: NonNullable<VisualPremiumPrompt["rubricAnalysis"]>;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#F5F7FA]/50">
        Rúbrica analizada
        {analysis.fileName ? ` · ${analysis.fileName}` : ""}
      </p>
      {analysis.requestedFormat ? (
        <p className="text-sm font-semibold text-[#FBBF24]">
          Formato solicitado: {analysis.requestedFormat}
        </p>
      ) : null}
      {analysis.evaluationCriteria.length ? (
        <ul className="mt-2 space-y-1 text-[11px] text-[#F5F7FA]/70">
          {analysis.evaluationCriteria.slice(0, 5).map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
