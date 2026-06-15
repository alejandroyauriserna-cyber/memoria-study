"use client";

import { useState, useMemo } from "react";
import { CuadernoNotesSidebar } from "@/components/cuaderno/cuaderno-notes-sidebar";
import { CuadernoNotesHeaderPro } from "@/components/cuaderno/cuaderno-notes-header-pro";
import { CuadernoNotesList } from "@/components/cuaderno/cuaderno-notes-list";
import { CuadernoNotesGrid } from "@/components/cuaderno/cuaderno-notes-grid";
import { CuadernoViewSwitcher, type ViewType } from "@/components/cuaderno/cuaderno-view-switcher";
import { CuadernoNewNoteDialog } from "@/components/cuaderno/cuaderno-new-note-dialog";
import { CuadernoNoteEditor } from "@/components/cuaderno/cuaderno-note-editor";
import { CuadernoNoteEditorPro } from "@/components/cuaderno/cuaderno-note-editor-pro";
import { CuadernoSyncProvider, useCuadernoSyncContext } from "@/components/cuaderno/cuaderno-sync-context";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-apple-notes-layout.css";

type ViewMode = "recientes" | "favoritos" | "todas" | "carpetas" | "archivadas";

function CuadernoAppleNotesLayoutInner({
  initialClasses,
  profileName = "Estudiante",
  studyHoursLabel = "—",
}: {
  initialClasses: CuadernoClass[];
  profileName?: string;
  studyHoursLabel?: string;
}) {
  const { isFavorite } = useCuadernoSyncContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("recientes");
  const [viewType, setViewType] = useState<ViewType>("list");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<CuadernoClass | null>(null);

  // Filtrar notas basado en búsqueda
  const filteredClasses = useMemo(() => {
    let result = initialClasses;

    // Filtrar por vista
    if (viewMode === "favoritos") {
      result = result.filter((c) => isFavorite(c.id));
    } else if (viewMode === "archivadas") {
      // Placeholder para notas archivadas (requiere field en BD)
      result = [];
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.notes.toLowerCase().includes(query) ||
          c.topic?.toLowerCase().includes(query) ||
          c.courseName.toLowerCase().includes(query),
      );
    }

    // Ordenar por fecha reciente
    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [initialClasses, viewMode, searchQuery, isFavorite]);

  const handleCreateNew = () => {
    setIsNewNoteDialogOpen(true);
  };

  const handleCreateNewNote = async (title: string, courseName: string) => {
    // TODO: Llamar API para crear la nota
    console.log("Crear nota:", { title, courseName });
    // Simulación: simplemente cierra el diálogo
    setIsNewNoteDialogOpen(false);
  };

  const handleSelectNote = (classId: string) => {
    const note = initialClasses.find((c) => c.id === classId);
    if (note) {
      setSelectedNoteId(classId);
      setSelectedNote(note);
    }
  };

  const handleToggleFavorite = (classId: string) => {
    // Toggle local favorito (integración con BD pendiente)
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  return (
    <div className="cn-apple-notes-layout">
      {/* Sidebar */}
      <CuadernoNotesSidebar
        classes={initialClasses}
        onCreateNew={handleCreateNew}
        onSelectClass={handleSelectNote}
        isFavorite={isFavorite}
      />

      {/* Main content */}
      <div className="cn-apple-notes-main">
        {/* Header profesional */}
        <CuadernoNotesHeaderPro
          onSearch={setSearchQuery}
          onFilterToggle={() => {}}
          studyHours={studyHoursLabel}
          profileName={profileName}
          stats={{
            totalNotes: filteredClasses.length,
            totalPages: initialClasses.reduce((sum, c) => {
              const lines = c.notes.split("\n").length;
              return sum + Math.ceil(lines / 50);
            }, 0),
            studyStreak: 7,
          }}
        />

        {/* Vista selector y espacio vacío */}
        <div className="cn-notes-controls">
          <CuadernoViewSwitcher currentView={viewType} onViewChange={setViewType} />
        </div>

        {/* Contenido dinámico según vista */}
        {viewType === "list" ? (
          <CuadernoNotesList
            classes={filteredClasses}
            onSelectNote={handleSelectNote}
            isFavorite={(id) => isFavorite(id) || favoriteIds.has(id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : viewType === "grid" ? (
          <CuadernoNotesGrid
            classes={filteredClasses}
            onSelectNote={handleSelectNote}
            isFavorite={(id) => isFavorite(id) || favoriteIds.has(id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <div className="cn-notes-timeline">
            <p style={{ padding: "24px", textAlign: "center", color: "#999" }}>
              Vista Timeline - Próximamente
            </p>
          </div>
        )}

        {/* Modal para crear nueva nota */}
        <CuadernoNewNoteDialog
          isOpen={isNewNoteDialogOpen}
          onClose={() => setIsNewNoteDialogOpen(false)}
          onCreateNote={handleCreateNewNote}
        />

        {/* Editor de nota */}
        {selectedNote && (
          <CuadernoNoteEditorPro
            note={selectedNote}
            isOpen={selectedNoteId !== null}
            onClose={() => {
              setSelectedNoteId(null);
              setSelectedNote(null);
            }}
            onSave={async (content) => {
              // TODO: Llamar API para guardar la nota
              console.log("Guardar nota:", { id: selectedNoteId, content });
            }}
          />
        )}
      </div>
    </div>
  );
}

export function CuadernoAppleNotesLayout({
  initialClasses,
  profileName = "Estudiante",
  studyHoursLabel = "—",
}: {
  initialClasses: CuadernoClass[];
  profileName?: string;
  studyHoursLabel?: string;
}) {
  return (
    <CuadernoSyncProvider>
      <CuadernoAppleNotesLayoutInner
        initialClasses={initialClasses}
        profileName={profileName}
        studyHoursLabel={studyHoursLabel}
      />
    </CuadernoSyncProvider>
  );
}
