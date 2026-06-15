"use client";

import { useState } from "react";
import { X } from "lucide-react";
import "./cuaderno-new-note-dialog.css";

export function CuadernoNewNoteDialog({
  isOpen,
  onClose,
  onCreateNote,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateNote: (title: string, courseName: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [courseName, setCourseName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateNote(title, courseName);
      setTitle("");
      setCourseName("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cn-new-note-overlay" onClick={onClose}>
      <div className="cn-new-note-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cn-new-note-header">
          <h2>Nueva nota</h2>
          <button
            className="cn-new-note-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cn-new-note-form">
          <div className="cn-form-group">
            <label htmlFor="note-title">Título (requerido)</label>
            <input
              id="note-title"
              type="text"
              placeholder="Ej: Apuntes de Derecho Civil"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              className="cn-form-input"
            />
          </div>

          <div className="cn-form-group">
            <label htmlFor="note-course">Curso (opcional)</label>
            <input
              id="note-course"
              type="text"
              placeholder="Ej: Derecho Civil I"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              disabled={isSubmitting}
              className="cn-form-input"
            />
          </div>

          <div className="cn-new-note-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cn-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="cn-btn-primary"
            >
              {isSubmitting ? "Creando..." : "Crear nota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
