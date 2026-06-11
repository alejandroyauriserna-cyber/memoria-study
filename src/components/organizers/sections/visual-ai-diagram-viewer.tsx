"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getVisualAiFormat } from "@/lib/organizers/visual-ai-formats";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";

export function VisualAiDiagramViewer({
  imageUrl,
  formatId,
  alt,
}: {
  imageUrl: string;
  formatId: VisualAiFormatId;
  alt: string;
}) {
  const format = getVisualAiFormat(formatId);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aspectStyle =
    format.aspectRatio === "16:9" ? "16 / 9" : format.aspectRatio === "4:3" ? "4 / 3" : "1 / 1";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetch(imageUrl)
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo cargar el diagrama.");
        return response.text();
      })
      .then((text) => {
        if (cancelled) return;
        if (text.includes("<svg")) {
          setSvgMarkup(text);
        } else {
          setSvgMarkup(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Error cargando diagrama.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  if (loading) {
    return (
      <div
        className="visual-ai-canvas flex items-center justify-center"
        style={{ aspectRatio: aspectStyle, minHeight: 280 }}
      >
        <Loader2 className="animate-spin text-[var(--dia-accent)]" size={28} />
      </div>
    );
  }

  if (error || !svgMarkup) {
    return (
      <div className="visual-ai-result" style={{ aspectRatio: aspectStyle }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} style={{ width: "100%", objectFit: "contain" }} />
      </div>
    );
  }

  return (
    <div className="visual-ai-canvas" style={{ aspectRatio: aspectStyle }}>
      <div
        className="visual-ai-canvas__viewport"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
        aria-label={alt}
      />
    </div>
  );
}
