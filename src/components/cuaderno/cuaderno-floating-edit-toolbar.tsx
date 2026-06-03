"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useRef, useState } from "react";
import {
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
  Plus,
  Scale,
  Sparkles,
  Strikethrough,
  Table,
  Underline,
} from "lucide-react";
import { CuadernoFloatingMenu, FloatingMenuItem } from "@/components/cuaderno/cuaderno-floating-menu";
import { LEGAL_TOOLBAR_BLOCKS, insertStudyBlock } from "@/lib/cuaderno/academic-styles";
import type { StudyBlockId } from "@/lib/cuaderno/academic-styles";
import type { CuadernoAskAction } from "@/types/cuaderno";

type AiAction = CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence";

const AI_ACTIONS: Array<{ id: AiAction; label: string }> = [
  { id: "explain", label: "Explicar" },
  { id: "summarize", label: "Resumir" },
  { id: "flashcards", label: "Flashcards" },
  { id: "mind_map", label: "Mapa mental" },
  { id: "exam_questions", label: "Preguntas" },
  { id: "relate", label: "Relacionar" },
];

function GroupDivider() {
  return <span className="cn-float-tb-gap" aria-hidden />;
}

function MiniBtn({
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
      className={active ? "is-active" : ""}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function FloatDropdown({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={ref}
        type="button"
        className={`cn-float-tb-dropdown${open ? " is-open" : ""}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown size={11} />
      </button>
      <CuadernoFloatingMenu open={open} onClose={() => setOpen(false)} anchorRef={ref} width={220}>
        {children}
      </CuadernoFloatingMenu>
    </>
  );
}

export function CuadernoFloatingEditToolbar({
  editor,
  courseAccent,
  onAiAction,
  onOpenFormatPanel,
}: {
  editor: Editor;
  courseAccent: string;
  onAiAction?: (action: AiAction, text: string) => void;
  onOpenFormatPanel?: () => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const runAi = (action: AiAction) => {
    if (!onAiAction) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ").trim();
    if (text.length < 3) return;
    onAiAction(action, text);
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result as string }).run();
    };
    reader.readAsDataURL(file);
  };

  return (
    <BubbleMenu
      editor={editor}
      className="cn-float-edit-toolbar"
      options={{ placement: "top", offset: 12 }}
      shouldShow={({ editor: ed, state }) => {
        const { from, to } = state.selection;
        if (from === to) return false;
        return ed.state.doc.textBetween(from, to, " ").trim().length >= 1;
      }}
    >
      <div
        className="cn-float-edit-toolbar-inner"
        style={{ "--cn-accent": courseAccent } as React.CSSProperties}
        role="toolbar"
        aria-label="Herramientas de edición"
      >
        <div className="cn-float-tb-group" role="group" aria-label="Formato">
          <MiniBtn
            title="Negrita"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={15} />
          </MiniBtn>
          <MiniBtn
            title="Cursiva"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={15} />
          </MiniBtn>
          <MiniBtn
            title="Subrayado"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline size={15} />
          </MiniBtn>
          <MiniBtn
            title="Tachado"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={15} />
          </MiniBtn>
          {onOpenFormatPanel ? (
            <MiniBtn title="Más formato" onClick={onOpenFormatPanel}>
              <Plus size={15} />
            </MiniBtn>
          ) : null}
        </div>

        <GroupDivider />

        <div className="cn-float-tb-group" role="group" aria-label="Insertar">
          <FloatDropdown label="Insertar" icon={<Plus size={14} />}>
            <FloatingMenuItem
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
            >
              <Table size={14} className="inline mr-2 opacity-70" /> Tabla
            </FloatingMenuItem>
            <FloatingMenuItem onClick={() => imageInputRef.current?.click()}>
              <ImageIcon size={14} className="inline mr-2 opacity-70" /> Imagen
            </FloatingMenuItem>
            <FloatingMenuItem onClick={() => insertStudyBlock(editor, "audio")}>
              <Mic size={14} className="inline mr-2 opacity-70" /> Audio
            </FloatingMenuItem>
            <FloatingMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              <Minus size={14} className="inline mr-2 opacity-70" /> Divisor
            </FloatingMenuItem>
            <FloatingMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
              <Code2 size={14} className="inline mr-2 opacity-70" /> Código
            </FloatingMenuItem>
            <FloatingMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List size={14} className="inline mr-2 opacity-70" /> Lista
            </FloatingMenuItem>
            <FloatingMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered size={14} className="inline mr-2 opacity-70" /> Numerada
            </FloatingMenuItem>
            <FloatingMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>
              <CheckSquare size={14} className="inline mr-2 opacity-70" /> Checklist
            </FloatingMenuItem>
          </FloatDropdown>
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
        </div>

        <GroupDivider />

        <div className="cn-float-tb-group" role="group" aria-label="Jurídico">
          <FloatDropdown label="Jurídico" icon={<Scale size={14} />}>
            {LEGAL_TOOLBAR_BLOCKS.map((b) => (
              <FloatingMenuItem
                key={b.id}
                onClick={() => insertStudyBlock(editor, b.id as StudyBlockId)}
              >
                <span className="cn-tb-menu-icon">{b.icon}</span> {b.label}
              </FloatingMenuItem>
            ))}
          </FloatDropdown>
        </div>

        {onAiAction ? (
          <>
            <GroupDivider />
            <div className="cn-float-tb-group" role="group" aria-label="IA">
              <FloatDropdown label="IA" icon={<Sparkles size={14} />}>
                {AI_ACTIONS.map((a) => (
                  <FloatingMenuItem key={a.id} onClick={() => runAi(a.id)}>
                    <Brain size={14} className="inline mr-2 opacity-70" /> {a.label}
                  </FloatingMenuItem>
                ))}
              </FloatDropdown>
            </div>
          </>
        ) : null}
      </div>
    </BubbleMenu>
  );
}
