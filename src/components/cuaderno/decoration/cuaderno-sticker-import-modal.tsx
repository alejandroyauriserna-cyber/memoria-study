"use client";

import { useState } from "react";
import {
  ArrowDown,
  ClipboardPaste,
  ExternalLink,
  Globe,
  ImageIcon,
  Link2,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";

const PINTEREST_URL = "https://www.pinterest.com/";
import {
  fileToDataUrl,
  removeBackgroundToPngDataUrl,
} from "@/lib/cuaderno/sticker-bg-removal";
import type { UserStickerRecord } from "@/types/cuaderno-stickers";

type ImportMode = "pinterest" | "direct" | "file";

export function CuadernoStickerImportPanel({
  onSaved,
  onAddToCanvas,
}: {
  onSaved: (sticker: UserStickerRecord) => void;
  onAddToCanvas?: (sticker: UserStickerRecord) => void;
}) {
  const [mode, setMode] = useState<ImportMode>("pinterest");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeBg, setRemoveBg] = useState(true);

  async function processDataUrl(dataUrl: string, defaultName: string) {
    setLoading(true);
    setError(null);
    try {
      setOriginalSrc(dataUrl);
      setName(defaultName);
      const out = removeBg ? await removeBackgroundToPngDataUrl(dataUrl) : dataUrl;
      setProcessedSrc(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar");
      setProcessedSrc(dataUrl);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUrl() {
    const u = url.trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cuaderno/stickers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u, label: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await processDataUrl(data.imageDataUrl, data.label ?? "Sticker");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
      setLoading(false);
    }
  }

  async function onFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Usa PNG, JPG o WEBP");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    await processDataUrl(dataUrl, file.name.replace(/\.\w+$/, "") || "Sticker");
  }

  async function save() {
    if (!processedSrc) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cuaderno/stickers/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: processedSrc, name: name || "Mi sticker" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(data.sticker);
      onAddToCanvas?.(data.sticker);
      setUrl("");
      setOriginalSrc(null);
      setProcessedSrc(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cn-sticker-import-panel cn-sticker-import-panel--premium">
      <section className="cn-sticker-import-hero" aria-labelledby="cn-import-hero-title">
        <div className="cn-sticker-import-hero-art" aria-hidden>
          <Sparkles size={28} strokeWidth={1.5} />
        </div>
        <h2 id="cn-import-hero-title" className="cn-sticker-import-hero-title">
          Importa stickers desde Pinterest
        </h2>
        <p className="cn-sticker-import-hero-sub">
          Guarda imágenes, elimina el fondo y crea tu colección personal de estudio.
        </p>
      </section>

      <ImportVisualFlow />

      <button
        type="button"
        className="cn-sticker-import-pinterest-btn"
        onClick={() => window.open(PINTEREST_URL, "_blank", "noopener,noreferrer")}
      >
        <ExternalLink size={16} aria-hidden />
        Abrir Pinterest
      </button>

      <div className="cn-sticker-import-modes cn-sticker-import-modes--pill">
        <button type="button" className={mode === "pinterest" ? "is-on" : ""} onClick={() => setMode("pinterest")}>
          Pinterest
        </button>
        <button type="button" className={mode === "direct" ? "is-on" : ""} onClick={() => setMode("direct")}>
          URL imagen
        </button>
        <button type="button" className={mode === "file" ? "is-on" : ""} onClick={() => setMode("file")}>
          Archivo
        </button>
      </div>

      {mode !== "file" ? (
        <div className="cn-sticker-import-url cn-sticker-import-url--premium">
          <Globe size={16} />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Pega el enlace del pin o de la imagen"
            onKeyDown={(e) => e.key === "Enter" && void fetchUrl()}
          />
          <button type="button" className="cn-sticker-import-go" disabled={loading} onClick={() => void fetchUrl()}>
            {loading && !processedSrc ? <Loader2 size={14} className="cn-spin" /> : "Importar"}
          </button>
        </div>
      ) : (
        <label className="cn-sticker-upload-zone cn-sticker-upload-zone--premium">
          <Upload size={22} />
          <span>Arrastra o elige PNG · JPG · WEBP</span>
          <input
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </label>
      )}

      <label className="cn-sticker-import-check">
        <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} />
        Quitar fondo automáticamente
      </label>

      {originalSrc && processedSrc ? (
        <div className="cn-sticker-import-preview cn-sticker-import-preview--premium">
          <div>
            <span>Original</span>
            <img src={originalSrc} alt="" loading="lazy" decoding="async" />
          </div>
          <div>
            <span>Sticker</span>
            <img src={processedSrc} alt="" loading="lazy" decoding="async" />
          </div>
        </div>
      ) : null}

      {processedSrc ? (
        <label className="cn-sticker-import-name">
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      ) : null}

      {error ? <p className="cn-sticker-import-error">{error}</p> : null}

      {processedSrc ? (
        <button type="button" className="cn-sticker-import-save" disabled={loading} onClick={() => void save()}>
          Guardar en Mis stickers
        </button>
      ) : null}
    </div>
  );
}

function ImportVisualFlow() {
  const steps = [
    { icon: ExternalLink, label: "Pinterest" },
    { icon: Link2, label: "Copiar URL" },
    { icon: ClipboardPaste, label: "Pegar enlace" },
    { icon: ImageIcon, label: "Importar" },
    { icon: Sparkles, label: "Tu cuaderno" },
  ];

  return (
    <div className="cn-sticker-import-flow" aria-label="Pasos de importación">
      {steps.map((step, i) => (
        <div key={step.label} className="cn-sticker-import-flow-row">
          <div className="cn-sticker-import-flow-step">
            <span className="cn-sticker-import-flow-icon">
              <step.icon size={15} strokeWidth={1.75} />
            </span>
            <span className="cn-sticker-import-flow-label">{step.label}</span>
          </div>
          {i < steps.length - 1 ? (
            <ArrowDown size={14} className="cn-sticker-import-flow-arrow" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}
