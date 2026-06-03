"use client";

import type { Editor } from "@tiptap/react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  deleteSelectedBlock,
  duplicateSelectedBlock,
  moveSelectedBlock,
  type CuadernoBlockKind,
} from "@/lib/cuaderno/cuaderno-block-utils";

function TableQuickActions({ editor }: { editor: Editor }) {
  return (
    <>
      <button type="button" title="Fila arriba" onClick={() => editor.chain().focus().addRowBefore().run()}>
        +F↑
      </button>
      <button type="button" title="Fila abajo" onClick={() => editor.chain().focus().addRowAfter().run()}>
        +F↓
      </button>
      <button type="button" title="Col. izq." onClick={() => editor.chain().focus().addColumnBefore().run()}>
        +C←
      </button>
      <button type="button" title="Col. der." onClick={() => editor.chain().focus().addColumnAfter().run()}>
        +C→
      </button>
    </>
  );
}

export function BlockHandleBar({
  editor,
  kind,
  onMore,
}: {
  editor: Editor;
  kind: CuadernoBlockKind;
  onMore?: (e: React.MouseEvent) => void;
}) {
  if (!kind) return null;

  return (
    <div className="cn-block-handle-bar" contentEditable={false} onMouseDown={(e) => e.preventDefault()}>
      <button type="button" className="cn-block-handle-drag" title="Arrastrar" aria-label="Mover bloque">
        <GripVertical size={14} />
      </button>
      {kind === "table" ? <TableQuickActions editor={editor} /> : (
        <>
          <button
            type="button"
            title="Subir"
            aria-label="Mover arriba"
            onClick={() => moveSelectedBlock(editor, "up")}
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            title="Bajar"
            aria-label="Mover abajo"
            onClick={() => moveSelectedBlock(editor, "down")}
          >
            <ArrowDown size={14} />
          </button>
        </>
      )}
      <button
        type="button"
        title="Duplicar"
        aria-label="Duplicar"
        onClick={() => duplicateSelectedBlock(editor)}
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        title="Eliminar"
        aria-label="Eliminar"
        className="cn-block-handle-danger"
        onClick={() => deleteSelectedBlock(editor)}
      >
        <Trash2 size={14} />
      </button>
      {onMore ? (
        <button type="button" title="Más opciones" aria-label="Más" onClick={onMore}>
          <MoreHorizontal size={14} />
        </button>
      ) : null}
    </div>
  );
}
