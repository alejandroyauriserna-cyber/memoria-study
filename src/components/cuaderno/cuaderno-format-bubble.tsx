"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Highlighter, Italic, Sparkles, Underline } from "lucide-react";
import { CUADERNO_HIGHLIGHT_COLORS, CUADERNO_TEXT_COLORS } from "@/lib/cuaderno/editor-colors";
import type { CuadernoAskAction } from "@/types/cuaderno";

type AiAction = CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence" | "simplify";

const IMMERSIVE_STUDY_ACTIONS: Array<{
  id: AiAction;
  label: string;
  hint: string;
}> = [
  { id: "explain", label: "Explicar", hint: "La IA te lo explica con tus apuntes" },
  { id: "flashcards", label: "Flashcard", hint: "Crea una tarjeta de repaso" },
  { id: "simplify", label: "Simplificar", hint: "Versión más fácil de entender" },
];

function selectedTextFrom(editor: Editor): string {
  const { from, to } = editor.state.selection;
  return editor.state.doc.textBetween(from, to, " ").trim();
}

function shouldShowBubble(ed: Editor, state: Editor["state"], minChars = 1) {
  const { from, to } = state.selection;
  if (from === to) return false;
  return ed.state.doc.textBetween(from, to, " ").trim().length >= minChars;
}

export function CuadernoFormatBubble({
  editor,
  courseAccent,
  onAiAction,
  variant = "default",
}: {
  editor: Editor;
  courseAccent: string;
  onAiAction?: (action: AiAction, text: string) => void;
  /** Inmersivo: una sola barra clara para estudiantes (resaltar + IA) */
  variant?: "default" | "immersive";
}) {
  if (!editor) return null;

  const runStudy = (action: AiAction) => {
    if (!onAiAction) return;
    const text = selectedTextFrom(editor);
    if (text.length < 2) return;
    if (action === "simplify") {
      onAiAction("explain", `Explica de forma simple y breve: «${text}»`);
      return;
    }
    onAiAction(action, text);
  };

  if (variant === "immersive") {
    return (
      <BubbleMenu
        editor={editor}
        className="cn-format-bubble cn-format-bubble--immersive"
        options={{ placement: "bottom", offset: 10 }}
        shouldShow={({ editor: ed, state }) => shouldShowBubble(ed, state, 2)}
      >
        <div
          className="cn-format-bubble-inner cn-format-bubble-inner--immersive"
          style={{ "--cn-accent": courseAccent } as React.CSSProperties}
          role="toolbar"
          aria-label="Resaltar y estudiar selección"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="cn-format-bubble-section">
            <span className="cn-format-bubble-label">
              <Highlighter size={12} aria-hidden />
              Resaltar
            </span>
            <div className="cn-format-colors cn-format-colors--hi">
              {CUADERNO_HIGHLIGHT_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  type="button"
                  className={`cn-format-swatch cn-format-swatch--hi cn-format-swatch--lg${editor.isActive("highlight", { color }) ? " is-active" : ""}`}
                  style={{ background: color }}
                  title={label}
                  aria-label={`Resaltar en ${label}`}
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                />
              ))}
            </div>
          </div>

          <span className="cn-format-divider" aria-hidden />

          <div className="cn-format-bubble-section cn-format-bubble-section--inline">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "is-active" : ""}
              title="Negrita"
              aria-label="Negrita"
            >
              <Bold size={15} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "is-active" : ""}
              title="Cursiva"
              aria-label="Cursiva"
            >
              <Italic size={15} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              title="Quitar resaltado"
              aria-label="Quitar resaltado"
              className="cn-format-clear-hi"
            >
              Quitar
            </button>
          </div>

          {onAiAction ? (
            <>
              <span className="cn-format-divider" aria-hidden />
              <div className="cn-format-bubble-section">
                <span className="cn-format-bubble-label">
                  <Sparkles size={12} aria-hidden />
                  Estudiar con IA
                </span>
                <div className="cn-format-study-actions">
                  {IMMERSIVE_STUDY_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="cn-format-study-btn"
                      title={action.hint}
                      onClick={() => runStudy(action.id)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </BubbleMenu>
    );
  }

  return (
    <BubbleMenu
      editor={editor}
      className="cn-format-bubble"
      options={{ placement: "top", offset: 10 }}
      shouldShow={({ editor: ed, state }) => shouldShowBubble(ed, state, 1)}
    >
      <div
        className="cn-format-bubble-inner"
        style={{ "--cn-accent": courseAccent } as React.CSSProperties}
        role="toolbar"
        aria-label="Formato rápido"
        onMouseDown={(e) => e.preventDefault()}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
          title="Negrita"
        >
          <Bold size={15} strokeWidth={2.5} />
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

        <span className="cn-format-divider" />

        <div className="cn-format-colors">
          {CUADERNO_TEXT_COLORS.map((c) => (
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
          {CUADERNO_HIGHLIGHT_COLORS.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              className="cn-format-swatch cn-format-swatch--hi"
              style={{ background: color }}
              title={label}
              onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
            >
              <Highlighter size={9} />
            </button>
          ))}
        </div>

        {onAiAction ? (
          <>
            <span className="cn-format-divider" />
            <button
              type="button"
              className="cn-format-ai"
              title="Explicar con IA"
              onClick={() => runStudy("explain")}
            >
              <Sparkles size={14} />
            </button>
          </>
        ) : null}
      </div>
    </BubbleMenu>
  );
}
