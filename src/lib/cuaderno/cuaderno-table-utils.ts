import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import type { TableLegalLayout } from "@/lib/cuaderno/table-legal-layouts";

export type TableContext = {
  pos: number;
  nodeSize: number;
  attrs: Record<string, unknown>;
  dom: HTMLTableElement | null;
  nodeSelected: boolean;
};

export function getTableContext(editor: Editor): TableContext | null {
  const { selection } = editor.state;

  if (selection instanceof NodeSelection && selection.node.type.name === "table") {
    const dom = editor.view.nodeDOM(selection.from) as HTMLTableElement | null;
    return {
      pos: selection.from,
      nodeSize: selection.node.nodeSize,
      attrs: { ...selection.node.attrs },
      dom: dom?.tagName === "TABLE" ? dom : dom?.querySelector("table") ?? null,
      nodeSelected: true,
    };
  }

  const { $from } = selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name !== "table") continue;
    const pos = $from.before(depth);
    const dom = editor.view.nodeDOM(pos) as HTMLTableElement | null;
    return {
      pos,
      nodeSize: node.nodeSize,
      attrs: { ...node.attrs },
      dom: dom?.tagName === "TABLE" ? dom : dom?.querySelector("table") ?? null,
      nodeSelected: false,
    };
  }

  return null;
}

export function selectTableNode(editor: Editor, pos?: number): boolean {
  const tablePos = pos ?? getTableContext(editor)?.pos;
  if (tablePos == null) return false;
  const node = editor.state.doc.nodeAt(tablePos);
  if (!node || node.type.name !== "table") return false;
  const tr = editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, tablePos));
  editor.view.dispatch(tr);
  return true;
}

export function getTableDomRect(editor: Editor, ctx: TableContext): DOMRect | null {
  if (ctx.dom) return ctx.dom.getBoundingClientRect();
  const dom = editor.view.nodeDOM(ctx.pos) as HTMLElement | null;
  const table = dom?.tagName === "TABLE" ? dom : dom?.querySelector("table");
  return table?.getBoundingClientRect() ?? null;
}

export function updateTableAttrs(
  editor: Editor,
  pos: number,
  attrs: Record<string, unknown>,
): boolean {
  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      const node = tr.doc.nodeAt(pos);
      if (!node || node.type.name !== "table") return false;
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
      return true;
    })
    .run();
}

export function setTableWidth(editor: Editor, pos: number, width: string): boolean {
  return updateTableAttrs(editor, pos, { width });
}

export function setTableMinHeight(editor: Editor, pos: number, minHeight: string): boolean {
  return updateTableAttrs(editor, pos, { minHeight });
}

export function setTableLayout(editor: Editor, pos: number, layout: TableLegalLayout): boolean {
  return updateTableAttrs(editor, pos, { layout });
}
