"use client";

import type { Editor } from "@tiptap/react";
import { useRef, useState } from "react";
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
import { CUADERNO_FONTS, type CuadernoFontId } from "@/lib/cuaderno/editor-fonts";
import { ToolbarSelect } from "@/components/cuaderno/toolbar-select";
import { CuadernoFloatingMenu, FloatingMenuItem } from "@/components/cuaderno/cuaderno-floating-menu";
import { LEGAL_TOOLBAR_BLOCKS, insertStudyBlock } from "@/lib/cuaderno/academic-styles";
import { CuadernoTableInsertDialog } from "@/components/cuaderno/cuaderno-table-insert-dialog";
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

function ToolbarFloatingDropdown({
  label,
  icon,
  open,
  onToggle,
  onClose,
  children,
  width = 240,
}: {
  label: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`cn-tb-dropdown-trigger-v2${open ? " is-open" : ""}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggle}
        aria-expanded={open}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown size={12} className={open ? "is-open" : ""} />
      </button>
      <CuadernoFloatingMenu open={open} onClose={onClose} anchorRef={triggerRef} width={width}>
        {children}
      </CuadernoFloatingMenu>
    </>
  );
}

export function CuadernoEditorToolbar({
  editor,
  courseAccent = "#0d9488",
  disabled = false,
  onAiAction,
  onInsertImageFile,
}: {
  editor: Editor | null;
  courseAccent?: string;
  disabled?: boolean;
  onAiAction?: (action: AiToolbarAction, text: string) => void;
  onInsertImageFile?: (file: File) => void;
}) {
  const [legalOpen, setLegalOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [fontId, setFontId] = useState<CuadernoFontId | "">("");
  const [fontSize, setFontSize] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const colorTriggerRef = useRef<HTMLButtonElement>(null);

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
    onInsertImageFile?.(file);
  };

  return (
    <div
      className="cn-editor-toolbar-rail"
      style={{ "--cn-tb-accent": courseAccent } as React.CSSProperties}
      role="toolbar"
      aria-label="Barra de herramientas de formato"
    >
      <div className="cn-editor-toolbar-scroll">
        {/* 1. Tipografía: Fuente y Tamaño */}
        <div className="cn-tb-group" role="group" aria-label="Tipografía">
          <ToolbarSelect
            label="Fuente"
            value={fontId}
            options={CUADERNO_FONTS.map((f) => ({ value: f.id, label: f.label }))}
            onChange={(id) => {
              setFontId(id);
              const font = CUADERNO_FONTS.find((f) => f.id === id);
              if (font) editor.chain().focus().setFontFamily(font.stack).run();
            }}
          />
          <ToolbarSelect
            label="Tamaño"
            compact
            value={fontSize as (typeof FONT_SIZES)[number] | ""}
            options={FONT_SIZES.map((s) => ({ value: s, label: s.replace("px", " pt") }))}
            onChange={(v) => {
              setFontSize(v);
              editor.chain().focus().setFontSize(v).run();
            }}
          />
        </div>

        <ToolbarDivider />

        {/* 2. Estilo de Texto: Negrita, Cursiva, Subrayado, Tachado */}
        <div className="cn-tb-group" role="group" aria-label="Estilo de texto">
          <ToolbarBtn
            title="Negrita (Ctrl+B)"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Cursiva (Ctrl+I)"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Subrayado (Ctrl+U)"
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

        {/* 3. Color y Resaltado */}
        <div className="cn-tb-group cn-tb-group--color" role="group" aria-label="Color y resaltado">
          <button
            ref={colorTriggerRef}
            type="button"
            className={`cn-tb-dropdown-trigger-v2 cn-tb-dropdown-trigger-v2--compact${colorOpen ? " is-open" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setColorOpen((v) => !v);
              setLegalOpen(false);
              setAiOpen(false);
            }}
            aria-label="Abrir selector de color"
            aria-expanded={colorOpen}
          >
            <span className="cn-tb-color-dot" style={{ background: TEXT_COLORS[0] }} />
            Color
            <ChevronDown size={12} className={colorOpen ? "is-open" : ""} />
          </button>
          <CuadernoFloatingMenu
            open={colorOpen}
            onClose={() => setColorOpen(false)}
            anchorRef={colorTriggerRef}
            width={220}
          >
            <p className="cn-floating-menu-heading">Texto</p>
            <div className="cn-tb-swatch-row cn-floating-menu-swatches">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="cn-tb-swatch"
                  style={{ background: c }}
                  title="Color de texto"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().setColor(c).run()}
                  aria-label={`Color de texto ${c}`}
                />
              ))}
            </div>
            <p className="cn-floating-menu-heading">Resaltado</p>
            <div className="cn-tb-swatch-row cn-floating-menu-swatches">
              {HIGHLIGHTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="cn-tb-swatch cn-tb-swatch--hi"
                  style={{ background: c }}
                  title="Resaltar"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                  aria-label={`Resaltado ${c}`}
                />
              ))}
            </div>
          </CuadernoFloatingMenu>
        </div>

        <ToolbarDivider />

        {/* 4. Alineación: Izquierda, Centro, Derecha, Justificado */}
        <div className="cn-tb-group" role="group" aria-label="Alineación de párrafo">
          <ToolbarBtn
            title="Alinear a la izquierda"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Centrar"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Alinear a la derecha"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Justificar"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustify size={15} />
          </ToolbarBtn>
        </div>

        <ToolbarDivider />

        {/* 5. Listas: Viñetas, Numeración, Checklist */}
        <div className="cn-tb-group" role="group" aria-label="Listas">
          <ToolbarBtn
            title="Viñetas (Lista sin orden)"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Numeración (Lista ordenada)"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Checklist (Tareas)"
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <CheckSquare size={15} />
          </ToolbarBtn>
        </div>

        <ToolbarDivider />

        {/* 6. Inserción: Tabla, Imagen, Audio, Código */}
        <div className="cn-tb-group" role="group" aria-label="Insertar contenido">
          <ToolbarBtn title="Insertar tabla" onClick={() => setTableDialogOpen(true)}>
            <Table size={15} />
          </ToolbarBtn>
          <ToolbarBtn title="Insertar imagen" onClick={() => imageInputRef.current?.click()}>
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
            aria-label="Seleccionar archivo de imagen"
          />
          <ToolbarBtn title="Insertar bloque de código" onClick={() => insertStudyBlock(editor, "audio")}>
            <Mic size={15} />
          </ToolbarBtn>
          <ToolbarBtn title="Insertar línea divisoria" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Bloque de código (Ctrl+Alt+C)"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 size={15} />
          </ToolbarBtn>
        </div>

        <ToolbarDivider />

        {/* 7. Bloques Jurídicos */}
        <ToolbarFloatingDropdown
          label="Jurídico"
          icon={<Scale size={14} />}
          open={legalOpen}
          onToggle={() => {
            setLegalOpen((v) => !v);
            setAiOpen(false);
            setColorOpen(false);
          }}
          onClose={() => setLegalOpen(false)}
        >
          {LEGAL_TOOLBAR_BLOCKS.map((b) => (
            <FloatingMenuItem
              key={b.id}
              onClick={() => {
                insertStudyBlock(editor, b.id as StudyBlockId);
                setLegalOpen(false);
              }}
            >
              <span className="cn-tb-menu-icon">{b.icon}</span> {b.label}
            </FloatingMenuItem>
          ))}
        </ToolbarFloatingDropdown>

        {/* 8. Asistente de IA */}
        {onAiAction ? (
          <>
            <ToolbarDivider />
            <ToolbarFloatingDropdown
              label="IA"
              icon={<Sparkles size={14} />}
              open={aiOpen}
              onToggle={() => {
                setAiOpen((v) => !v);
                setLegalOpen(false);
                setColorOpen(false);
              }}
              onClose={() => setAiOpen(false)}
            >
              {AI_ACTIONS.map((a) => (
                <FloatingMenuItem key={a.id} onClick={() => runAi(a.id)}>
                  <Brain size={14} className="inline mr-2" /> {a.label}
                </FloatingMenuItem>
              ))}
            </ToolbarFloatingDropdown>
          </>
        ) : null}
      </div>

      <CuadernoTableInsertDialog
        open={tableDialogOpen}
        onClose={() => setTableDialogOpen(false)}
        editor={editor}
      />
    </div>
  );
}
