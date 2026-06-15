"use client";

import { useState } from "react";
import { Heart, Clock, Archive, FolderOpen, Plus } from "lucide-react";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-notes-sidebar.css";

type SidebarTab = "recientes" | "favoritos" | "todas" | "carpetas" | "archivadas";

export function CuadernoNotesSidebar({
  classes,
  onCreateNew,
  onSelectClass,
  isFavorite,
}: {
  classes: CuadernoClass[];
  onCreateNew: () => void;
  onSelectClass: (classId: string) => void;
  isFavorite: (classId: string) => boolean;
}) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("recientes");
  const [showFolders, setShowFolders] = useState(false);

  const recentClasses = [...classes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const favoriteClasses = classes.filter((c) => isFavorite(c.id));

  const getCounts = () => ({
    recientes: recentClasses.length,
    favoritos: favoriteClasses.length,
    todas: classes.length,
    archivadas: 0,
  });

  const counts = getCounts();

  return (
    <aside className="cn-notes-sidebar">
      {/* Header con botón crear */}
      <div className="cn-sidebar-header">
        <button className="cn-sidebar-create-btn" onClick={onCreateNew} title="Nueva nota">
          <Plus size={20} />
          <span>Nueva nota</span>
        </button>
      </div>

      {/* Navegación principal */}
      <nav className="cn-sidebar-nav">
        <ul className="cn-sidebar-nav-list">
          <li>
            <button
              className="cn-sidebar-nav-item"
              data-active={activeTab === "recientes"}
              onClick={() => setActiveTab("recientes")}
            >
              <Clock size={18} />
              <span>Recientes</span>
              <span className="cn-nav-badge">{counts.recientes}</span>
            </button>
          </li>
          <li>
            <button
              className="cn-sidebar-nav-item"
              data-active={activeTab === "favoritos"}
              onClick={() => setActiveTab("favoritos")}
            >
              <Heart size={18} />
              <span>Favoritos</span>
              <span className="cn-nav-badge">{counts.favoritos}</span>
            </button>
          </li>
          <li>
            <button
              className="cn-sidebar-nav-item"
              data-active={activeTab === "todas"}
              onClick={() => setActiveTab("todas")}
            >
              <FolderOpen size={18} />
              <span>Todas las notas</span>
              <span className="cn-nav-badge">{counts.todas}</span>
            </button>
          </li>
          <li>
            <button
              className="cn-sidebar-nav-item"
              data-active={activeTab === "archivadas"}
              onClick={() => setActiveTab("archivadas")}
            >
              <Archive size={18} />
              <span>Archivadas</span>
              <span className="cn-nav-badge">0</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Separador */}
      <div className="cn-sidebar-divider" />

      {/* Sección de carpetas */}
      <div className="cn-sidebar-section">
        <button
          className="cn-sidebar-section-header"
          onClick={() => setShowFolders(!showFolders)}
        >
          <span>Carpetas</span>
          <span className="cn-sidebar-toggle">{showFolders ? "−" : "+"}</span>
        </button>
        {showFolders && (
          <ul className="cn-sidebar-folders-list">
            <li>
              <button className="cn-sidebar-folder-item">
                <FolderOpen size={16} />
                <span>Mis cursos</span>
              </button>
            </li>
            <li>
              <button className="cn-sidebar-folder-item">
                <FolderOpen size={16} />
                <span>Apuntes personales</span>
              </button>
            </li>
            <li>
              <button className="cn-sidebar-folder-item">
                <FolderOpen size={16} />
                <span>Tareas</span>
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Footer con info */}
      <div className="cn-sidebar-footer">
        <div className="cn-sidebar-stats">
          <span className="cn-stat-item">
            <strong>{classes.length}</strong> notas
          </span>
          <span className="cn-stat-item">
            <strong>{classes.length * 5}</strong> min lectura
          </span>
        </div>
      </div>
    </aside>
  );
}
