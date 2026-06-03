"use client";

import { useCallback, useEffect, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { bodyToEditorHtml } from "@/lib/cuaderno/rich-text";
import { getFontStack, getGoogleFontsHref, DEFAULT_FONT_ID } from "@/lib/cuaderno/editor-fonts";
import { createCuadernoEditorExtensions } from "@/lib/cuaderno/cuaderno-editor-extensions";
import { CuadernoFormatBubble } from "@/components/cuaderno/cuaderno-format-bubble";
import type { CuadernoAskAction } from "@/types/cuaderno";
import "./cuaderno-rich-editor.css";

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
  onSelectionAction,
}: {
  body: string;
  onBodyChange: (html: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
  placeholder?: string;
  editable?: boolean;
  courseAccent?: string;
  className?: string;
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

  if (!editor) {
    return <div className={`cn-rich-editor-skeleton ${className}`} aria-hidden />;
  }

  return (
    <div
      className={`cn-rich-editor ${className}`}
      data-editable={editable ? "true" : "false"}
      style={{ "--cn-course-accent": courseAccent } as React.CSSProperties}
    >
      <EditorContent editor={editor} className="cn-rich-editor-content" />
      {editable ? (
        <CuadernoFormatBubble
          editor={editor}
          courseAccent={courseAccent}
          onAiAction={onSelectionAction}
        />
      ) : null}
    </div>
  );
}
