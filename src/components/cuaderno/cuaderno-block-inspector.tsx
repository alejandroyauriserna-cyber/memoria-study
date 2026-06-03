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

  return (
    <aside
      className="cn-block-inspector"
      style={{ "--cn-inspector-accent": courseAccent } as React.CSSProperties}
    >
      <header className="cn-block-inspector-head">
        <h3>Inspector</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar inspector">
          <X size={16} />
        </button>
      </header>

      {!block?.kind ? (
        <p className="cn-block-inspector-empty">Selecciona una imagen, tabla o bloque jurídico.</p>
      ) : block.kind === "image" ? (
        <ImageInspector editor={editor} attrs={block.attrs} />
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

function ImageInspector({
  editor,
  attrs,
}: {
  editor: Editor;
  attrs: Record<string, unknown>;
}) {
  const width = (attrs.width as string) ?? "100%";
  const align = (attrs.align as string) ?? "center";

  return (
    <div className="cn-inspector-section">
      <p className="cn-inspector-label">Imagen</p>
      <label className="cn-inspector-field">
        Ancho
        <input
          type="range"
          min={30}
          max={100}
          value={parseInt(width, 10) || 100}
          onChange={(e) =>
            editor.chain().focus().updateAttributes("image", { width: `${e.target.value}%` }).run()
          }
        />
        <span>{width}</span>
      </label>
      <label className="cn-inspector-field">
        Alineación
        <select
          value={align}
          onChange={(e) =>
            editor.chain().focus().updateAttributes("image", { align: e.target.value }).run()
          }
        >
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
      </label>
      <label className="cn-inspector-field">
        <input
          type="checkbox"
          onChange={(e) =>
            editor
              .chain()
              .focus()
              .updateAttributes("image", {
                style: e.target.checked ? "box-shadow: 0 12px 32px rgba(0,0,0,0.15)" : null,
              })
              .run()
          }
        />
        Sombra suave
      </label>
    </div>
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
