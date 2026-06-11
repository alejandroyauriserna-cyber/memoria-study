"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileImage, Loader2, Sparkles } from "lucide-react";
import { InteractiveDiagramStudio } from "@/components/organizers/sections/interactive-diagram/interactive-diagram-studio";
import { VisualIaGenerating } from "@/components/organizers/sections/visual-ia-generating";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { ImageGenerationDiagnosticsPanel } from "@/components/organizers/sections/image-generation-diagnostics-panel";
import { ImageGenerationSummary } from "@/components/organizers/sections/image-generation-summary";
import type { ImageGenerationDiagnostics } from "@/lib/ai/image-generation-types";
import {
  diagramExportDimensions,
  fetchSvgText,
  rasterizeSvgToPng,
} from "@/lib/organizers/visual-ai-diagram/export-diagram";
import { getVisualAiFormat } from "@/lib/organizers/visual-ai-formats";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import type { VisualAiFormatId, VisualAiOutput } from "@/lib/organizers/visual-ai-types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function fetchImageBytes(imageUrl: string): Promise<{ bytes: Uint8Array; mime: string }> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("No se pudo descargar la imagen.");
  const mime = response.headers.get("content-type") ?? "image/png";
  const buffer = await response.arrayBuffer();
  return { bytes: new Uint8Array(buffer), mime };
}

export function VisualIaFormatView({
  organizerId,
  organizerTitle,
  formatId,
  content,
  cachedOutput,
  onGenerated,
  autoGenerate = false,
}: {
  organizerId: string;
  organizerTitle: string;
  formatId: VisualAiFormatId;
  content: OrganizerContent;
  cachedOutput?: VisualAiOutput | null;
  onGenerated?: (content: unknown) => void;
  autoGenerate?: boolean;
}) {
  const format = getVisualAiFormat(formatId);
  const isStructured = format.renderMode === "structured";
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState<"png" | "svg" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [local, setLocal] = useState<VisualAiOutput | null>(cachedOutput ?? null);
  const [imageDiagnostics, setImageDiagnostics] = useState<ImageGenerationDiagnostics | null>(null);
  const autoTriggered = useRef(false);
  const generateProgress = useLoadingProgress(generating, "visualAi");

  useEffect(() => {
    setLocal(cachedOutput ?? null);
    autoTriggered.current = false;
  }, [formatId, cachedOutput]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizers/${organizerId}/visual-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: formatId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo generar el recurso visual.");
      }

      const next = payload.visualAiOutput as VisualAiOutput;
      const diagnostics = (payload.imageDiagnostics as ImageGenerationDiagnostics | null) ?? null;
      setLocal(next);
      setImageDiagnostics(diagnostics);
      onGenerated?.(payload.organizer?.content);
      const hasSummaryFallback =
        Boolean(diagnostics?.usedFallback || diagnostics?.userMessage) ||
        next.source === "fallback";

      setNotice(
        hasSummaryFallback
          ? null
          : ((payload.userNotice as string | undefined) ??
              (payload.warning as string | undefined) ??
              null),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al generar.");
    } finally {
      setGenerating(false);
    }
  }, [formatId, onGenerated, organizerId]);

  useEffect(() => {
    if (!autoGenerate) return;
    if (autoTriggered.current) return;
    if (local?.imageUrl) return;
    if (!onGenerated) return;

    autoTriggered.current = true;
    void handleGenerate();
  }, [autoGenerate, local?.imageUrl, onGenerated, handleGenerate]);

  const baseFilename = useCallback(() => {
    return `${slugify(format.label)}-${slugify(local?.centralTopic || organizerTitle)}`;
  }, [format.label, local?.centralTopic, organizerTitle]);

  const downloadPng = useCallback(async () => {
    if (!local?.imageUrl) return;
    setExporting("png");
    try {
      const baseName = baseFilename();

      if (isStructured || local.source === "structured") {
        const svgText = await fetchSvgText(local.imageUrl);
        const { width, height } = diagramExportDimensions(formatId);
        const pngBlob = await rasterizeSvgToPng(svgText, width, height, 2);
        const url = URL.createObjectURL(pngBlob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${baseName}@2x.png`;
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }

      const { bytes, mime } = await fetchImageBytes(local.imageUrl);
      const ext = mime.includes("jpeg") ? "jpg" : "png";
      const blob = new Blob([Uint8Array.from(bytes)], { type: mime });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${baseName}.${ext}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error exportando PNG.");
    } finally {
      setExporting(null);
    }
  }, [baseFilename, formatId, isStructured, local]);

  const aspectStyle =
    format.aspectRatio === "16:9"
      ? "16 / 9"
      : format.aspectRatio === "4:3"
        ? "4 / 3"
        : "1 / 1";

  if (!local?.imageUrl) {
    return (
      <div className="flex h-full min-h-[320px] flex-col">
        {generating ? (
          <VisualIaGenerating
            formatId={formatId}
            percent={generateProgress.percent}
            message={generateProgress.message}
            stageLabel={generateProgress.stageLabel}
          />
        ) : (
          <div className="visual-ai-generating-stage">
            <div className="visual-ai-card-icon" style={{ marginBottom: 0 }}>
              {format.emoji}
            </div>
            <p className="visual-ai-hub__title">{format.label}</p>
            <p className="visual-ai-card-description" style={{ textAlign: "center", maxWidth: "36ch" }}>
              {format.tagline}
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              className="tron-btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold"
            >
              <Sparkles size={16} />
              {isStructured ? "Generar diagrama" : "Generar con FLUX"}
            </button>
          </div>
        )}
        {error ? <p className="visual-ai-error text-center">{error}</p> : null}
      </div>
    );
  }

  if (isStructured && local?.imageUrl && !generating) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {error ? <p className="visual-ai-error">{error}</p> : null}
        {notice ? <p className="visual-ai-notice whitespace-pre-line">{notice}</p> : null}
        <InteractiveDiagramStudio
          organizerId={organizerId}
          organizerTitle={organizerTitle}
          formatId={formatId}
          content={content}
          savedLayout={local.interactiveLayout}
          onLayoutSaved={onGenerated}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="visual-ai-detail-bar shrink-0">
        <div className="min-w-0 space-y-1">
          <p className="visual-ai-hub__kicker">
            {format.emoji} {format.label}
          </p>
          <h3 className="visual-ai-hub__title truncate" style={{ fontSize: "0.95rem" }}>
            {local.centralTopic}
          </h3>
          <ImageGenerationSummary
            source={local.source}
            model={local.model}
            diagnostics={imageDiagnostics}
          />
        </div>
      </div>

      {generating ? (
        <div className="shrink-0">
          <VisualIaGenerating
            formatId={formatId}
            percent={generateProgress.percent}
            message={generateProgress.message}
            stageLabel={generateProgress.stageLabel}
          />
        </div>
      ) : null}

      {error ? <p className="visual-ai-error">{error}</p> : null}
      {notice ? <p className="visual-ai-notice whitespace-pre-line">{notice}</p> : null}

      {!generating ? (
        <div className="visual-ai-result-wrap">
          <div className="mx-auto max-w-5xl">
            <div className="visual-ai-result" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
              <div className="visual-ai-toolbar">
                <button
                  type="button"
                  className="visual-ai-tool"
                  onClick={downloadPng}
                  disabled={Boolean(exporting)}
                  title="Descargar PNG retina"
                  aria-label="Descargar PNG retina"
                >
                  {exporting === "png" ? <Loader2 size={18} className="animate-spin" /> : <FileImage size={18} />}
                </button>
                <button
                  type="button"
                  className="visual-ai-tool"
                  onClick={handleGenerate}
                  disabled={generating}
                  title="Regenerar"
                  aria-label="Regenerar"
                >
                  <Sparkles size={18} />
                </button>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={local.imageUrl}
                alt={`${format.label}: ${local.centralTopic}`}
                style={{ aspectRatio: aspectStyle, borderRadius: 32 }}
              />
            </div>

            {local.subtopics.length ? (
              <div className="visual-ai-topics">
                {local.subtopics.map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            ) : null}

            <ImageGenerationDiagnosticsPanel diagnostics={imageDiagnostics} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
