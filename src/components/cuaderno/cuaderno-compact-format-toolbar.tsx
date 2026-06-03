"use client";

import type { Editor } from "@tiptap/react";
import { useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  ChevronDown,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Table,
  Underline,
} from "lucide-react";
import { CUADERNO_FONTS, type CuadernoFontId } from "@/lib/cuaderno/editor-fonts";
import { ToolbarSelect } from "@/components/cuaderno/toolbar-select";
import { CuadernoFloatingMenu } from "@/components/cuaderno/cuaderno-floating-menu";
import "./cuaderno-editor-toolbar.css";

const TEXT_COLORS = ["#1c1917", "#1e3a5f", "#7f1d1d", "#14532d", "#5b21b6", "#0f766e"];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px"];

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

/** Barra de formato siempre visible — estilo Notion / Apple Notes */
export function CuadernoCompactFormatToolbar({
  editor,
  courseAccent = "#00E5C3",
  onOpenStickers,
  stickersOpen = false,
}: {
  editor: Editor | null;
  courseAccent?: string;
  onOpenStickers?: () => void;
  stickersOpen?: boolean;
}) {
  const [fontId, setFontId] = useState<CuadernoFontId | "">("");
  const [fontSize, setFontSize] = useState("");
  const [colorOpen, setColorOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const colorTriggerRef = useRef<HTMLButtonElement>(null);

  const insertImage = (file: File) => {
    if (!editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result as string }).run();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="cn-editor-toolbar-rail cn-editor-toolbar-rail--compact"
      style={{ "--cn-tb-accent": courseAccent } as React.CSSProperties}
      role="toolbar"
      aria-label="Formato de texto"
    >
      <div className="cn-editor-toolbar-scroll">
        <ToolbarSelect
          label="Fuente"
          value={fontId}
          options={CUADERNO_FONTS.map((f) => ({ value: f.id, label: f.label }))}
          onChange={(id) => {
            if (!editor) return;
            setFontId(id);
            const font = CUADERNO_FONTS.find((f) => f.id === id);
            if (font) editor.chain().focus().setFontFamily(font.stack).run();
          }}
        />
        <ToolbarSelect
          label="Tamaño"
          compact
          value={fontSize as (typeof FONT_SIZES)[number] | ""}
          options={FONT_SIZES.map((s) => ({ value: s, label: s.replace("px", "") }))}
          onChange={(v) => {
            if (!editor) return;
            setFontSize(v);
            editor.chain().focus().setFontSize(v).run();
          }}
        />

        <button
          ref={colorTriggerRef}
          type="button"
          className={`cn-tb-dropdown-trigger-v2 cn-tb-dropdown-trigger-v2--compact${colorOpen ? " is-open" : ""}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setColorOpen((v) => !v)}
        >
          <span className="cn-tb-color-dot" style={{ background: TEXT_COLORS[0] }} />
          Color
          <ChevronDown size={12} />
        </button>
        <CuadernoFloatingMenu
          open={colorOpen && !!editor}
          onClose={() => setColorOpen(false)}
          anchorRef={colorTriggerRef}
          width={200}
        >
          <p className="cn-floating-menu-heading">Texto</p>
          <div className="cn-tb-swatch-row cn-floating-menu-swatches">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="cn-tb-swatch"
                style={{ background: c }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor?.chain().focus().setColor(c).run()}
              />
            ))}
          </div>
        </CuadernoFloatingMenu>

        <span className="cn-tb-divider" aria-hidden />

        {editor ? (
          <>
            <ToolbarBtn title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold size={15} />
            </ToolbarBtn>
            <ToolbarBtn title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic size={15} />
            </ToolbarBtn>
            <ToolbarBtn title="Subrayado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <Underline size={15} />
            </ToolbarBtn>
            <ToolbarBtn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough size={15} />
            </ToolbarBtn>

            <span className="cn-tb-divider" aria-hidden />

            <ToolbarBtn title="Izquierda" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
              <AlignLeft size={15} />
            </ToolbarBtn>
            <ToolbarBtn title="Centro" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
              <AlignCenter size={15} />
            </ToolbarBtn>
            <ToolbarBtn title="Derecha" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
              <AlignRight size={15} />
            </ToolbarBtn>
            <ToolbarBtn title="Justificar" onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
              <AlignJustify size={15} />
            </ToolbarBtn>

            <span className="cn-tb-divider" aria-hidden />

            <ToolbarBtn title="Viñetas" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List size={15} />
            </ToolbarBtn>
            <ToolbarBtn title="Numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered size={15} />
            </ToolbarBtn>
            <ToolbarBtn title="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
              <CheckSquare size={15} />
            </ToolbarBtn>

            <span className="cn-tb-divider" aria-hidden />

            <ToolbarBtn
              title="Tabla"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
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
          </>
        ) : null}
        {onOpenStickers ? (
          <button
            type="button"
            className={`cn-tb-stickers-btn${stickersOpen ? " is-open" : ""}`}
            title="Stickers y post-its"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onOpenStickers}
          >
            ✨ Stickers
          </button>
        ) : null}
      </div>
    </div>
  );
}
