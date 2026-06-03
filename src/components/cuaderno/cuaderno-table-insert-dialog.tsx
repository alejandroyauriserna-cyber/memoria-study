"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { insertTableSafe } from "@/lib/cuaderno/insert-table-safe";
import type { Editor } from "@tiptap/react";

export function CuadernoTableInsertDialog({
  open,
  onClose,
  editor,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  /** Si se pasa editor, inserta con manejo de errores integrado. */
  editor?: Editor | null;
  onConfirm?: (rows: number, cols: number) => void;
}) {
  const [rows, setRows] = useState("3");
  const [cols, setCols] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setRows("3");
    setCols("3");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const parseDim = (raw: string, fallback: number) => {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const submit = useCallback(() => {
    setError(null);
    const r = parseDim(rows, 3);
    const c = parseDim(cols, 3);

    const run = () => {
      if (editor) {
        const result = insertTableSafe(editor, r, c);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        onClose();
        return;
      }
      try {
        onConfirm?.(r, c);
        onClose();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al crear la tabla";
        console.error("[cuaderno] table dialog onConfirm", err);
        setError(message);
      }
    };

    requestAnimationFrame(run);
  }, [rows, cols, editor, onConfirm, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="cn-table-dialog-root"
      role="presentation"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="cn-table-dialog-backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="cn-table-dialog"
        role="dialog"
        aria-labelledby="cn-table-dialog-title"
        aria-modal="true"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="cn-table-dialog-title">Insertar tabla</h2>
        <p>Define el tamaño antes de crearla.</p>
        <div className="cn-table-dialog-fields">
          <label>
            Filas
            <input
              type="number"
              min={1}
              max={20}
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </label>
          <label>
            Columnas
            <input
              type="number"
              min={1}
              max={12}
              value={cols}
              onChange={(e) => setCols(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </label>
        </div>
        {error ? <p className="cn-table-dialog-error">{error}</p> : null}
        <div className="cn-table-dialog-actions">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="cn-table-dialog-primary" onClick={submit}>
            Crear tabla
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
