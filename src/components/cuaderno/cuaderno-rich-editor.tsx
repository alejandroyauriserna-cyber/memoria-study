"use client";

import { useCallback, useEffect, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { bodyToEditorHtml } from "@/lib/cuaderno/rich-text";
import { getFontStack, getGoogleFontsHref, DEFAULT_FONT_ID } from "@/lib/cuaderno/editor-fonts";
import { createCuadernoEditorExtensions } from "@/lib/cuaderno/cuaderno-editor-extensions";
import { CuadernoFormatBubble } from "@/components/cuaderno/cuaderno-format-bubble";
import { CuadernoFloatingEditToolbar } from "@/components/cuaderno/cuaderno-floating-edit-toolbar";
import { CuadernoBlockHandles, useBlockClickSelect } from "@/components/cuaderno/cuaderno-block-handles";
import type { CuadernoAskAction } from "@/types/cuaderno";
import "./cuaderno-rich-editor.css";
import "./cuaderno-blocks.css";

function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, " ").trim();
}

export function CuadernoRichEditor({
  body,
  onBodyChange,
  onEditorReady,
  placeholder = "Escribe tus apuntes…",
  editable = true,
  courseAccent = "#0d9488",
  className = "",
  immersiveEdit = false,
  lineHeight = "1.78",
  onOpenFormatPanel,
  onSelectionAction,
}: {
  body: string;
  onBodyChange: (html: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
  placeholder?: string;
  editable?: boolean;
  courseAccent?: string;
  className?: string;
  /** Toolbar flotante agrupada (modo inmersivo) */
  immersiveEdit?: boolean;
  lineHeight?: string;
  onOpenFormatPanel?: () => void;
  onSelectionAction?: (
    action: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence",
    selectedText: string,
  ) => void;
}) {
  const lastEmitted = useRef<string>("");
  const skipExternalSync = useRef(false);

  const emitChange = useCallback(
    (html: string) => {
      lastEmitted.current = html;
      skipExternalSync.current = true;
      onBodyChange(html);
    },
    [onBodyChange],
  );

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: createCuadernoEditorExtensions(placeholder),
    content: bodyToEditorHtml(body),
    editorProps: {
      attributes: {
        class: "cn-prosemirror",
        style: `--cn-course-accent: ${courseAccent}; font-family: ${getFontStack(DEFAULT_FONT_ID)}`,
        spellcheck: "true",
      },
      handleClick: (view, _pos, event) => {
        if (!editable) return true;
        view.focus();
        return false;
      },
      handleDOMEvents: {
        mousedown: (view, event) => {
          if (editable) view.focus();
          return false;
        },
      },
    },
    onUpdate: ({ editor: ed }) => {
      emitChange(ed.getHTML());
    },
  });

  useEffect(() => {
    onEditorReady?.(editor);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    const href = getGoogleFontsHref();
    const id = "cuaderno-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    if (skipExternalSync.current) {
      skipExternalSync.current = false;
      return;
    }
    const next = bodyToEditorHtml(body);
    const current = editor.getHTML();
    if (normalizeHtml(next) === normalizeHtml(current)) return;
    if (normalizeHtml(next) === normalizeHtml(lastEmitted.current)) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [body, editor]);

  useBlockClickSelect(editor);

  if (!editor) {
    return <div className={`cn-rich-editor-skeleton ${className}`} aria-hidden />;
  }

  return (
    <div
      className={`cn-rich-editor ${className}`}
      data-editable={editable ? "true" : "false"}
      style={
        {
          "--cn-course-accent": courseAccent,
          "--cn-line-height": lineHeight,
        } as React.CSSProperties
      }
    >
      <EditorContent editor={editor} className="cn-rich-editor-content" />
      {editable ? (
        <>
          {immersiveEdit ? (
            <CuadernoFloatingEditToolbar
              editor={editor}
              courseAccent={courseAccent}
              onAiAction={onSelectionAction}
              onOpenFormatPanel={onOpenFormatPanel}
            />
          ) : (
            <CuadernoFormatBubble
              editor={editor}
              courseAccent={courseAccent}
              onAiAction={onSelectionAction}
            />
          )}
          <CuadernoBlockHandles editor={editor} />
        </>
      ) : null}
    </div>
  );
}
