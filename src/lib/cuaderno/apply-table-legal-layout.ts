import type { Editor } from "@tiptap/react";
import { TABLE_LEGAL_LAYOUTS, type TableLegalLayout } from "@/lib/cuaderno/table-legal-layouts";
import { getTableContext, setTableLayout } from "@/lib/cuaderno/cuaderno-table-utils";

function headerCells(texts: string[]) {
  return texts.map((text) => ({
    type: "tableHeader",
    content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }],
  }));
}

function bodyRow(cols: number) {
  const cells = Array.from({ length: cols }, () => ({
    type: "tableCell",
    content: [{ type: "paragraph" }],
  }));
  return { type: "tableRow", content: cells };
}

function tableDoc(headers: string[], bodyRows = 2) {
  const cols = headers.length;
  return {
    type: "table",
    attrs: { width: "100%" },
    content: [
      { type: "tableRow", content: headerCells(headers) },
      ...Array.from({ length: bodyRows }, () => bodyRow(cols)),
    ],
  };
}

/** Aplica plantilla jurídica: actualiza layout y cabeceras si la tabla está vacía o es pequeña. */
export function applyTableLegalLayout(editor: Editor, layout: TableLegalLayout): boolean {
  const spec = TABLE_LEGAL_LAYOUTS.find((l) => l.id === layout);
  if (!spec || layout === "default") {
    const ctx = getTableContext(editor);
    if (!ctx) return false;
    return setTableLayout(editor, ctx.pos, "default");
  }

  const ctx = getTableContext(editor);
  if (!ctx) return false;

  const text = editor.state.doc.textBetween(ctx.pos, ctx.pos + ctx.nodeSize, " ");
  const isEmpty = text.trim().length < 8;

  if (isEmpty) {
    return editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const node = state.doc.nodeAt(ctx.pos);
        if (!node || node.type.name !== "table") return false;
        const next = state.schema.nodeFromJSON({
          ...tableDoc(spec.headers, 3),
          attrs: { width: node.attrs.width ?? "100%", layout, minHeight: node.attrs.minHeight },
        });
        tr.replaceWith(ctx.pos, ctx.pos + node.nodeSize, next);
        return true;
      })
      .run();
  }

  return setTableLayout(editor, ctx.pos, layout);
}
