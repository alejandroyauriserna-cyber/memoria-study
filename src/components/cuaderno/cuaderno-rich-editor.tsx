"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { bodyToEditorHtml } from "@/lib/cuaderno/rich-text";
import { getFontStack, getGoogleFontsHref, DEFAULT_FONT_ID } from "@/lib/cuaderno/editor-fonts";
import { createCuadernoEditorExtensions } from "@/lib/cuaderno/cuaderno-editor-extensions";
import { CuadernoFormatBubble } from "@/components/cuaderno/cuaderno-format-bubble";
import { CuadernoBlockHandles, useBlockClickSelect } from "@/components/cuaderno/cuaderno-block-handles";
import { CuadernoTableChrome } from "@/components/cuaderno/blocks/cuaderno-table-chrome";
import type { CuadernoAskAction } from "@/types/cuaderno";
import { isDecorationDragTransfer, parseDecorationDrag } from "@/lib/cuaderno/decoration-drag";
import "./cuaderno-rich-editor.css";
import "./cuaderno-blocks.css";

function normalizeHtml(html: string): string {
  return html.replace(/\s+/g, " ").trim();
}

function CuadernoRichEditorInner({
  body,
  onBodyChange,
  onEditorReady,
  placeholder,
  editable = true,
  courseAccent = "#0d9488",
  className = "",
  immersiveEdit = false,
  writingLayout = "word",
  activePageId,
  lineHeight = "1.78",
  onOpenFormatPanel,
  onSelectionAction,
  onClipboardImagePaste,
}: {
  body: string;
  onBodyChange: (html: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
  placeholder?: string;
  editable?: boolean;
  courseAccent?: string;
  className?: string;
  immersiveEdit?: boolean;
  writingLayout?: import("@/lib/cuaderno/page-settings").CuadernoWritingLayout;
  activePageId?: string;
  lineHeight?: string;
  onOpenFormatPanel?: () => void;
  onSelectionAction?: (
    action: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence" | "simplify",
    selectedText: string,
  ) => void;
  /** Si devuelve true, el editor no inserta texto (p. ej. URL de Pinterest → imagen flotante). */
  onClipboardImagePaste?: (event: ClipboardEvent) => boolean;
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

  const debouncedEmit = useDebouncedCallback(emitChange, 400);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: createCuadernoEditorExtensions(placeholder?.trim() || undefined),
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
        dragover: (_view, event) => {
          const dt = event.dataTransfer;
          if (!dt || !isDecorationDragTransfer(dt)) return false;
          event.preventDefault();
          return true;
        },
      },
      handleDrop: (_view, event) => {
        const dt = event.dataTransfer;
        if (!dt) return false;
        if (isDecorationDragTransfer(dt) || parseDecorationDrag(dt)) {
          event.preventDefault();
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        if (!onClipboardImagePaste) return false;
        return onClipboardImagePaste(event);
      },
    },
    onUpdate: ({ editor: ed }) => {
      debouncedEmit(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const flush = () => debouncedEmit.flush();
    editor.view.dom.addEventListener("blur", flush, true);
    return () => editor.view.dom.removeEventListener("blur", flush, true);
  }, [editor, debouncedEmit]);

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

  useEffect(() => {
    if (!editor || !editable || writingLayout !== "word") return;
    if (!editor.isEmpty) return;
    requestAnimationFrame(() => {
      editor.commands.focus("start");
    });
  }, [editor, editable, writingLayout, activePageId]);

  if (!editor) {
    return <div className={`cn-rich-editor-skeleton ${className}`} aria-hidden />;
  }

  return (
    <div
      className={`cn-rich-editor ${className}${immersiveEdit ? " cn-rich-editor--immersive" : ""}`}
      data-editable={editable ? "true" : "false"}
      data-writing-layout={writingLayout}
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
          <CuadernoFormatBubble
            editor={editor}
            courseAccent={courseAccent}
            onAiAction={onSelectionAction}
            variant={immersiveEdit ? "immersive" : "default"}
          />
          <CuadernoBlockHandles editor={editor} />
          <CuadernoTableChrome editor={editor} />
        </>
      ) : null}
    </div>
  );
}

export const CuadernoRichEditor = memo(CuadernoRichEditorInner);
