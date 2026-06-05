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
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Pencil,
  Scale,
  Sparkles,
  StickyNote,
  Strikethrough,
  Table,
  Type,
  Underline,
} from "lucide-react";
import { CUADERNO_FONTS, type CuadernoFontId } from "@/lib/cuaderno/editor-fonts";
import { CuadernoToolbarPopover } from "@/components/cuaderno/cuaderno-toolbar-popover";
import { CuadernoTableInsertDialog } from "@/components/cuaderno/cuaderno-table-insert-dialog";
import type { CuadernoWritingMode } from "@/components/cuaderno/cuaderno-canvas-editor";

const TEXT_COLORS = ["#1c1917", "#1e3a5f", "#7f1d1d", "#14532d", "#5b21b6", "#0f766e", "#0d9488"];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px"];

function TbBtn({
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
      className={`cn-float-tb-btn${active ? " is-active" : ""}`}
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function CuadernoFloatingToolbar({
  editor,
  courseAccent = "#14b8a6",
  writingMode,
  onWritingModeChange,
  onToggleAi,
  aiOpen,
  onOpenSideRail,
  onInsertImageFile,
}: {
  editor: Editor | null;
  courseAccent?: string;
  writingMode: CuadernoWritingMode;
  onWritingModeChange: (mode: CuadernoWritingMode) => void;
  onToggleAi: () => void;
  aiOpen: boolean;
  onOpenSideRail: (tab: "stickers" | "postits" | "images") => void;
  onInsertImageFile?: (file: File) => void;
}) {
  const [fontOpen, setFontOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [fontQuery, setFontQuery] = useState("");
  const [fontId, setFontId] = useState<CuadernoFontId | "">("");
  const [fontSize, setFontSize] = useState("");
  const fontRef = useRef<HTMLButtonElement>(null);
  const sizeRef = useRef<HTMLButtonElement>(null);
  const colorRef = useRef<HTMLButtonElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fonts = CUADERNO_FONTS.filter(
    (f) => !fontQuery || f.label.toLowerCase().includes(fontQuery.toLowerCase()),
  );

  const insertImage = (file: File) => {
    onInsertImageFile?.(file);
  };

  const closeAll = () => {
    setFontOpen(false);
    setSizeOpen(false);
    setColorOpen(false);
  };

  return (
    <div
      className="cn-float-toolbar-wrap cn-float-toolbar-wrap--luxury"
      style={{ "--cn-studio-accent": courseAccent } as React.CSSProperties}
      role="toolbar"
      aria-label="Herramientas del cuaderno"
    >
      <div className="cn-float-toolbar">
        <div className="cn-float-tb-group" data-group="mode">
          <TbBtn
            title={writingMode === "ink" ? "Modo texto" : "Lápiz — escritura a mano"}
            active={writingMode === "ink"}
            onClick={() => onWritingModeChange(writingMode === "text" ? "ink" : "text")}
          >
            {writingMode === "ink" ? <Type size={16} /> : <Pencil size={16} />}
          </TbBtn>
        </div>

        {writingMode === "text" && editor ? (
          <>
            <span className="cn-float-tb-sep" aria-hidden />
            <div className="cn-float-tb-group" data-group="text">
              <button
                ref={fontRef}
                type="button"
                className={`cn-float-tb-chip${fontOpen ? " is-open" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setFontOpen((v) => !v);
                  setSizeOpen(false);
                  setColorOpen(false);
                }}
              >
                Aa
              </button>
              <button
                ref={sizeRef}
                type="button"
                className={`cn-float-tb-chip${sizeOpen ? " is-open" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSizeOpen((v) => !v);
                  setFontOpen(false);
                  setColorOpen(false);
                }}
              >
                {fontSize ? fontSize.replace("px", "") : "16"}
              </button>
              <button
                ref={colorRef}
                type="button"
                className={`cn-float-tb-chip cn-float-tb-chip--color${colorOpen ? " is-open" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setColorOpen((v) => !v);
                  setFontOpen(false);
                  setSizeOpen(false);
                }}
              >
                <span className="cn-float-tb-color-dot" />
              </button>
            </div>

            <span className="cn-float-tb-sep" aria-hidden />
            <div className="cn-float-tb-group" data-group="format">
              <TbBtn title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold size={15} />
              </TbBtn>
              <TbBtn title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic size={15} />
              </TbBtn>
              <TbBtn title="Subrayado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                <Underline size={15} />
              </TbBtn>
              <TbBtn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
                <Strikethrough size={15} />
              </TbBtn>
            </div>

            <span className="cn-float-tb-sep" aria-hidden />
            <div className="cn-float-tb-group" data-group="lists">
              <TbBtn title="Viñetas" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List size={15} />
              </TbBtn>
              <TbBtn title="Numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered size={15} />
              </TbBtn>
              <TbBtn title="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
                <CheckSquare size={15} />
              </TbBtn>
            </div>

            <span className="cn-float-tb-sep" aria-hidden />
            <div className="cn-float-tb-group" data-group="content">
              <TbBtn title="Alinear izquierda" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                <AlignLeft size={15} />
              </TbBtn>
              <TbBtn title="Centro" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                <AlignCenter size={15} />
              </TbBtn>
              <TbBtn title="Derecha" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                <AlignRight size={15} />
              </TbBtn>
              <TbBtn title="Justificar" onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
                <AlignJustify size={15} />
              </TbBtn>
              <TbBtn title="Tabla" onClick={() => setTableDialogOpen(true)}>
                <Table size={15} />
              </TbBtn>
              <TbBtn title="Imagen" onClick={() => imageInputRef.current?.click()}>
                <ImageIcon size={15} />
              </TbBtn>
              <TbBtn title="Sticker" onClick={() => onOpenSideRail("stickers")}>
                <span className="cn-float-tb-emoji">🎀</span>
              </TbBtn>
              <TbBtn title="Post-it" onClick={() => onOpenSideRail("postits")}>
                <StickyNote size={15} />
              </TbBtn>
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
          </>
        ) : null}

        <span className="cn-float-tb-sep" aria-hidden />
        <div className="cn-float-tb-group" data-group="ai">
          <TbBtn title="Jurídico" onClick={() => onToggleAi()}>
            <Scale size={15} />
          </TbBtn>
          <button
            type="button"
            className={`cn-float-tb-ai${aiOpen ? " is-open" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleAi}
          >
            <Sparkles size={14} />
            IA
          </button>
        </div>
      </div>

      <CuadernoToolbarPopover
        open={fontOpen && !!editor}
        onClose={() => setFontOpen(false)}
        anchorRef={fontRef}
        title="Fuente"
        searchable
        searchPlaceholder="Buscar fuente…"
        searchValue={fontQuery}
        onSearch={setFontQuery}
      >
        {fonts.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`cn-tb-popover-item${fontId === f.id ? " is-active" : ""}`}
            style={{ fontFamily: f.stack }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (!editor) return;
              setFontId(f.id);
              editor.chain().focus().setFontFamily(f.stack).run();
              closeAll();
            }}
          >
            <span className="cn-tb-popover-preview">Aa</span>
            {f.label}
          </button>
        ))}
      </CuadernoToolbarPopover>

      <CuadernoToolbarPopover
        open={sizeOpen && !!editor}
        onClose={() => setSizeOpen(false)}
        anchorRef={sizeRef}
        title="Tamaño"
        width={160}
      >
        {FONT_SIZES.map((s) => (
          <button
            key={s}
            type="button"
            className={`cn-tb-popover-item${fontSize === s ? " is-active" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (!editor) return;
              setFontSize(s);
              editor.chain().focus().setFontSize(s).run();
              closeAll();
            }}
          >
            <span className="cn-tb-popover-preview" style={{ fontSize: s }}>
              A
            </span>
            {s.replace("px", "")} pt
          </button>
        ))}
      </CuadernoToolbarPopover>

      <CuadernoToolbarPopover
        open={colorOpen && !!editor}
        onClose={() => setColorOpen(false)}
        anchorRef={colorRef}
        title="Color"
        width={200}
      >
        <div className="cn-tb-popover-swatches">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="cn-tb-popover-swatch"
              style={{ background: c }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor?.chain().focus().setColor(c).run();
                closeAll();
              }}
            />
          ))}
        </div>
      </CuadernoToolbarPopover>

      <CuadernoTableInsertDialog
        open={tableDialogOpen}
        onClose={() => setTableDialogOpen(false)}
        editor={editor}
      />
    </div>
  );
}
