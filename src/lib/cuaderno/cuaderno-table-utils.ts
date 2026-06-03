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

export function resolveTableElement(dom: HTMLElement | null): HTMLTableElement | null {
  if (!dom) return null;
  if (dom.tagName === "TABLE") return dom as HTMLTableElement;
  return dom.querySelector("table");
}

export function findTablePos(editor: Editor): number | null {
  const ctx = getTableContext(editor);
  return ctx?.pos ?? null;
}

export function getTableContext(editor: Editor): TableContext | null {
  const { selection } = editor.state;

  if (selection instanceof NodeSelection && selection.node.type.name === "table") {
    const dom = resolveTableElement(editor.view.nodeDOM(selection.from) as HTMLElement | null);
    return {
      pos: selection.from,
      nodeSize: selection.node.nodeSize,
      attrs: { ...selection.node.attrs },
      dom,
      nodeSelected: true,
    };
  }

  const { $from } = selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name !== "table") continue;
    const pos = $from.before(depth);
    const dom = resolveTableElement(editor.view.nodeDOM(pos) as HTMLElement | null);
    return {
      pos,
      nodeSize: node.nodeSize,
      attrs: { ...node.attrs },
      dom,
      nodeSelected: false,
    };
  }

  return null;
}

export function selectTableNode(editor: Editor, pos?: number): boolean {
  const tablePos = pos ?? findTablePos(editor);
  if (tablePos == null) return false;
  const node = editor.state.doc.nodeAt(tablePos);
  if (!node || node.type.name !== "table") return false;

  const tr = editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, tablePos));
  editor.view.dispatch(tr);
  editor.view.focus();

  const dom = resolveTableElement(editor.view.nodeDOM(tablePos) as HTMLElement | null);
  dom?.scrollIntoView({ block: "nearest", inline: "nearest" });

  return true;
}

export function tablePosFromDom(editor: Editor, table: HTMLTableElement): number | null {
  try {
    const pos = editor.view.posAtDOM(table, 0);
    const $pos = editor.state.doc.resolve(pos);
    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type.name === "table") return $pos.before(d);
    }
  } catch {
    return null;
  }
  return null;
}

export function isTableNodeSelection(editor: Editor): boolean {
  const { selection } = editor.state;
  return selection instanceof NodeSelection && selection.node.type.name === "table";
}

/** Clic en tabla → selección de nodo; si ya editas una celda, no interferir. */
export function setupTablePointerSelect(editor: Editor): () => void {
  const dom = editor.view.dom;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(
        ".cn-table-toolbar, .cn-table-select-grip, .cn-table-floating-toolbar, .cn-table-chrome-layer, .cn-table-grip-layer",
      )
    ) {
      return;
    }

    const table = target.closest("table");
    if (!table || !dom.contains(table)) return;

    const tablePos = tablePosFromDom(editor, table);
    if (tablePos == null) return;

    if (isTableNodeSelection(editor)) {
      if (target.closest("td, th")) return;
      return;
    }

    const { $from } = editor.state.selection;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === "table" && $from.before(d) === tablePos) {
        if (target.closest("td, th")) return;
        break;
      }
    }

    e.preventDefault();
    e.stopPropagation();
    selectTableNode(editor, tablePos);
  };

  dom.addEventListener("pointerdown", onPointerDown, true);
  return () => dom.removeEventListener("pointerdown", onPointerDown, true);
}

export function getScrollParents(el: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body) {
    const { overflow, overflowY, overflowX } = getComputedStyle(node);
    const scrollable = [overflow, overflowY, overflowX].some((v) => v === "auto" || v === "scroll");
    if (scrollable) out.push(node);
    node = node.parentElement;
  }
  return out;
}

export function getTableDomRect(editor: Editor, ctx: TableContext): DOMRect | null {
  if (ctx.dom) return ctx.dom.getBoundingClientRect();
  const dom = editor.view.nodeDOM(ctx.pos) as HTMLElement | null;
  return resolveTableElement(dom)?.getBoundingClientRect() ?? null;
}

export function updateTableAttrs(
  editor: Editor,
  pos: number,
  attrs: Record<string, unknown>,
  options?: { keepNodeSelected?: boolean },
): boolean {
  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "table") return false;

  let tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
  if (options?.keepNodeSelected) {
    tr = tr.setSelection(NodeSelection.create(tr.doc, pos));
  }
  editor.view.dispatch(tr);
  return true;
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

export function setTableLocked(editor: Editor, pos: number, locked: boolean): boolean {
  return updateTableAttrs(editor, pos, { locked });
}

export function deleteTableAt(editor: Editor, pos: number): boolean {
  selectTableNode(editor, pos);
  return editor.chain().focus().deleteTable().run();
}
