"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { convertStudyBlockVariant, getSelectedBlock } from "@/lib/cuaderno/cuaderno-block-utils";
import { LEGAL_TOOLBAR_BLOCKS } from "@/lib/cuaderno/academic-styles";

export function CuadernoBlockInspector({
  editor,
  open,
  onClose,
  courseAccent,
}: {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
  courseAccent: string;
}) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!editor || !open) return;
    const bump = () => tick((n) => n + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor, open]);

  if (!open || !editor) return null;

  const block = getSelectedBlock(editor);
  const panelTitle =
    block?.kind === "table" ? "Tabla" : block?.kind === "studyBlock" ? "Bloque jurídico" : "Contexto";

  return (
    <aside
      className="cn-block-inspector cn-block-inspector--luxury"
      style={{ "--cn-inspector-accent": courseAccent } as React.CSSProperties}
    >
      <header className="cn-block-inspector-head">
        <h3>{panelTitle}</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar inspector">
          <X size={16} />
        </button>
      </header>

      {!block?.kind ? (
        <p className="cn-block-inspector-empty">
          Selecciona una tabla o bloque jurídico para ver opciones.
        </p>
      ) : block.kind === "table" ? (
        <TableInspector editor={editor} />
      ) : block.kind === "studyBlock" ? (
        <StudyBlockInspector editor={editor} attrs={block.attrs} />
      ) : (
        <p className="cn-block-inspector-empty">Bloque seleccionado.</p>
      )}
    </aside>
  );
}

function TableInspector({ editor }: { editor: Editor }) {
  return (
    <div className="cn-inspector-section">
      <p className="cn-inspector-label">Tabla</p>
      <div className="cn-inspector-actions">
        <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}>
          + Columna
        </button>
        <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()}>
          + Fila
        </button>
        <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()}>
          − Columna
        </button>
        <button type="button" onClick={() => editor.chain().focus().deleteRow().run()}>
          − Fila
        </button>
        <button type="button" onClick={() => editor.chain().focus().deleteTable().run()}>
          Eliminar tabla
        </button>
      </div>
    </div>
  );
}

function StudyBlockInspector({
  editor,
  attrs,
}: {
  editor: Editor;
  attrs: Record<string, unknown>;
}) {
  const variant = (attrs.variant as string) ?? "caso";
  const label = (attrs.label as string) ?? "Bloque";

  return (
    <div className="cn-inspector-section">
      <p className="cn-inspector-label">Bloque jurídico</p>
      <label className="cn-inspector-field">
        Tipo
        <select
          value={variant}
          onChange={(e) => {
            const item = LEGAL_TOOLBAR_BLOCKS.find((b) => b.id === e.target.value);
            if (item) convertStudyBlockVariant(editor, item.id, item.label);
          }}
        >
          {LEGAL_TOOLBAR_BLOCKS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </label>
      <label className="cn-inspector-field">
        Etiqueta
        <input
          type="text"
          value={label}
          onChange={(e) =>
            editor.chain().focus().updateAttributes("studyBlock", { label: e.target.value }).run()
          }
        />
      </label>
    </div>
  );
}
