"use client";

import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  MoreHorizontal,
  Trash2,
  Rows3,
  Columns3,
  Plus,
  Minus,
} from "lucide-react";
import {
  deleteSelectedBlock,
  duplicateSelectedBlock,
  moveSelectedBlock,
} from "@/lib/cuaderno/cuaderno-block-utils";
import {
  getTableContext,
  getTableDomRect,
  selectTableNode,
  setTableMinHeight,
  setTableWidth,
  type TableContext,
} from "@/lib/cuaderno/cuaderno-table-utils";
import { applyTableLegalLayout } from "@/lib/cuaderno/apply-table-legal-layout";
import { TABLE_LEGAL_LAYOUTS, type TableLegalLayout } from "@/lib/cuaderno/table-legal-layouts";

type ResizeEdge = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

const HANDLES: ResizeEdge[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

function setRowHeight(editor: Editor, tablePos: number, rowIndex: number, height: string): boolean {
  return editor
    .chain()
    .focus()
    .command(({ tr, state }) => {
      const table = state.doc.nodeAt(tablePos);
      if (!table || table.type.name !== "table") return false;
      let offset = tablePos + 1;
      for (let i = 0; i < table.childCount; i++) {
        const row = table.child(i);
        if (i === rowIndex) {
          tr.setNodeMarkup(offset, undefined, { ...row.attrs, rowHeight: height });
          return true;
        }
        offset += row.nodeSize;
      }
      return false;
    })
    .run();
}

function TableToolbar({
  editor,
  ctx,
  onMenu,
}: {
  editor: Editor;
  ctx: TableContext;
  onMenu: (e: React.MouseEvent) => void;
}) {
  const layout = (ctx.attrs.layout as TableLegalLayout) || "default";

  return (
    <div className="cn-table-toolbar" onMouseDown={(e) => e.preventDefault()}>
      <div className="cn-table-toolbar-row">
        <button type="button" title="Fila arriba" onClick={() => editor.chain().focus().addRowBefore().run()}>
          <Plus size={12} /> F↑
        </button>
        <button type="button" title="Fila abajo" onClick={() => editor.chain().focus().addRowAfter().run()}>
          <Plus size={12} /> F↓
        </button>
        <button type="button" title="Eliminar fila" onClick={() => editor.chain().focus().deleteRow().run()}>
          <Minus size={12} /> <Rows3 size={12} />
        </button>
        <span className="cn-table-toolbar-sep" />
        <button type="button" title="Col. izquierda" onClick={() => editor.chain().focus().addColumnBefore().run()}>
          <Plus size={12} /> C←
        </button>
        <button type="button" title="Col. derecha" onClick={() => editor.chain().focus().addColumnAfter().run()}>
          <Plus size={12} /> C→
        </button>
        <button type="button" title="Eliminar columna" onClick={() => editor.chain().focus().deleteColumn().run()}>
          <Minus size={12} /> <Columns3 size={12} />
        </button>
        <span className="cn-table-toolbar-sep" />
        <button type="button" title="Subir" onClick={() => moveSelectedBlock(editor, "up")}>
          <ArrowUp size={14} />
        </button>
        <button type="button" title="Bajar" onClick={() => moveSelectedBlock(editor, "down")}>
          <ArrowDown size={14} />
        </button>
        <button type="button" title="Duplicar tabla" onClick={() => duplicateSelectedBlock(editor)}>
          <Copy size={14} />
        </button>
        <button
          type="button"
          title="Eliminar tabla"
          className="cn-table-toolbar-danger"
          onClick={() => deleteSelectedBlock(editor)}
        >
          <Trash2 size={14} />
        </button>
        <button type="button" title="Más opciones" onClick={onMenu}>
          <MoreHorizontal size={14} />
        </button>
      </div>
      <div className="cn-table-legal-chips" role="group" aria-label="Convertir plantilla jurídica">
        {TABLE_LEGAL_LAYOUTS.map((spec) => (
          <button
            key={spec.id}
            type="button"
            className={layout === spec.id ? "is-on" : ""}
            title={spec.description}
            onClick={() => applyTableLegalLayout(editor, spec.id)}
          >
            <span aria-hidden>{spec.icon}</span> {spec.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TableContextMenu({
  x,
  y,
  editor,
  onClose,
}: {
  x: number;
  y: number;
  editor: Editor;
  onClose: () => void;
}) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [onClose]);

  return (
    <div
      className="cn-block-context-menu cn-table-context-menu"
      style={{ top: y, left: x }}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={() => { editor.chain().focus().addRowBefore().run(); onClose(); }}>
        Agregar fila arriba
      </button>
      <button type="button" onClick={() => { editor.chain().focus().addRowAfter().run(); onClose(); }}>
        Agregar fila abajo
      </button>
      <button type="button" onClick={() => { editor.chain().focus().deleteRow().run(); onClose(); }}>
        Eliminar fila
      </button>
      <button type="button" onClick={() => { editor.chain().focus().addColumnBefore().run(); onClose(); }}>
        Agregar columna izquierda
      </button>
      <button type="button" onClick={() => { editor.chain().focus().addColumnAfter().run(); onClose(); }}>
        Agregar columna derecha
      </button>
      <button type="button" onClick={() => { editor.chain().focus().deleteColumn().run(); onClose(); }}>
        Eliminar columna
      </button>
      <button type="button" onClick={() => { duplicateSelectedBlock(editor); onClose(); }}>
        Duplicar tabla
      </button>
      <button
        type="button"
        className="is-danger"
        onClick={() => {
          deleteSelectedBlock(editor);
          onClose();
        }}
      >
        Eliminar tabla
      </button>
    </div>
  );
}

export function CuadernoTableChrome({ editor }: { editor: Editor | null }) {
  const [ctx, setCtx] = useState<TableContext | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [inTable, setInTable] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const rowHandlesRef = useRef<{ index: number; top: number }[]>([]);

  const sync = useCallback(() => {
    if (!editor) return;
    const tableCtx = getTableContext(editor);
    const nodeSelected =
      editor.state.selection instanceof NodeSelection &&
      editor.state.selection.node.type.name === "table";

    if (nodeSelected && tableCtx) {
      setCtx(tableCtx);
      setInTable(true);
      const next = getTableDomRect(editor, tableCtx);
      setRect(next);
      if (tableCtx.dom) {
        const tableRect = tableCtx.dom.getBoundingClientRect();
        const rows = Array.from(tableCtx.dom.querySelectorAll("tr"));
        rowHandlesRef.current = rows.map((tr, index) => {
          const r = tr.getBoundingClientRect();
          return { index, top: r.bottom - tableRect.top };
        });
      }
      return;
    }

    const { $from } = editor.state.selection;
    let inside = false;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === "table") {
        inside = true;
        break;
      }
    }
    setInTable(inside);
    if (!inside) {
      setCtx(null);
      setRect(null);
      return;
    }
    if (tableCtx && !nodeSelected) {
      setCtx(null);
      setRect(getTableDomRect(editor, tableCtx));
      return;
    }
    setCtx(null);
    setRect(null);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        sync();
      });
    };
    sync();
    editor.on("selectionUpdate", schedule);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      editor.off("selectionUpdate", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [editor, sync]);

  useEffect(() => {
    if (!ctx?.dom) return;
    const ro = new ResizeObserver(() => sync());
    ro.observe(ctx.dom);
    return () => ro.disconnect();
  }, [ctx?.dom, sync]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onContextMenu = (e: MouseEvent) => {
      const table = (e.target as HTMLElement).closest("table");
      if (!table || !dom.contains(table)) return;
      e.preventDefault();
      const pos = editor.view.posAtDOM(table, 0);
      const $pos = editor.state.doc.resolve(pos);
      for (let d = $pos.depth; d > 0; d--) {
        if ($pos.node(d).type.name === "table") {
          selectTableNode(editor, $pos.before(d));
          setMenu({ x: e.clientX, y: e.clientY });
          break;
        }
      }
    };
    dom.addEventListener("contextmenu", onContextMenu);
    return () => dom.removeEventListener("contextmenu", onContextMenu);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const sel = editor.state.selection;
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== "table") return;
      e.preventDefault();
      deleteSelectedBlock(editor);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  const startResize = useCallback(
    (edge: ResizeEdge, e: React.PointerEvent) => {
      if (!editor || !ctx) return;
      e.preventDefault();
      e.stopPropagation();
      const tablePos = ctx.pos;
      const startX = e.clientX;
      const startY = e.clientY;
      const domRect = getTableDomRect(editor, ctx);
      if (!domRect) return;
      const contentW = editor.view.dom.clientWidth || domRect.width;
      const startW = domRect.width;
      const startH = domRect.height;
      const startMinH = parseInt(String(ctx.attrs.minHeight || startH), 10) || startH;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        sync();
        if (edge.includes("e")) {
          const newW = Math.max(120, startW + dx);
          const pct = Math.min(100, Math.max(25, (newW / contentW) * 100));
          setTableWidth(editor, tablePos, `${Math.round(pct)}%`);
        }
        if (edge.includes("w")) {
          const newW = Math.max(120, startW - dx);
          const pct = Math.min(100, Math.max(25, (newW / contentW) * 100));
          setTableWidth(editor, tablePos, `${Math.round(pct)}%`);
        }
        if (edge.includes("s")) {
          setTableMinHeight(editor, tablePos, `${Math.max(60, startMinH + dy)}px`);
        }
        if (edge.includes("n")) {
          setTableMinHeight(editor, tablePos, `${Math.max(60, startMinH - dy)}px`);
        }
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [editor, ctx],
  );

  const startRowResize = useCallback(
    (rowIndex: number, e: React.PointerEvent) => {
      if (!editor || !ctx?.dom) return;
      e.preventDefault();
      e.stopPropagation();
      const tablePos = ctx.pos;
      const tr = ctx.dom.querySelectorAll("tr")[rowIndex];
      if (!tr) return;
      const startY = e.clientY;
      const startH = tr.getBoundingClientRect().height;

      const onMove = (ev: PointerEvent) => {
        const h = Math.max(28, startH + (ev.clientY - startY));
        setRowHeight(editor, tablePos, rowIndex, `${Math.round(h)}px`);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [editor, ctx],
  );

  if (!editor) return null;

  const nodeSelected = ctx?.nodeSelected ?? false;
  const showGrip = inTable && !nodeSelected && rect;
  const showChrome = nodeSelected && ctx && rect;

  if (!showGrip && !showChrome) return null;

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  const boxStyle: React.CSSProperties = rect
    ? {
        position: "absolute",
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        pointerEvents: "none",
      }
    : {};

  return createPortal(
    <>
      {showGrip ? (
        <div className="cn-table-grip-layer" style={boxStyle}>
          <button
            type="button"
            className="cn-table-select-grip"
            style={{ pointerEvents: "auto" }}
            title="Seleccionar tabla"
            aria-label="Seleccionar tabla"
            onMouseDown={(e) => {
              e.preventDefault();
              selectTableNode(editor);
            }}
          >
            ▦
          </button>
        </div>
      ) : null}

      {showChrome ? (
        <div className="cn-table-chrome-layer" style={boxStyle}>
          <div className="cn-table-selection-ring" aria-hidden />
          {HANDLES.map((edge) => (
            <span
              key={edge}
              className={`cn-table-resize-handle cn-table-resize-handle--${edge}`}
              style={{ pointerEvents: "auto" }}
              onPointerDown={(ev) => startResize(edge, ev)}
            />
          ))}
          {rowHandlesRef.current.map(({ index, top }) => (
            <span
              key={index}
              className="cn-table-row-resize-handle"
              style={{ top: top - 3, pointerEvents: "auto" }}
              onPointerDown={(ev) => startRowResize(index, ev)}
            />
          ))}
          <div
            className="cn-table-floating-toolbar"
            style={{
              pointerEvents: "auto",
              top: -8,
              left: "50%",
              transform: "translate(-50%, -100%)",
            }}
          >
            <TableToolbar editor={editor} ctx={ctx} onMenu={(e) => setMenu({ x: e.clientX, y: e.clientY })} />
          </div>
        </div>
      ) : null}

      {menu && showChrome ? (
        <TableContextMenu x={menu.x} y={menu.y} editor={editor} onClose={() => setMenu(null)} />
      ) : null}
    </>,
    portalTarget,
  );
}
