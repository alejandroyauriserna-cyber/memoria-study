"use client";

import { useMemo, useState } from "react";
import { X, Users } from "lucide-react";
import { flattenCuadernoCourses } from "@/lib/cuaderno/cuaderno-tree";
import "./cuaderno-new-note-dialog.css";

export function CuadernoCreateNoteDialog({
  isOpen,
  onClose,
  onCreateNote,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateNote: (input: {
    title: string;
    courseId: string;
    courseName: string;
    cycleNumber: number;
    cycleLabel: string;
    isGroupNotebook: boolean;
  }) => Promise<void>;
}) {
  const courses = useMemo(() => flattenCuadernoCourses(), []);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.courseId ?? "");
  const [isGroupNotebook, setIsGroupNotebook] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.courseId === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedCourse) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateNote({
        title: title.trim(),
        courseId: selectedCourse.courseId,
        courseName: selectedCourse.courseName,
        cycleNumber: selectedCourse.cycleNumber,
        cycleLabel: selectedCourse.cycleLabel,
        isGroupNotebook,
      });
      setTitle("");
      setIsGroupNotebook(false);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al crear.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cn-new-note-overlay" onClick={onClose}>
      <div className="cn-new-note-dialog cn-new-note-dialog--dark" onClick={(e) => e.stopPropagation()}>
        <div className="cn-new-note-header">
          <h2>Nueva hoja</h2>
          <button className="cn-new-note-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cn-new-note-form">
          <div className="cn-form-group">
            <label htmlFor="note-title">Título</label>
            <input
              id="note-title"
              type="text"
              placeholder="Ej: Clase 05 — Obligaciones"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              className="cn-form-input"
            />
          </div>

          <div className="cn-form-group">
            <label htmlFor="note-course">Curso UNT</label>
            <select
              id="note-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={isSubmitting}
              className="cn-form-input"
            >
              {courses.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.courseName} — {c.cycleLabel}
                </option>
              ))}
            </select>
          </div>

          <label className="cn-group-notebook-option">
            <input
              type="checkbox"
              checked={isGroupNotebook}
              onChange={(e) => setIsGroupNotebook(e.target.checked)}
              disabled={isSubmitting}
            />
            <Users size={16} />
            <span>
              <strong>Cuaderno grupal</strong>
              <small>Genera enlace para que tus compañeros editen y avancen contigo</small>
            </span>
          </label>

          {error && <p className="cn-form-error">{error}</p>}

          <div className="cn-new-note-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="cn-btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={!title.trim() || !selectedCourse || isSubmitting} className="cn-btn-primary">
              {isSubmitting ? "Creando..." : "Crear y abrir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
