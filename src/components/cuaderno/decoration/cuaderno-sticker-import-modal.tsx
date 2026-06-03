"use client";

import { useState } from "react";
import { Globe, Loader2, Upload } from "lucide-react";
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
  const [mode, setMode] = useState<ImportMode>("direct");
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
    <div className="cn-sticker-import-panel">
      <div className="cn-sticker-import-modes">
        <button type="button" className={mode === "pinterest" ? "is-on" : ""} onClick={() => setMode("pinterest")}>
          URL Pinterest
        </button>
        <button type="button" className={mode === "direct" ? "is-on" : ""} onClick={() => setMode("direct")}>
          URL imagen
        </button>
        <button type="button" className={mode === "file" ? "is-on" : ""} onClick={() => setMode("file")}>
          Archivo local
        </button>
      </div>

      {mode !== "file" ? (
        <div className="cn-sticker-import-url">
          <Globe size={16} />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              mode === "pinterest"
                ? "https://pinterest.com/pin/… o i.pinimg.com/…"
                : "https://…/imagen.png"
            }
            onKeyDown={(e) => e.key === "Enter" && void fetchUrl()}
          />
          <button type="button" disabled={loading} onClick={() => void fetchUrl()}>
            {loading && !processedSrc ? <Loader2 size={14} className="cn-spin" /> : "Importar"}
          </button>
        </div>
      ) : (
        <label className="cn-sticker-upload-zone cn-sticker-upload-zone--compact">
          <Upload size={22} />
          <span>PNG · JPG · WEBP</span>
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
        <div className="cn-sticker-import-preview">
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
          Guardar en Mis Stickers
        </button>
      ) : null}
    </div>
  );
}
