import type { Editor } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import {
  getTableContext,
  isTableNodeSelection,
  selectTableNode,
} from "@/lib/cuaderno/cuaderno-table-utils";

/** Elimina la tabla seleccionada y limpia la selección del editor. */
export function deleteTableComplete(editor: Editor): boolean {
  const ctx = getTableContext(editor);
  if (!ctx) return false;

  const { pos } = ctx;
  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "table") return false;

  selectTableNode(editor, pos);

  if (editor.chain().focus().deleteTable().run()) {
    const doc = editor.state.doc;
    const safePos = Math.min(pos, Math.max(0, doc.content.size - 1));
    try {
      editor.chain().focus().setTextSelection(safePos).run();
    } catch {
      editor.chain().focus().selectTextblockEnd().run();
    }
    return true;
  }

  return editor
    .chain()
    .focus()
    .command(({ tr, dispatch }) => {
      const current = tr.doc.nodeAt(pos);
      if (!current || current.type.name !== "table") return false;
      tr.delete(pos, pos + current.nodeSize);
      const after = Math.min(pos, Math.max(0, tr.doc.content.size - 1));
      try {
        tr.setSelection(TextSelection.near(tr.doc.resolve(after)));
      } catch {
        /* selection opcional */
      }
      if (dispatch) dispatch(tr);
      return true;
    })
    .run();
}

export function isTableNodeSelected(editor: Editor | null): boolean {
  if (!editor) return false;
  return isTableNodeSelection(editor);
}
