"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const block = getSelectedBlock(editor);
      if (!block?.kind) {
        setRect(null);
        setKind(null);
        return;
      }
      setKind(block.kind);
      if (block.kind === "table") {
        const table = editor.view.dom.querySelector("table");
        setRect(table?.getBoundingClientRect() ?? null);
        return;
      }
      if (block.pos >= 0) {
        const dom = editor.view.nodeDOM(block.pos) as HTMLElement | null;
        setRect(dom?.getBoundingClientRect() ?? null);
      }
    };

    update();
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    window.addEventListener("scroll", update, true);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
      window.removeEventListener("scroll", update, true);
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
      if (target.closest("td, th, .cn-prosemirror")) {
        const inTable = target.closest("table");
        if (inTable && (target.closest("td") || target.closest("th"))) return;
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
