import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { getTableContext, selectTableNode } from "@/lib/cuaderno/cuaderno-table-utils";

/** Elimina la tabla seleccionada y limpia la selección del editor. */
export function deleteTableComplete(editor: Editor): boolean {
  const { selection } = editor.state;
  let tablePos: number | null = null;

  if (selection instanceof NodeSelection && selection.node.type.name === "table") {
    tablePos = selection.from;
  } else {
    const ctx = getTableContext(editor);
    if (ctx) tablePos = ctx.pos;
  }

  if (tablePos == null) return false;

  selectTableNode(editor, tablePos);
  const deleted = editor.chain().focus().deleteTable().run();
  if (!deleted) return false;

  const doc = editor.state.doc;
  const safePos = Math.min(tablePos, Math.max(0, doc.content.size - 1));
  try {
    editor.chain().focus().setTextSelection(safePos).run();
  } catch {
    editor.chain().focus().selectTextblockEnd().run();
  }
  return true;
}

export function isTableNodeSelected(editor: Editor | null): boolean {
  if (!editor) return false;
  const { selection } = editor.state;
  if (selection instanceof NodeSelection && selection.node.type.name === "table") return true;
  const ctx = getTableContext(editor);
  return Boolean(ctx?.nodeSelected);
}
