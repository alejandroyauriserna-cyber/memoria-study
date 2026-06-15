"use client";

import { useState } from "react";
import { Heart, MoreVertical, Eye, Users } from "lucide-react";
import { getTextPreview } from "@/lib/cuaderno/html-utils";
import type { CuadernoClass, CuadernoClassAccess } from "@/types/cuaderno";
import "./cuaderno-notes-list.css";

export function CuadernoNotesList({
  classes,
  onSelectNote,
  isFavorite,
  onToggleFavorite,
  dark = false,
  sharedWithMe = [],
}: {
  classes: CuadernoClass[];
  onSelectNote: (classId: string) => void;
  isFavorite: (classId: string) => boolean;
  onToggleFavorite: (classId: string) => void;
  dark?: boolean;
  sharedWithMe?: CuadernoClassAccess[];
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

  const ownerByClass = new Map(
    sharedWithMe.map((a) => [a.cuadernoClass.id, a.ownerName]),
  );

  const listClass = dark ? "cn-notes-list cn-notes-list--dark" : "cn-notes-list";

  return (
    <div className={listClass}>
      {sortedClasses.length === 0 ? (
        <div className="cn-notes-empty">
          <Eye size={48} />
          <h2>No hay hojas</h2>
          <p>Crea tu primera hoja o únete a un cuaderno compartido</p>
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
                  <h3 className="cn-note-title">
                    {note.title || "Sin título"}
                    {(note.isGroupNotebook || note.isShared) && (
                      <span className="cn-note-shared-badge">
                        <Users size={10} />
                        {note.isGroupNotebook ? "Grupal" : "Compartido"}
                      </span>
                    )}
                  </h3>
                  <time className="cn-note-date">{formatDate(note.updatedAt)}</time>
                </div>

                <p className="cn-note-preview">{getPreview(note.notes)}</p>

                <div className="cn-note-meta">
                  <span className="cn-note-course">{note.courseName}</span>
                  <span className="cn-note-divider">·</span>
                  <span className="cn-note-topic">{note.topic || "General"}</span>
                  {ownerByClass.get(note.id) && (
                    <>
                      <span className="cn-note-divider">·</span>
                      <span>de {ownerByClass.get(note.id)}</span>
                    </>
                  )}
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
