"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Highlighter, Italic, MessageSquare, Sparkles, Underline } from "lucide-react";
import type { CuadernoAskAction } from "@/types/cuaderno";

const TEXT_COLORS = ["#1c1917", "#1e3a5f", "#7f1d1d", "#14532d", "#5b21b6", "#0f766e"];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecdd3", "#e9d5ff", "#fde68a"];

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
      options={{ placement: "top", offset: 10 }}
      shouldShow={({ editor: ed, state }) => {
        const { from, to } = state.selection;
        if (from === to) return false;
        const text = ed.state.doc.textBetween(from, to, " ").trim();
        return text.length >= 1;
      }}
    >
      <div
        className="cn-format-bubble-inner"
        style={{ "--cn-accent": courseAccent } as React.CSSProperties}
        role="toolbar"
        aria-label="Formato rápido"
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
          title="Negrita"
        >
          <Bold size={15} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
          title="Cursiva"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
          title="Subrayado"
        >
          <Underline size={15} />
        </button>

        <span className="cn-format-divider" />

        <div className="cn-format-colors">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="cn-format-swatch"
              style={{ background: c }}
              title="Color"
              onMouseDown={(e) => e.preventDefault()}
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
            >
              <Highlighter size={9} />
            </button>
          ))}
        </div>

        <span className="cn-format-divider" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "is-active" : ""}
          title="Comentar"
        >
          <MessageSquare size={14} />
        </button>

        {onAiAction ? (
          <button
            type="button"
            className="cn-format-ai"
            title="IA sobre selección"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const { from, to } = editor.state.selection;
              const text = editor.state.doc.textBetween(from, to, " ");
              if (text.trim().length >= 3) onAiAction("explain", text);
            }}
          >
            <Sparkles size={14} />
          </button>
        ) : null}
      </div>
    </BubbleMenu>
  );
}
