"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { NodeSelection } from "@tiptap/pm/state";
import { BlockHandleBar } from "@/components/cuaderno/blocks/block-handle-bar";
import {
  deleteSelectedBlock,
  duplicateSelectedBlock,
  getSelectedBlock,
  moveSelectedBlock,
  selectBlockAt,
  type CuadernoBlockKind,
} from "@/lib/cuaderno/cuaderno-block-utils";

export function CuadernoBlockHandles({ editor }: { editor: Editor | null }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [kind, setKind] = useState<CuadernoBlockKind>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const block = getSelectedBlock(editor);
      if (!block?.kind || block.kind === "table") {
        setRect((r) => (r === null ? r : null));
        setKind((k) => (k === null ? k : null));
        return;
      }
      setKind((k) => (k === block.kind ? k : block.kind));
      if (block.pos >= 0) {
        const dom = editor.view.nodeDOM(block.pos) as HTMLElement | null;
        const next = dom?.getBoundingClientRect() ?? null;
        setRect((r) =>
          r &&
          next &&
          r.top === next.top &&
          r.left === next.left &&
          r.width === next.width &&
          r.height === next.height
            ? r
            : next,
        );
      }
    };

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        update();
      });
    };

    update();
    editor.on("selectionUpdate", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      editor.off("selectionUpdate", schedule);
      window.removeEventListener("scroll", schedule, true);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!(editor.state.selection instanceof NodeSelection)) return;
      const block = getSelectedBlock(editor);
      if (!block?.kind) return;
      e.preventDefault();
      deleteSelectedBlock(editor);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  if (!editor || !kind || !rect) return null;

  const top = rect.top + window.scrollY - 44;
  const left = rect.left + window.scrollX + rect.width / 2;

  return (
    <>
      <div
        className="cn-block-floating-handle"
        style={{ top, left, transform: "translateX(-50%)" }}
        role="toolbar"
        aria-label="Acciones del bloque"
      >
        <BlockHandleBar
          editor={editor}
          kind={kind}
          onMore={(e) => setContextMenu({ x: e.clientX, y: e.clientY })}
        />
      </div>

      {contextMenu ? (
        <BlockContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          editor={editor}
          kind={kind}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </>
  );
}

function BlockContextMenu({
  x,
  y,
  editor,
  kind,
  onClose,
}: {
  x: number;
  y: number;
  editor: Editor;
  kind: CuadernoBlockKind;
  onClose: () => void;
}) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [onClose]);

  return (
    <div
      className="cn-block-context-menu"
      style={{ top: y, left: x }}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={() => { duplicateSelectedBlock(editor); onClose(); }}>
        Duplicar
      </button>
      {kind === "table" ? (
        <>
          <button type="button" onClick={() => { editor.chain().focus().addRowBefore().run(); onClose(); }}>
            Fila arriba
          </button>
          <button type="button" onClick={() => { editor.chain().focus().addRowAfter().run(); onClose(); }}>
            Fila abajo
          </button>
          <button type="button" onClick={() => { editor.chain().focus().deleteRow().run(); onClose(); }}>
            Eliminar fila
          </button>
          <button type="button" onClick={() => { editor.chain().focus().addColumnBefore().run(); onClose(); }}>
            Col. izquierda
          </button>
          <button type="button" onClick={() => { editor.chain().focus().addColumnAfter().run(); onClose(); }}>
            Col. derecha
          </button>
          <button type="button" onClick={() => { editor.chain().focus().deleteColumn().run(); onClose(); }}>
            Eliminar columna
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => { moveSelectedBlock(editor, "up"); onClose(); }}>
            Mover arriba
          </button>
          <button type="button" onClick={() => { moveSelectedBlock(editor, "down"); onClose(); }}>
            Mover abajo
          </button>
        </>
      )}
      {kind === "studyBlock" ? (
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBlockquote().run();
            onClose();
          }}
        >
          Convertir a cita
        </button>
      ) : null}
      <button
        type="button"
        className="is-danger"
        onClick={() => {
          deleteSelectedBlock(editor);
          onClose();
        }}
      >
        Eliminar
      </button>
    </div>
  );
}

/** Clic en bloque → selección de nodo */
export function useBlockClickSelect(editor: Editor | null) {
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const table = target.closest("table");
      if (table && dom.contains(table) && (e.altKey || e.metaKey)) {
        const pos = editor.view.posAtDOM(table, 0);
        const $pos = editor.state.doc.resolve(pos);
        for (let d = $pos.depth; d > 0; d--) {
          if ($pos.node(d).type.name === "table") {
            selectBlockAt(editor, $pos.before(d));
            return;
          }
        }
      }
      if (target.closest("td, th, .column-resize-handle")) return;
      if (table && dom.contains(table)) {
        const pos = editor.view.posAtDOM(table, 0);
        const $pos = editor.state.doc.resolve(pos);
        for (let d = $pos.depth; d > 0; d--) {
          if ($pos.node(d).type.name === "table") {
            selectBlockAt(editor, $pos.before(d));
            return;
          }
        }
      }
      const block = target.closest("[data-study-block]");
      if (!block || !dom.contains(block)) return;
      if (e.detail > 1) return;
      const pos = editor.view.posAtDOM(block, 0);
      const $pos = editor.state.doc.resolve(pos);
      const nodePos = $pos.before();
      if (nodePos >= 0) selectBlockAt(editor, nodePos);
    };

    dom.addEventListener("click", onClick);
    return () => dom.removeEventListener("click", onClick);
  }, [editor]);
}
