"use client";

import { useState } from "react";
import { ExternalLink, Globe, Loader2, Upload } from "lucide-react";

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
      <CuadernoPinterestImportGuide />

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

      {mode === "pinterest" ? (
        <button
          type="button"
          className="cn-sticker-import-pinterest-btn"
          onClick={() => window.open(PINTEREST_URL, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink size={16} aria-hidden />
          Abrir Pinterest en nueva pestaña
        </button>
      ) : null}

      {mode !== "file" ? (
        <div className="cn-sticker-import-url">
          <Globe size={16} />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              mode === "pinterest"
                ? "https://i.pinimg.com/… (URL directa de la imagen)"
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

function CuadernoPinterestImportGuide() {
  return (
    <section className="cn-sticker-import-guide" aria-label="Cómo importar desde Pinterest">
      <h2 className="cn-sticker-import-guide-title">Importar imagen desde Pinterest</h2>
      <p className="cn-sticker-import-guide-lead">
        Para obtener mejores resultados, copia la dirección directa de la imagen y no el enlace del
        pin.
      </p>

      <button
        type="button"
        className="cn-sticker-import-pinterest-btn cn-sticker-import-pinterest-btn--in-guide"
        onClick={() => window.open(PINTEREST_URL, "_blank", "noopener,noreferrer")}
      >
        <ExternalLink size={16} aria-hidden />
        Abrir Pinterest
      </button>
      <p className="cn-sticker-import-guide-open-hint">Se abre en una pestaña nueva. Busca tu imagen y copia la URL directa.</p>

      <h3 className="cn-sticker-import-guide-sub">En computadora</h3>
      <ol className="cn-sticker-import-guide-steps">
        <li>Abre el pin en Pinterest.</li>
        <li>Haz clic derecho sobre la imagen.</li>
        <li>
          Selecciona <strong>«Copiar dirección de la imagen»</strong> o{" "}
          <strong>«Copiar URL de imagen»</strong> (según tu navegador).
        </li>
        <li>
          Pega el enlace en el campo <strong>Importar Sticker</strong> (pestaña URL Pinterest o URL
          imagen).
        </li>
      </ol>

      <div className="cn-sticker-import-guide-important">
        <p className="cn-sticker-import-guide-important-label">Importante</p>
        <p className="cn-sticker-import-guide-ok">
          <span aria-hidden>✅</span> Correcto:{" "}
          <code className="cn-sticker-import-guide-code">https://i.pinimg.com/…</code>
        </p>
        <p className="cn-sticker-import-guide-bad">
          <span aria-hidden>❌</span> Incorrecto:{" "}
          <code className="cn-sticker-import-guide-code">https://www.pinterest.com/pin/…</code>
        </p>
        <p className="cn-sticker-import-guide-note">
          El sistema funciona mejor cuando recibe la URL directa de la imagen.
        </p>
      </div>

      <h3 className="cn-sticker-import-guide-sub">También puedes</h3>
      <ul className="cn-sticker-import-guide-list">
        <li>
          <strong>Ctrl + V</strong> en la hoja: se guarda en <strong>Mis stickers</strong> y se coloca al
          instante (como Canva).
        </li>
        <li>Arrastrar una imagen directamente a la hoja (también se guarda en tu biblioteca).</li>
        <li>Subir archivos PNG, JPG o WEBP desde tu dispositivo.</li>
      </ul>

      <p className="cn-sticker-import-guide-tip">
        <span aria-hidden>💡</span> Consejo: Si Pinterest no muestra la opción «Copiar dirección de
        la imagen», abre la imagen en tamaño completo y vuelve a hacer clic derecho sobre ella.
      </p>
    </section>
  );
}
