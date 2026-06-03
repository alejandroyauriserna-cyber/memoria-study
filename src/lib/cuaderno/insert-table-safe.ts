import type { Editor } from "@tiptap/react";
import { cnDebug } from "@/lib/cuaderno/cn-debug";

export function insertTableSafe(
  editor: Editor,
  rows: number,
  cols: number,
): { ok: true } | { ok: false; message: string } {
  const r = Math.min(20, Math.max(1, Math.round(rows)));
  const c = Math.min(12, Math.max(1, Math.round(cols)));
  try {
    cnDebug("create-table", { rows: r, cols: c });
    const ok = editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
    if (!ok) {
      return { ok: false, message: "No se pudo insertar la tabla en esta posición." };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la tabla";
    console.error("[cuaderno] insertTable", err);
    return { ok: false, message };
  }
}
