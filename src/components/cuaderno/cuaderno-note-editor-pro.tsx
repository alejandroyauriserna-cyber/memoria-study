"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Save,
  Share2,
  MoreVertical,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Type,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Code,
  Link2,
  Image,
  Table,
  Trash2,
  Share,
  Copy,
  Download,
  Palette,
  Minus,
  ChevronDown,
} from "lucide-react";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-note-editor-pro.css";

type PaperType = "lined" | "grid" | "blank" | "dotted";

interface CuadernoNoteEditorProProps {
  note: CuadernoClass;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (content: string, paperType: PaperType) => Promise<void>;
}

export function CuadernoNoteEditorPro({
  note,
  isOpen,
  onClose,
  onSave,
}: CuadernoNoteEditorProProps) {
  const [content, setContent] = useState(note.notes);
  const [paperType, setPaperType] = useState<PaperType>("blank");
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentBgColor, setCurrentBgColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(14);
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(note.notes);
    if (contentRef.current) {
      contentRef.current.innerHTML = note.notes;
    }
  }, [note.notes]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
    try {
      if (onSave) {
        await onSave(contentRef.current?.innerHTML || content, paperType);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const insertElement = (tag: string) => {
    if (tag === "table") {
      const table = document.createElement("table");
      table.innerHTML = `
        <tr><td>Celda 1</td><td>Celda 2</td></tr>
        <tr><td>Celda 3</td><td>Celda 4</td></tr>
      `;
      table.className = "editor-table";
      contentRef.current?.appendChild(table);
    } else if (tag === "image") {
      const url = prompt("Ingresa URL de imagen:");
      if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.className = "editor-image";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        contentRef.current?.appendChild(img);
      }
    } else if (tag === "link") {
      const url = prompt("Ingresa URL:");
      if (url) {
        execCommand("createLink", url);
      }
    }
    contentRef.current?.focus();
  };

  const insertTable = () => {
    const rows = prompt("Número de filas:", "3");
    const cols = prompt("Número de columnas:", "3");
    if (rows && cols) {
      let table = "<table class='editor-table'><tbody>";
      for (let i = 0; i < parseInt(rows); i++) {
        table += "<tr>";
        for (let j = 0; j < parseInt(cols); j++) {
          table += "<td>Celda</td>";
        }
        table += "</tr>";
      }
      table += "</tbody></table>";
      execCommand("insertHTML", table);
    }
  };

  const wordCount = contentRef.current?.innerText?.split(/\s+/).filter((w) => w).length || 0;
  const charCount = contentRef.current?.innerText?.length || 0;

  const colorOptions = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

  return (
    <div className="cnep-editor-overlay">
      <div className="cnep-editor-container">
        {/* Header */}
        <div className="cnep-editor-header">
          <div className="cnep-editor-header-left">
            <button
              className="cnep-editor-close-btn"
              onClick={onClose}
              aria-label="Cerrar editor"
            >
              <X size={24} />
            </button>
            <div className="cnep-editor-title-info">
              <h2 className="cnep-editor-title">{note.title}</h2>
              <p className="cnep-editor-course">{note.courseName}</p>
            </div>
          </div>
          <div className="cnep-editor-header-right">
            <button className="cnep-editor-share-btn" aria-label="Compartir">
              <Share2 size={20} />
            </button>
            <button className="cnep-editor-more-btn" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Menu desplegable */}
        {showMenu && (
          <div className="cnep-editor-menu">
            <button className="cnep-menu-item">
              <Copy size={18} /> Copiar
            </button>
            <button className="cnep-menu-item">
              <Download size={18} /> Descargar PDF
            </button>
            <button className="cnep-menu-item">
              <Share size={18} /> Compartir
            </button>
            <button className="cnep-menu-item cnep-menu-danger">
              <Trash2 size={18} /> Eliminar
            </button>
          </div>
        )}

        {/* Toolbar - Fila 1 */}
        <div className="cnep-toolbar">
          <div className="cnep-toolbar-row">
            {/* Formateo básico */}
            <div className="cnep-toolbar-group">
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("bold")}
                title="Negrita (Ctrl+B)"
              >
                <Bold size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("italic")}
                title="Cursiva (Ctrl+I)"
              >
                <Italic size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("underline")}
                title="Subrayado (Ctrl+U)"
              >
                <Underline size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("strikeThrough")}
                title="Tachado"
              >
                <Strikethrough size={18} />
              </button>
            </div>

            {/* Colores */}
            <div className="cnep-toolbar-group">
              <div className="cnep-color-picker-wrapper">
                <button
                  className="cnep-tool-btn cnep-color-btn"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  style={{
                    borderBottom: `3px solid ${currentColor}`,
                  }}
                  title="Color de texto"
                >
                  <Palette size={18} />
                  <ChevronDown size={14} />
                </button>
                {showColorPicker && (
                  <div className="cnep-color-palette">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        className="cnep-color-option"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setCurrentColor(color);
                          execCommand("foreColor", color);
                          setShowColorPicker(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Alineación */}
            <div className="cnep-toolbar-group">
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("justifyLeft")}
                title="Alinear izquierda"
              >
                <AlignLeft size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("justifyCenter")}
                title="Alinear centro"
              >
                <AlignCenter size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("justifyRight")}
                title="Alinear derecha"
              >
                <AlignRight size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("justifyFull")}
                title="Justificar"
              >
                <AlignJustify size={18} />
              </button>
            </div>

            {/* Tamaño de fuente */}
            <div className="cnep-toolbar-group">
              <select
                className="cnep-select"
                value={fontSize}
                onChange={(e) => {
                  setFontSize(parseInt(e.target.value));
                  execCommand("fontSize", "7");
                  document.querySelectorAll("font[size='7']").forEach((el) => {
                    (el as HTMLElement).style.fontSize = e.target.value + "px";
                  });
                }}
              >
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="28">28px</option>
                <option value="32">32px</option>
              </select>
            </div>
          </div>

          {/* Toolbar - Fila 2 */}
          <div className="cnep-toolbar-row">
            {/* Listas */}
            <div className="cnep-toolbar-group">
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("insertUnorderedList")}
                title="Lista con viñetas"
              >
                <List size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("insertOrderedList")}
                title="Lista numerada"
              >
                <ListOrdered size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("indent")}
                title="Aumentar sangría"
              >
                <Indent size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("outdent")}
                title="Disminuir sangría"
              >
                <Outdent size={18} />
              </button>
            </div>

            {/* Insertar elementos */}
            <div className="cnep-toolbar-group">
              <button
                className="cnep-tool-btn"
                onClick={() => insertElement("link")}
                title="Insertar enlace"
              >
                <Link2 size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => insertElement("image")}
                title="Insertar imagen"
              >
                <Image size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={insertTable}
                title="Insertar tabla"
              >
                <Table size={18} />
              </button>
              <button
                className="cnep-tool-btn"
                onClick={() => execCommand("formatBlock", "<code>")}
                title="Bloque de código"
              >
                <Code size={18} />
              </button>
            </div>

            {/* Tipo de papel */}
            <div className="cnep-toolbar-group">
              <select
                className="cnep-select cnep-paper-select"
                value={paperType}
                onChange={(e) => setPaperType(e.target.value as PaperType)}
              >
                <option value="blank">Blanca</option>
                <option value="lined">Rayada</option>
                <option value="grid">Cuadrícula</option>
                <option value="dotted">Punteada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Editor principal */}
        <div className={`cnep-editor-main cnep-paper-${paperType}`}>
          <div
            ref={contentRef}
            className="cnep-editor-content"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
          />
        </div>

        {/* Sidebar con estadísticas */}
        <div className="cnep-editor-sidebar">
          <div className="cnep-sidebar-stats">
            <div className="cnep-stat-item">
              <span className="cnep-stat-label">Palabras</span>
              <span className="cnep-stat-value">{wordCount}</span>
            </div>
            <div className="cnep-stat-item">
              <span className="cnep-stat-label">Caracteres</span>
              <span className="cnep-stat-value">{charCount}</span>
            </div>
          </div>
          <p className="cnep-last-edit">
            Última edición:{" "}
            {new Date(note.updatedAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Footer */}
        <div className="cnep-editor-footer">
          <button className="cnep-footer-btn cnep-footer-cancel" onClick={onClose}>
            Cancelar
          </button>
          <div className="cnep-footer-right">
            <p className="cnep-footer-info">
              {content.length > 0 ? "Hay cambios sin guardar" : "Sin cambios"}
            </p>
            <button
              className="cnep-footer-btn cnep-footer-save"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={18} />
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
