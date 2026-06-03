"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Brain,
  CheckSquare,
  ChevronDown,
  Code2,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Mic,
  Minus,
  Scale,
  Sparkles,
  Strikethrough,
  Table,
  Underline,
} from "lucide-react";
import { CUADERNO_FONTS } from "@/lib/cuaderno/editor-fonts";
import { LEGAL_TOOLBAR_BLOCKS, insertStudyBlock } from "@/lib/cuaderno/academic-styles";
import type { StudyBlockId } from "@/lib/cuaderno/academic-styles";
import type { CuadernoAskAction } from "@/types/cuaderno";
import "./cuaderno-editor-toolbar.css";

const TEXT_COLORS = ["#1c1917", "#1e3a5f", "#7f1d1d", "#14532d", "#5b21b6", "#0f766e"];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecdd3", "#e9d5ff", "#fde68a"];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px"];

type AiToolbarAction = CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence";

const AI_ACTIONS: Array<{ id: AiToolbarAction; label: string }> = [
  { id: "explain", label: "Explicar" },
  { id: "summarize", label: "Resumir" },
  { id: "flashcards", label: "Flashcards" },
  { id: "mind_map", label: "Mapa mental" },
  { id: "exam_questions", label: "Preguntas" },
  { id: "relate", label: "Relacionar conceptos" },
];

function getEditorContextText(editor: Editor): string {
  const { from, to } = editor.state.selection;
  const selected = editor.state.doc.textBetween(from, to, " ").trim();
  if (selected.length >= 3) return selected;
  return editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n").trim();
}

function ToolbarBtn({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`cn-tb-btn${active ? " is-active" : ""}`}
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="cn-tb-divider" aria-hidden />;
}

function ToolbarDropdown({
  label,
  icon,
  open,
  onToggle,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`cn-tb-dropdown${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="cn-tb-dropdown-trigger"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggle}
        aria-expanded={open}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown size={12} className="cn-tb-chevron" />
      </button>
      {open ? <div className="cn-tb-dropdown-panel">{children}</div> : null}
    </div>
  );
}

export function CuadernoEditorToolbar({
  editor,
  courseAccent = "#0d9488",
  disabled = false,
  onAiAction,
}: {
  editor: Editor | null;
  courseAccent?: string;
  disabled?: boolean;
  onAiAction?: (action: AiToolbarAction, text: string) => void;
}) {
  const [legalOpen, setLegalOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeMenus(e: MouseEvent) {
      if (!railRef.current?.contains(e.target as Node)) {
        setLegalOpen(false);
        setAiOpen(false);
        setColorOpen(false);
      }
    }
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  if (!editor || disabled) {
    return (
      <div
        className="cn-editor-toolbar-rail is-disabled"
        style={{ "--cn-tb-accent": courseAccent } as React.CSSProperties}
        aria-hidden
      />
    );
  }

  const runAi = (action: AiToolbarAction) => {
    if (!onAiAction) return;
    const text = getEditorContextText(editor);
    if (text.length < 3) return;
    onAiAction(action, text);
    setAiOpen(false);
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      ref={railRef}
      className="cn-editor-toolbar-rail"
      style={{ "--cn-tb-accent": courseAccent } as React.CSSProperties}
      role="toolbar"
      aria-label="Formato del cuaderno"
    >
      <div className="cn-editor-toolbar-scroll">
        {/* Formato */}
        <div className="cn-tb-group" role="group" aria-label="Formato">
          <select
            className="cn-tb-select"
            title="Fuente"
            defaultValue=""
            onChange={(e) => {
              const font = CUADERNO_FONTS.find((f) => f.id === e.target.value);
              if (font) editor.chain().focus().setFontFamily(font.stack).run();
            }}
          >
            <option value="" disabled>
              Fuente
            </option>
            {CUADERNO_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="cn-tb-select cn-tb-select--sm"
            title="Tamaño"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setFontSize(v).run();
            }}
          >
            <option value="" disabled>
              Tamaño
            </option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s.replace("px", "")}
              </option>
            ))}
          </select>
          <ToolbarDivider />
          <ToolbarBtn
            title="Negrita"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Cursiva"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Subrayado"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Tachado"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={15} />
          </ToolbarBtn>
        </div>

        <ToolbarDivider />

        {/* Color */}
        <div className="cn-tb-group cn-tb-group--color" role="group" aria-label="Color">
          <div className={`cn-tb-dropdown cn-tb-dropdown--inline${colorOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="cn-tb-dropdown-trigger cn-tb-dropdown-trigger--compact"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setColorOpen((v) => !v);
                setLegalOpen(false);
                setAiOpen(false);
              }}
            >
              <span className="cn-tb-color-dot" style={{ background: TEXT_COLORS[0] }} />
              Color
              <ChevronDown size={12} className="cn-tb-chevron" />
            </button>
            {colorOpen ? (
              <div className="cn-tb-popover cn-tb-popover--colors">
                <p className="cn-tb-popover-label">Texto</p>
                <div className="cn-tb-swatch-row">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="cn-tb-swatch"
                      style={{ background: c }}
                      title="Color de texto"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor.chain().focus().setColor(c).run()}
                    />
                  ))}
                </div>
                <p className="cn-tb-popover-label">Resaltado</p>
                <div className="cn-tb-swatch-row">
                  {HIGHLIGHTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="cn-tb-swatch cn-tb-swatch--hi"
                      style={{ background: c }}
                      title="Resaltar"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <ToolbarDivider />

        {/* Párrafo */}
        <div className="cn-tb-group" role="group" aria-label="Párrafo">
          <ToolbarBtn title="Alinear izquierda" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft size={15} />
          </ToolbarBtn>
          <ToolbarBtn title="Centrar" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter size={15} />
          </ToolbarBtn>
          <ToolbarBtn title="Alinear derecha" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight size={15} />
          </ToolbarBtn>
          <ToolbarBtn title="Justificar" onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
            <AlignJustify size={15} />
          </ToolbarBtn>
        </div>

        <ToolbarDivider />

        {/* Listas */}
        <div className="cn-tb-group" role="group" aria-label="Listas">
          <ToolbarBtn
            title="Viñetas"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Numeración"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Checklist"
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <CheckSquare size={15} />
          </ToolbarBtn>
        </div>

        <ToolbarDivider />

        {/* Insertar */}
        <div className="cn-tb-group" role="group" aria-label="Insertar">
          <ToolbarBtn
            title="Tabla"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <Table size={15} />
          </ToolbarBtn>
          <ToolbarBtn title="Imagen" onClick={() => imageInputRef.current?.click()}>
            <ImageIcon size={15} />
          </ToolbarBtn>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) insertImage(file);
              e.target.value = "";
            }}
          />
          <ToolbarBtn title="Nota de audio" onClick={() => insertStudyBlock(editor, "audio")}>
            <Mic size={15} />
          </ToolbarBtn>
          <ToolbarBtn title="Línea divisoria" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Código"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 size={15} />
          </ToolbarBtn>
        </div>

        <ToolbarDivider />

        {/* Jurídico */}
        <ToolbarDropdown
          label="Jurídico"
          icon={<Scale size={14} />}
          open={legalOpen}
          onToggle={() => {
            setLegalOpen((v) => !v);
            setAiOpen(false);
            setColorOpen(false);
          }}
        >
          {LEGAL_TOOLBAR_BLOCKS.map((b) => (
            <button
              key={b.id}
              type="button"
              className="cn-tb-menu-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                insertStudyBlock(editor, b.id as StudyBlockId);
                setLegalOpen(false);
              }}
            >
              <span className="cn-tb-menu-icon">{b.icon}</span>
              {b.label}
            </button>
          ))}
        </ToolbarDropdown>

        {onAiAction ? (
          <>
            <ToolbarDivider />
            <ToolbarDropdown
              label="IA"
              icon={<Sparkles size={14} />}
              open={aiOpen}
              onToggle={() => {
                setAiOpen((v) => !v);
                setLegalOpen(false);
                setColorOpen(false);
              }}
            >
              {AI_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="cn-tb-menu-item cn-tb-menu-item--ai"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runAi(a.id)}
                >
                  <Brain size={14} />
                  {a.label}
                </button>
              ))}
            </ToolbarDropdown>
          </>
        ) : null}
      </div>
    </div>
  );
}
