"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Link2 } from "lucide-react";
import { CuadernoBookshelf } from "@/components/cuaderno/cuaderno-bookshelf";
import { CuadernoBookshelfHero } from "@/components/cuaderno/cuaderno-bookshelf-hero";
import { CuadernoNotesSidebar, type SidebarTab } from "@/components/cuaderno/cuaderno-notes-sidebar";
import { CuadernoNotesHeaderPro } from "@/components/cuaderno/cuaderno-notes-header-pro";
import { CuadernoNotesList } from "@/components/cuaderno/cuaderno-notes-list";
import { CuadernoNotesGrid } from "@/components/cuaderno/cuaderno-notes-grid";
import { CuadernoViewSwitcher, type ViewType } from "@/components/cuaderno/cuaderno-view-switcher";
import { CuadernoCreateNoteDialog } from "@/components/cuaderno/cuaderno-create-note-dialog";
import { CuadernoDictionaryTab } from "@/components/cuaderno/cuaderno-dictionary-tab";
import { CuadernoJoinSharedDialog } from "@/components/cuaderno/cuaderno-join-shared-dialog";
import { useCuadernoSyncContext } from "@/components/cuaderno/cuaderno-sync-context";
import { buildInitialNotes } from "@/lib/cuaderno/templates";
import type { CuadernoClass, CuadernoClassAccess } from "@/types/cuaderno";
import "./cuaderno-unified-library.css";
import "./cuaderno-notes-sidebar.css";
import "./cuaderno-notes-list.css";
import "./cuaderno-notes-header-pro.css";
import "./cuaderno-bookshelf.css";

type MainTab = "biblioteca" | "cursos" | "compartidos" | "diccionario";

export function CuadernoUnifiedLibrary({
  initialClasses,
  initialSharedWithMe = [],
  profileName = "Estudiante",
  studyHoursLabel = "—",
}: {
  initialClasses: CuadernoClass[];
  initialSharedWithMe?: CuadernoClassAccess[];
  profileName?: string;
  studyHoursLabel?: string;
}) {
  const router = useRouter();
  const { isFavorite } = useCuadernoSyncContext();

  const [classes] = useState(initialClasses);
  const [sharedWithMe, setSharedWithMe] = useState(initialSharedWithMe);
  const [mainTab, setMainTab] = useState<MainTab>("biblioteca");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("recientes");
  const [viewType, setViewType] = useState<ViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const refreshShared = useCallback(async () => {
    try {
      const res = await fetch("/api/cuaderno/shared");
      const payload = await res.json();
      if (res.ok) setSharedWithMe(payload.sharedWithMe ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (mainTab === "compartidos") void refreshShared();
  }, [mainTab, refreshShared]);

  const mySharedClasses = useMemo(
    () => classes.filter((c) => c.isShared || c.isGroupNotebook),
    [classes],
  );

  const activePool = useMemo(() => {
    if (mainTab === "compartidos") {
      const merged = new Map<string, CuadernoClass>();
      for (const c of mySharedClasses) merged.set(c.id, c);
      for (const a of sharedWithMe) merged.set(a.cuadernoClass.id, a.cuadernoClass);
      return [...merged.values()];
    }
    return classes;
  }, [mainTab, classes, mySharedClasses, sharedWithMe]);

  const filteredClasses = useMemo(() => {
    let result = activePool;

    if (mainTab === "biblioteca") {
      if (sidebarTab === "favoritos") {
        result = result.filter((c) => isFavorite(c.id));
      } else if (sidebarTab === "compartidos") {
        result = [
          ...mySharedClasses,
          ...sharedWithMe.map((a) => a.cuadernoClass),
        ].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q) ||
          c.topic?.toLowerCase().includes(q) ||
          c.courseName.toLowerCase().includes(q),
      );
    }

    return [...result].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [activePool, mainTab, sidebarTab, searchQuery, isFavorite, mySharedClasses, sharedWithMe]);

  async function handleToggleFavorite(classId: string) {
    await fetch("/api/cuaderno/collections/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId }),
    });
  }

  function handleSelectNote(classId: string) {
    router.push(`/cuaderno/${classId}`);
  }

  async function handleCreateNote(input: {
    title: string;
    courseId: string;
    courseName: string;
    cycleNumber: number;
    cycleLabel: string;
    isGroupNotebook: boolean;
  }) {
    const response = await fetch("/api/cuaderno/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: input.courseId,
        courseName: input.courseName,
        cycleNumber: input.cycleNumber,
        cycleLabel: input.cycleLabel,
        title: input.title,
        notes: buildInitialNotes("blank"),
        isGroupNotebook: input.isGroupNotebook,
        sharePermission: input.isGroupNotebook ? "edit" : undefined,
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "No se pudo crear la nota.");
    const created = payload.cuadernoClass as CuadernoClass;
    router.push(`/cuaderno/${created.id}`);
  }

  return (
    <div className="cn-unified-library cuaderno-premium ms-notebook-shell cuaderno-shell cn-bookshelf-page mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      <CuadernoBookshelfHero
        profileName={profileName}
        classes={classes}
        studyHoursLabel={studyHoursLabel}
      />

      <nav className="cn-unified-nav" aria-label="Secciones del cuaderno">
        <button
          type="button"
          className="cn-tab"
          data-active={mainTab === "biblioteca"}
          onClick={() => setMainTab("biblioteca")}
        >
          Todas las hojas
        </button>
        <button
          type="button"
          className="cn-tab"
          data-active={mainTab === "cursos"}
          onClick={() => setMainTab("cursos")}
        >
          Por curso
        </button>
        <button
          type="button"
          className="cn-tab"
          data-active={mainTab === "compartidos"}
          onClick={() => setMainTab("compartidos")}
        >
          Compartidos
          {(sharedWithMe.length > 0 || mySharedClasses.length > 0) && (
            <span className="cn-unified-nav-badge">
              {sharedWithMe.length + mySharedClasses.length}
            </span>
          )}
        </button>
        <button
          type="button"
          className="cn-tab"
          data-active={mainTab === "diccionario"}
          onClick={() => setMainTab("diccionario")}
        >
          Diccionario
        </button>
        <button
          type="button"
          className="cn-unified-join-btn"
          onClick={() => setJoinOpen(true)}
          title="Unirse con enlace"
        >
          <Link2 size={15} />
          Unirse
        </button>
      </nav>

      <AnimatePresence mode="wait">
        {mainTab === "diccionario" ? (
          <motion.div key="dict" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CuadernoDictionaryTab />
          </motion.div>
        ) : mainTab === "cursos" ? (
          <motion.div key="cursos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CuadernoBookshelf classes={classes} />
          </motion.div>
        ) : (
          <motion.div
            key={mainTab}
            className="cn-unified-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {mainTab === "compartidos" && (
              <div className="cn-unified-shared-intro">
                <Users size={20} className="text-[#00FFD5]" />
                <div>
                  <p className="cn-unified-shared-title">Estudia en equipo</p>
                  <p className="cn-unified-shared-desc">
                    Comparte apuntes con un enlace o crea un cuaderno grupal para avanzar juntos en el mismo curso.
                  </p>
                </div>
              </div>
            )}

            <div className="cn-unified-layout">
              <CuadernoNotesSidebar
                classes={mainTab === "compartidos" ? filteredClasses : classes}
                activeTab={sidebarTab}
                onTabChange={setSidebarTab}
                onCreateNew={() => setCreateOpen(true)}
                onSelectClass={handleSelectNote}
                isFavorite={isFavorite}
                sharedCount={sharedWithMe.length + mySharedClasses.length}
                dark
              />

              <div className="cn-unified-main">
                <CuadernoNotesHeaderPro
                  onSearch={setSearchQuery}
                  onFilterToggle={() => {}}
                  studyHours={studyHoursLabel}
                  profileName={profileName}
                  dark
                  stats={{
                    totalNotes: filteredClasses.length,
                    totalPages: filteredClasses.length,
                    studyStreak: 0,
                  }}
                />

                <div className="cn-notes-controls cn-unified-controls">
                  <CuadernoViewSwitcher currentView={viewType} onViewChange={setViewType} dark />
                </div>

                {viewType === "grid" ? (
                  <CuadernoNotesGrid
                    classes={filteredClasses}
                    onSelectNote={handleSelectNote}
                    isFavorite={isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    dark
                  />
                ) : (
                  <CuadernoNotesList
                    classes={filteredClasses}
                    onSelectNote={handleSelectNote}
                    isFavorite={isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    dark
                    sharedWithMe={sharedWithMe}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CuadernoCreateNoteDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateNote={handleCreateNote}
      />

      <CuadernoJoinSharedDialog
        isOpen={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoined={(classId) => {
          setJoinOpen(false);
          void refreshShared();
          router.push(`/cuaderno/${classId}`);
        }}
      />
    </div>
  );
}
