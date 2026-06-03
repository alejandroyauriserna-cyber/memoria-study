"use client";

import type { Editor } from "@tiptap/react";
import { ChevronDown, Minus, Table } from "lucide-react";
import { useState } from "react";
import { ACADEMIC_STYLES, STUDY_BLOCKS, applyAcademicStyle, insertStudyBlock } from "@/lib/cuaderno/academic-styles";
import type { StudyBlockId } from "@/lib/cuaderno/academic-styles";

export function CuadernoBlockToolbar({ editor }: { editor: Editor | null }) {
  const [stylesOpen, setStylesOpen] = useState(false);
  const [blocksOpen, setBlocksOpen] = useState(false);

  if (!editor) return null;

  return (
    <div className="cn-block-toolbar">
      <div className="cn-block-toolbar-group">
        <button type="button" className="cn-block-btn" onClick={() => editor.chain().focus().toggleTaskList().run()}>
          ☑ Lista
        </button>
        <button
          type="button"
          className="cn-block-btn"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <Table size={14} className="inline mr-1" />
          Tabla
        </button>
        <button type="button" className="cn-block-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={14} className="inline mr-1" />
          Separador
        </button>
        <button type="button" className="cn-block-btn" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {"</>"} Código
        </button>
      </div>

      <div className="cn-block-toolbar-group">
        <button
          type="button"
          className="cn-block-btn cn-block-btn--dropdown"
          onClick={() => {
            setStylesOpen((v) => !v);
            setBlocksOpen(false);
          }}
        >
          Estilos académicos <ChevronDown size={12} />
        </button>
        {stylesOpen ? (
          <div className="cn-block-dropdown">
            {ACADEMIC_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                className="cn-block-dropdown-item"
                onClick={() => {
                  applyAcademicStyle(editor, s.id);
                  setStylesOpen(false);
                }}
              >
                <span className="cn-block-dropdown-icon">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="cn-block-toolbar-group">
        <button
          type="button"
          className="cn-block-btn cn-block-btn--dropdown"
          onClick={() => {
            setBlocksOpen((v) => !v);
            setStylesOpen(false);
          }}
        >
          Bloques jurídicos <ChevronDown size={12} />
        </button>
        {blocksOpen ? (
          <div className="cn-block-dropdown cn-block-dropdown--wide">
            {STUDY_BLOCKS.map((b) => (
              <button
                key={b.id}
                type="button"
                className="cn-block-dropdown-item"
                onClick={() => {
                  insertStudyBlock(editor, b.id as StudyBlockId);
                  setBlocksOpen(false);
                }}
              >
                <span>{b.icon}</span> {b.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
