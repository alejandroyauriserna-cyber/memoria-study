"use client";

import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { isAllowedLpUrl } from "@/lib/legal-sources/lp-presets";
import { normalizeLpUrlInput } from "@/lib/legal-sources/lp-url-overrides";

type LpUrlEditorProps = {
  urls: string[];
  catalogUrl?: string;
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  compact?: boolean;
  validateUrl?: (url: string) => boolean;
  urlLabel?: string;
  invalidHint?: string;
  allowedHostsHint?: string;
  addUrlLabel?: string;
  restoreLabel?: string;
};

export function LpUrlEditor({
  urls,
  catalogUrl,
  onChange,
  disabled,
  compact,
  validateUrl = isAllowedLpUrl,
  urlLabel = "URLs a sincronizar (lpderecho.pe)",
  invalidHint = "Solo URLs de lpderecho.pe",
  allowedHostsHint,
  addUrlLabel = "Agregar otra URL (continuación)",
  restoreLabel = "Restaurar catálogo",
}: LpUrlEditorProps) {
  const rows = urls.length ? urls : [""];

  function updateRow(index: number, value: string) {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  }

  function addRow() {
    onChange([...rows, ""]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  }

  function restoreCatalog() {
    if (catalogUrl) onChange([catalogUrl]);
  }

  return (
    <div
      className={`rounded-lg border border-[rgba(0,191,255,0.15)] bg-[rgba(0,0,0,0.22)] ${
        compact ? "mt-1.5 space-y-2 px-2 py-2" : "space-y-2.5 px-2.5 py-2.5"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {urlLabel}
        </p>
        {catalogUrl ? (
          <button
            type="button"
            disabled={disabled}
            onClick={restoreCatalog}
            className="text-[10px] font-semibold text-[#86EFAC] hover:underline disabled:opacity-50"
          >
            {restoreLabel}
          </button>
        ) : null}
      </div>

      {allowedHostsHint ? (
        <p className="text-[10px] leading-4 text-muted-foreground">
          Dominios permitidos: {allowedHostsHint}
        </p>
      ) : null}

      {catalogUrl ? (
        <p className="text-[10px] leading-4 text-muted-foreground">
          URL sugerida:{" "}
          <span className="break-all font-mono text-[#00BFFF]/80">{catalogUrl}</span>
        </p>
      ) : null}

      <div className="space-y-2">
        {rows.map((url, index) => {
          const normalized = normalizeLpUrlInput(url);
          const valid = !normalized || validateUrl(normalized);

          return (
            <div key={index} className="space-y-1">
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={url}
                  disabled={disabled}
                  onChange={(e) => updateRow(index, e.target.value)}
                  placeholder={
                    index === 0 ? "https://..." : "URL adicional relacionada"
                  }
                  className={`min-w-0 flex-1 rounded-lg border bg-[rgba(0,0,0,0.25)] px-2.5 py-2 font-mono text-[10px] text-[#F5F7FA] outline-none focus:border-[rgba(0,255,213,0.35)] ${
                    valid
                      ? "border-[rgba(0,191,255,0.2)]"
                      : "border-[rgba(248,113,113,0.45)]"
                  }`}
                />
                {rows.length > 1 ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeRow(index)}
                    className="rounded-lg border border-[rgba(248,113,113,0.25)] px-2 text-red-400/80 hover:text-red-400 disabled:opacity-50"
                    aria-label="Quitar URL"
                  >
                    <Trash2 size={13} />
                  </button>
                ) : null}
              </div>
              {normalized && valid ? (
                <a
                  href={normalized}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#86EFAC] hover:underline"
                >
                  <ExternalLink size={11} />
                  Abrir URL {index + 1}
                </a>
              ) : null}
              {!valid ? <p className="text-[10px] text-red-400">{invalidHint}</p> : null}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={addRow}
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#00BFFF] hover:underline disabled:opacity-50"
      >
        <Plus size={12} />
        {addUrlLabel}
      </button>
    </div>
  );
}
