"use client";

import { useCallback, useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import {
  Download,
  FileImage,
  Loader2,
  Share2,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { AcademicInfographic } from "@/lib/organizers/academic-infographic-types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function rasterizeSvgToPng(svgUrl: string): Promise<Uint8Array> {
  const response = await fetch(svgUrl);
  const svgText = await response.text();
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible.");
    ctx.fillStyle = "#040d12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG falló"))), "image/png");
    });

    return new Uint8Array(await pngBlob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function fetchImageBytes(imageUrl: string): Promise<{ bytes: Uint8Array; mime: string }> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("No se pudo descargar la imagen.");
  const mime = response.headers.get("content-type") ?? "image/png";
  const buffer = await response.arrayBuffer();
  return { bytes: new Uint8Array(buffer), mime };
}

export function AcademicInfographicPanel({
  organizerId,
  organizerTitle,
  academicInfographic,
  onGenerated,
}: {
  organizerId: string;
  organizerTitle: string;
  academicInfographic?: AcademicInfographic | null;
  onGenerated?: (content: unknown) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState<"png" | "pdf" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [local, setLocal] = useState<AcademicInfographic | null>(academicInfographic ?? null);

  useEffect(() => {
    if (academicInfographic) setLocal(academicInfographic);
  }, [academicInfographic]);

  const infographic = local ?? academicInfographic;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizers/${organizerId}/infographic`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo generar la infografía.");
      }

      const next = payload.academicInfographic as AcademicInfographic;
      setLocal(next);
      onGenerated?.(payload.organizer?.content);
      setNotice(
        (payload.warning as string | undefined) ??
          (next.source === "fallback"
            ? "Se mostró una vista previa local. Gemini imagen no respondió — revisa cuota en Google AI Studio."
            : null),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al generar la infografía.");
    } finally {
      setGenerating(false);
    }
  }

  const downloadPng = useCallback(async () => {
    if (!infographic?.imageUrl) return;
    setExporting("png");
    try {
      const { bytes, mime } = await fetchImageBytes(infographic.imageUrl);
      const ext = mime.includes("svg") ? "svg" : mime.includes("jpeg") ? "jpg" : "png";
      const blob = new Blob([Uint8Array.from(bytes)], { type: mime });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `infografia-${slugify(infographic.centralTopic || organizerTitle)}.${ext}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error exportando PNG.");
    } finally {
      setExporting(null);
    }
  }, [infographic, organizerTitle]);

  const downloadPdf = useCallback(async () => {
    if (!infographic?.imageUrl) return;
    setExporting("pdf");
    try {
      const { bytes, mime } = await fetchImageBytes(infographic.imageUrl);
      const pdfDoc = await PDFDocument.create();

      let image;
      if (mime.includes("svg")) {
        const pngBytes = await rasterizeSvgToPng(infographic.imageUrl);
        image = await pdfDoc.embedPng(pngBytes);
      } else if (mime.includes("png")) {
        image = await pdfDoc.embedPng(bytes);
      } else if (mime.includes("jpeg") || mime.includes("jpg")) {
        image = await pdfDoc.embedJpg(bytes);
      } else {
        const pngBytes = await rasterizeSvgToPng(infographic.imageUrl);
        image = await pdfDoc.embedPng(pngBytes);
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `infografia-${slugify(infographic.centralTopic || organizerTitle)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error exportando PDF.");
    } finally {
      setExporting(null);
    }
  }, [infographic, organizerTitle]);

  const shareInfographic = useCallback(async () => {
    if (!infographic?.imageUrl) return;
    setExporting("share");
    try {
      const { bytes, mime } = await fetchImageBytes(infographic.imageUrl);
      const ext = mime.includes("svg") ? "svg" : mime.includes("jpeg") ? "jpg" : "png";
      const file = new File(
        [Uint8Array.from(bytes)],
        `infografia-${slugify(infographic.centralTopic)}.${ext}`,
        { type: mime },
      );

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Infografía: ${infographic.centralTopic}`,
          text: `Infografía académica generada con IA — ${infographic.centralTopic}`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Infografía: ${infographic.centralTopic}`,
          text: `Infografía académica — ${infographic.centralTopic}`,
          url: infographic.imageUrl,
        });
      } else {
        await navigator.clipboard.writeText(infographic.imageUrl);
        setError(null);
        alert("Enlace copiado al portapapeles.");
      }
    } catch (caught) {
      if (caught instanceof Error && caught.name !== "AbortError") {
        setError(caught.message);
      }
    } finally {
      setExporting(null);
    }
  }, [infographic]);

  if (!infographic) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#A78BFA] to-[#00BFFF] text-white shadow-[0_0_40px_rgba(167,139,250,0.4)]">
          <Wand2 size={36} />
        </div>
        <div className="max-w-lg space-y-3">
          <h3 className="text-2xl font-bold text-[#F5F7FA]">Infografía Académica IA</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Gemini genera una imagen educativa completa — ilustraciones, iconos, colores por
            categoría y composición artística 16:9. No es un diagrama técnico: es una infografía
            lista para estudiar solo mirándola.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Generación opcional · una imagen premium por organizador
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="tron-btn-primary inline-flex h-12 items-center gap-2 rounded-xl px-8 text-sm font-semibold disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generando infografía con Gemini…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generar Infografía IA
            </>
          )}
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {generating ? (
          <p className="max-w-sm text-xs text-muted-foreground">
            Construyendo prompt académico, generando ilustraciones y componiendo la infografía
            horizontal…
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[rgba(0,255,213,0.1)] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A78BFA]">
            Infografía académica IA
          </p>
          <h3 className="truncate text-sm font-bold text-[#F5F7FA]">{infographic.centralTopic}</h3>
          {infographic.source === "gemini" ? (
            <p className="text-[10px] text-[#00FFD5]">
              Generada con Gemini{infographic.model ? ` · ${infographic.model}` : ""}
            </p>
          ) : (
            <p className="text-[10px] text-amber-400/90">Vista previa local · Gemini imagen no disponible</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportBtn
            icon={FileImage}
            label="PNG"
            loading={exporting === "png"}
            onClick={downloadPng}
          />
          <ExportBtn
            icon={Download}
            label="PDF"
            loading={exporting === "pdf"}
            onClick={downloadPdf}
          />
          <ExportBtn
            icon={Share2}
            label="Compartir"
            loading={exporting === "share"}
            onClick={shareInfographic}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(167,139,250,0.35)] bg-[rgba(167,139,250,0.1)] px-3 py-2 text-[11px] font-semibold text-[#A78BFA] transition hover:bg-[rgba(167,139,250,0.18)] disabled:opacity-50"
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Regenerar
          </button>
        </div>
      </div>

      {error ? <p className="shrink-0 px-4 py-2 text-xs text-red-400 sm:px-6">{error}</p> : null}
      {notice ? (
        <p className="shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs leading-relaxed text-amber-200/90 sm:px-6">
          {notice}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-[rgba(167,139,250,0.2)] bg-[#040d12] shadow-[0_0_64px_rgba(167,139,250,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={infographic.imageUrl}
              alt={`Infografía académica: ${infographic.centralTopic}`}
              className="w-full object-contain"
              style={{ aspectRatio: "16 / 9" }}
            />
          </div>

          {infographic.subtopics.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {infographic.subtopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-[rgba(0,255,213,0.15)] bg-[rgba(0,255,213,0.06)] px-3 py-1 text-[11px] font-medium text-[#F5F7FA]/80"
                >
                  {topic}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ExportBtn({
  icon: Icon,
  label,
  loading,
  onClick,
}: {
  icon: typeof Download;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(0,255,213,0.15)] px-3 py-2 text-[11px] font-semibold text-[#F5F7FA]/80 transition hover:border-[rgba(0,255,213,0.3)] hover:text-[#00FFD5] disabled:opacity-50"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      {label}
    </button>
  );
}
