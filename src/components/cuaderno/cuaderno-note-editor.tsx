"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Save,
  Share2,
  MoreVertical,
  Grid3x3,
  Minus,
  Square,
  FileText,
  Type,
  Bold,
  Italic,
  List,
  CheckSquare,
  Link2,
  Trash2,
  Share,
  Copy,
} from "lucide-react";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-note-editor.css";

type PaperType = "lined" | "grid" | "blank" | "dotted";
type TextFormat = "normal" | "title" | "heading" | "code";

interface CuadernoNoteEditorProps {
  note: CuadernoClass;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (content: string, paperType: PaperType) => Promise<void>;
}

export function CuadernoNoteEditor({
  note,
  isOpen,
  onClose,
  onSave,
}: CuadernoNoteEditorProps) {
  const [content, setContent] = useState(note.notes);
  const [paperType, setPaperType] = useState<PaperType>("lined");
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(note.notes);
  }, [note.notes]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(content, paperType);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const insertFormat = (before: string, after: string = "") => {
    const textarea = editorRef.current?.querySelector(
      ".cne-editor-textarea",
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);
    setContent(newContent);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="cne-editor-overlay">
      <div className="cne-editor-container">
        {/* Header */}
        <div className="cne-editor-header">
          <div className="cne-editor-header-left">
            <button
              className="cne-editor-close-btn"
              onClick={onClose}
              aria-label="Cerrar editor"
            >
              <X size={24} />
            </button>
            <div className="cne-editor-title-info">
              <h2 className="cne-editor-title">{note.title}</h2>
              <p className="cne-editor-course">{note.courseName}</p>
            </div>
          </div>
          <div className="cne-editor-header-right">
            <button className="cne-editor-share-btn" aria-label="Compartir">
              <Share2 size={20} />
            </button>
            <button className="cne-editor-more-btn" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Menu desplegable */}
        {showMenu && (
          <div className="cne-editor-menu">
            <button className="cne-menu-item">
              <Copy size={18} /> Copiar
            </button>
            <button className="cne-menu-item" onClick={handleCopy}>
              <Copy size={18} /> Copiar Todo
            </button>
            <button className="cne-menu-item">
              <Share size={18} /> Exportar PDF
            </button>
            <button className="cne-menu-item cne-menu-danger">
              <Trash2 size={18} /> Eliminar
            </button>
          </div>
        )}

        <div className="cne-editor-body">
          {/* Sidebar lateral - Tipos de papel */}
          <div className="cne-editor-sidebar">
            <div className="cne-sidebar-section">
              <h3 className="cne-sidebar-title">Tipo de Hoja</h3>
              <div className="cne-paper-types">
                <button
                  className={`cne-paper-btn ${paperType === "lined" ? "active" : ""}`}
                  onClick={() => setPaperType("lined")}
                  title="Hoja rayada"
                >
                  <Minus size={18} />
                  <span>Rayada</span>
                </button>
                <button
                  className={`cne-paper-btn ${paperType === "grid" ? "active" : ""}`}
                  onClick={() => setPaperType("grid")}
                  title="Hoja con cuadrícula"
                >
                  <Grid3x3 size={18} />
                  <span>Cuadrícula</span>
                </button>
                <button
                  className={`cne-paper-btn ${paperType === "dotted" ? "active" : ""}`}
                  onClick={() => setPaperType("dotted")}
                  title="Hoja punteada"
                >
                  <Square size={14} />
                  <span>Punteada</span>
                </button>
                <button
                  className={`cne-paper-btn ${paperType === "blank" ? "active" : ""}`}
                  onClick={() => setPaperType("blank")}
                  title="Hoja en blanco"
                >
                  <FileText size={18} />
                  <span>Blanca</span>
                </button>
              </div>
            </div>

            {/* Herramientas de formato */}
            <div className="cne-sidebar-section">
              <h3 className="cne-sidebar-title">Formato</h3>
              <div className="cne-format-tools">
                <button
                  className="cne-tool-btn"
                  onClick={() => insertFormat("**", "**")}
                  title="Negrita"
                >
                  <Bold size={18} />
                </button>
                <button
                  className="cne-tool-btn"
                  onClick={() => insertFormat("_", "_")}
                  title="Cursiva"
                >
                  <Italic size={18} />
                </button>
                <button
                  className="cne-tool-btn"
                  onClick={() => insertFormat("# ")}
                  title="Encabezado"
                >
                  <Type size={18} />
                </button>
                <button
                  className="cne-tool-btn"
                  onClick={() => insertFormat("\n- ")}
                  title="Lista"
                >
                  <List size={18} />
                </button>
                <button
                  className="cne-tool-btn"
                  onClick={() => insertFormat("- [ ] ")}
                  title="Checklist"
                >
                  <CheckSquare size={18} />
                </button>
                <button
                  className="cne-tool-btn"
                  onClick={() => insertFormat("[", "](url)")}
                  title="Enlace"
                >
                  <Link2 size={18} />
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="cne-sidebar-section">
              <h3 className="cne-sidebar-title">Estadísticas</h3>
              <div className="cne-stats">
                <div className="cne-stat">
                  <span className="cne-stat-label">Palabras</span>
                  <span className="cne-stat-value">
                    {content.split(/\s+/).filter((w) => w).length}
                  </span>
                </div>
                <div className="cne-stat">
                  <span className="cne-stat-label">Caracteres</span>
                  <span className="cne-stat-value">{content.length}</span>
                </div>
                <div className="cne-stat">
                  <span className="cne-stat-label">Líneas</span>
                  <span className="cne-stat-value">{content.split("\n").length}</span>
                </div>
              </div>
            </div>

            {/* Fecha */}
            <div className="cne-sidebar-section">
              <p className="cne-last-edited">
                Última edición:{" "}
                {new Date(note.updatedAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Editor principal */}
          <div className={`cne-editor-main cne-paper-${paperType}`}>
            <textarea
              ref={editorRef}
              className="cne-editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comienza a escribir tus notas aquí..."
            />
          </div>
        </div>

        {/* Footer con botones de acción */}
        <div className="cne-editor-footer">
          <button className="cne-footer-btn cne-footer-cancel" onClick={onClose}>
            Cancelar
          </button>
          <div className="cne-footer-right">
            <p className="cne-footer-info">
              {content.length > 0 ? "Hay cambios sin guardar" : "Sin cambios"}
            </p>
            <button
              className="cne-footer-btn cne-footer-save"
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
