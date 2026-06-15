"use client";

import { Heart, MoreVertical } from "lucide-react";
import { getTextPreview } from "@/lib/cuaderno/html-utils";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-notes-grid.css";

export function CuadernoNotesGrid({
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
  return (
    <div className="cn-notes-grid-container">
      {classes.length === 0 ? (
        <div className="cn-grid-empty">
          <p>No hay notas para mostrar</p>
        </div>
      ) : (
        <div className="cn-notes-grid">
          {classes.map((note) => (
            <article
              key={note.id}
              className="cn-grid-card"
              onClick={() => onSelectNote(note.id)}
            >
              <div className="cn-grid-card-header">
                <h3 className="cn-grid-card-title">{note.title || "Sin título"}</h3>
                <button
                  className="cn-grid-card-menu"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              <p className="cn-grid-card-preview">{getTextPreview(note.notes, 60)}</p>

              <div className="cn-grid-card-footer">
                <span className="cn-grid-course">{note.courseName}</span>
                <button
                  className="cn-grid-favorite-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(note.id);
                  }}
                >
                  <Heart
                    size={16}
                    fill={isFavorite(note.id) ? "currentColor" : "none"}
                    color={isFavorite(note.id) ? "#ff3b30" : "currentColor"}
                  />
                </button>
              </div>

              {/* Colores de acento por curso */}
              <div className="cn-grid-accent" />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
