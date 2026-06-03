"use client";

import { useCallback, useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Strike from "@tiptap/extension-strike";
import CodeBlock from "@tiptap/extension-code-block";
import { bodyToEditorHtml } from "@/lib/cuaderno/rich-text";
import { getFontStack, getGoogleFontsHref, DEFAULT_FONT_ID } from "@/lib/cuaderno/editor-fonts";
import { FontSize } from "@/components/cuaderno/tiptap/font-size";
import { StudyBlock } from "@/components/cuaderno/tiptap/study-block";
import { CuadernoFormatBubble } from "@/components/cuaderno/cuaderno-format-bubble";
import { CuadernoBlockToolbar } from "@/components/cuaderno/cuaderno-block-toolbar";
import type { CuadernoAskAction } from "@/types/cuaderno";
import "./cuaderno-rich-editor.css";

function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, " ").trim();
}

export function CuadernoRichEditor({
  body,
  onBodyChange,
  placeholder = "Escribe tus apuntes…",
  editable = true,
  courseAccent = "#0d9488",
  className = "",
  onSelectionAction,
}: {
  body: string;
  onBodyChange: (html: string) => void;
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
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        strike: false,
      }),
      Underline,
      Strike,
      TextStyle,
      Color,
      FontSize,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      HorizontalRule,
      CodeBlock.configure({ HTMLAttributes: { class: "cn-code-block" } }),
      Placeholder.configure({ placeholder }),
      StudyBlock,
    ],
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
      {editable ? <CuadernoBlockToolbar editor={editor} /> : null}
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
