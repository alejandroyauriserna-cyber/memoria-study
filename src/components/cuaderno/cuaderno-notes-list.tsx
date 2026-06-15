"use client";

import { useState } from "react";
import { Heart, Archive, MoreVertical, Eye } from "lucide-react";
import { getTextPreview } from "@/lib/cuaderno/html-utils";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-notes-list.css";

export function CuadernoNotesList({
  classes,
  onSelectNote,
  isFavorite,
  onToggleFavorite,
}: {
  classes: CuadernoClass[];
  onSelectNote: (classId: string) => void;
  isFavorite: (classId: string) => boolean;
  onToggleFavorite: (classId: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sortedClasses = [...classes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-PE", { month: "short", day: "numeric" });
  };

  const getPreview = (html: string) => {
    return getTextPreview(html, 100);
  };

  return (
    <div className="cn-notes-list">
      {sortedClasses.length === 0 ? (
        <div className="cn-notes-empty">
          <Eye size={48} />
          <h2>No hay notas</h2>
          <p>Crea tu primera nota para comenzar</p>
        </div>
      ) : (
        <div className="cn-notes-list-items">
          {sortedClasses.map((note) => (
            <article
              key={note.id}
              className="cn-note-item"
              onMouseEnter={() => setHoveredId(note.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectNote(note.id)}
            >
              <div className="cn-note-item-content">
                <div className="cn-note-header">
                  <h3 className="cn-note-title">{note.title || "Sin título"}</h3>
                  <time className="cn-note-date">{formatDate(note.updatedAt)}</time>
                </div>

                <p className="cn-note-preview">{getPreview(note.notes)}</p>

                <div className="cn-note-meta">
                  <span className="cn-note-course">{note.courseName}</span>
                  <span className="cn-note-divider">·</span>
                  <span className="cn-note-topic">{note.topic || "General"}</span>
                </div>
              </div>

              {hoveredId === note.id && (
                <div className="cn-note-actions">
                  <button
                    className="cn-note-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(note.id);
                    }}
                    title={isFavorite(note.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <Heart
                      size={18}
                      fill={isFavorite(note.id) ? "currentColor" : "none"}
                      color={isFavorite(note.id) ? "#ff3b30" : "#999"}
                    />
                  </button>
                  <button
                    className="cn-note-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    title="Más opciones"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
