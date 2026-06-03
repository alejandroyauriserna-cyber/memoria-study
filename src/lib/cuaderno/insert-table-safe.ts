import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { cnDebug } from "@/lib/cuaderno/cn-debug";
import { getTableContext, selectTableNode } from "@/lib/cuaderno/cuaderno-table-utils";

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

    const ctx = getTableContext(editor);
    if (ctx) {
      const node = editor.state.doc.nodeAt(ctx.pos);
      if (node?.type.name === "table") {
        let tr = editor.state.tr.setNodeMarkup(ctx.pos, undefined, {
          ...node.attrs,
          width: "72%",
          minHeight: "100px",
        });
        tr = tr.setSelection(NodeSelection.create(tr.doc, ctx.pos));
        editor.view.dispatch(tr);
      }
      selectTableNode(editor, ctx.pos);
      requestAnimationFrame(() => {
        selectTableNode(editor, ctx.pos);
      });
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la tabla";
    console.error("[cuaderno] insertTable", err);
    return { ok: false, message };
  }
}
