"use client";

import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardList, Trash2 } from "lucide-react";
import { deleteTableComplete } from "@/lib/cuaderno/delete-table-complete";
import {
  getTableContext,
  getTableDomRect,
  selectTableNode,
  setupTablePointerSelect,
  type TableContext,
} from "@/lib/cuaderno/cuaderno-table-utils";

function TableSimpleToolbar({ editor, ctx }: { editor: Editor; ctx: TableContext }) {
  return (
    <div className="cn-table-toolbar cn-table-toolbar--simple" onMouseDown={(e) => e.preventDefault()}>
      <button
        type="button"
        title="Seleccionar tabla"
        onClick={() => selectTableNode(editor, ctx.pos)}
      >
        <ClipboardList size={14} />
        <span>Seleccionar tabla</span>
      </button>
      <button
        type="button"
        title="Eliminar tabla"
        className="cn-table-toolbar-danger"
        onClick={() => deleteTableComplete(editor)}
      >
        <Trash2 size={14} />
        <span>Eliminar tabla</span>
      </button>
    </div>
  );
}

export function CuadernoTableChrome({ editor }: { editor: Editor | null }) {
  const [ctx, setCtx] = useState<TableContext | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [inTable, setInTable] = useState(false);
  const rafRef = useRef<number | null>(null);

  const sync = useCallback(() => {
    if (!editor) return;
    const tableCtx = getTableContext(editor);
    const nodeSelected =
      editor.state.selection instanceof NodeSelection &&
      editor.state.selection.node.type.name === "table";

    if (nodeSelected && tableCtx) {
      setCtx(tableCtx);
      setInTable(true);
      setRect(getTableDomRect(editor, tableCtx));
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
    if (!editor) return;
    return setupTablePointerSelect(editor);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const sel = editor.state.selection;
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== "table") return;
      const t = e.target as HTMLElement;
      if (t.closest("textarea, input")) return;
      e.preventDefault();
      e.stopPropagation();
      deleteTableComplete(editor);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [editor]);

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
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
          <div
            className="cn-table-floating-toolbar"
            style={{
              pointerEvents: "auto",
              top: -8,
              left: "50%",
              transform: "translate(-50%, -100%)",
            }}
          >
            <TableSimpleToolbar editor={editor} ctx={ctx} />
          </div>
        </div>
      ) : null}
    </>,
    portalTarget,
  );
}
