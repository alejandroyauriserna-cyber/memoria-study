"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Sparkles,
  Strikethrough,
  Underline,
} from "lucide-react";
import { CUADERNO_FONTS } from "@/lib/cuaderno/editor-fonts";
import type { CuadernoAskAction } from "@/types/cuaderno";

const TEXT_COLORS = ["#1c1917", "#1e3a5f", "#7f1d1d", "#14532d", "#5b21b6", "#0f766e"];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecdd3", "#e9d5ff", "#fde68a"];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px"];

export function CuadernoFormatBubble({
  editor,
  courseAccent,
  onAiAction,
}: {
  editor: Editor;
  courseAccent: string;
  onAiAction?: (
    action: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence",
    text: string,
  ) => void;
}) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      className="cn-format-bubble"
      options={{ placement: "top", offset: 8 }}
    >
      <div className="cn-format-bubble-inner" style={{ "--cn-accent": courseAccent } as React.CSSProperties}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
          title="Negrita"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
          title="Cursiva"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
          title="Subrayado"
        >
          <Underline size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "is-active" : ""}
          title="Tachado"
        >
          <Strikethrough size={15} />
        </button>

        <span className="cn-format-divider" />

        <select
          className="cn-format-select"
          value={editor.getAttributes("textStyle").fontFamily?.split(",")[0]?.replace(/"/g, "") ?? ""}
          onChange={(e) => {
            const font = CUADERNO_FONTS.find((f) => f.id === e.target.value);
            if (font) editor.chain().focus().setFontFamily(font.stack).run();
          }}
          title="Fuente"
        >
          <option value="">Fuente</option>
          {CUADERNO_FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          className="cn-format-select cn-format-select--narrow"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (v) editor.chain().focus().setFontSize(v).run();
            e.target.value = "";
          }}
          title="Tamaño"
        >
          <option value="">Tamaño</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="cn-format-colors">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="cn-format-swatch"
              style={{ background: c }}
              title="Color de texto"
              onClick={() => editor.chain().focus().setColor(c).run()}
            />
          ))}
        </div>

        <div className="cn-format-colors">
          {HIGHLIGHTS.map((c) => (
            <button
              key={c}
              type="button"
              className="cn-format-swatch cn-format-swatch--hi"
              style={{ background: c }}
              title="Resaltar"
              onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
            >
              <Highlighter size={10} />
            </button>
          ))}
        </div>

        <span className="cn-format-divider" />

        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Izquierda">
          <AlignLeft size={14} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centro">
          <AlignCenter size={14} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Derecha">
          <AlignRight size={14} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justificar">
          <AlignJustify size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "is-active" : ""}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "is-active" : ""}
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "is-active" : ""}
          title="Cita"
        >
          “
        </button>

        {onAiAction ? (
          <>
            <span className="cn-format-divider" />
            <button
              type="button"
              className="cn-format-ai"
              title="IA sobre selección"
              onClick={() => {
                const { from, to } = editor.state.selection;
                const text = editor.state.doc.textBetween(from, to, " ");
                if (text.trim().length >= 3) onAiAction("explain", text);
              }}
            >
              <Sparkles size={14} />
            </button>
          </>
        ) : null}
      </div>
    </BubbleMenu>
  );
}
