"use client";

import { useState } from "react";
import { Clock, Heart, FolderOpen, Users, Plus } from "lucide-react";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-notes-sidebar.css";

export type SidebarTab = "recientes" | "favoritos" | "todas" | "compartidos" | "archivadas";

export function CuadernoNotesSidebar({
  classes,
  activeTab,
  onTabChange,
  onCreateNew,
  onSelectClass,
  isFavorite,
  sharedCount = 0,
  dark = false,
}: {
  classes: CuadernoClass[];
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onCreateNew: () => void;
  onSelectClass: (classId: string) => void;
  isFavorite: (classId: string) => boolean;
  sharedCount?: number;
  dark?: boolean;
}) {
  const recentClasses = [...classes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const favoriteClasses = classes.filter((c) => isFavorite(c.id));

  const counts = {
    recientes: recentClasses.length,
    favoritos: favoriteClasses.length,
    todas: classes.length,
    compartidos: sharedCount,
    archivadas: 0,
  };

  const sidebarClass = dark ? "cn-notes-sidebar cn-notes-sidebar--dark" : "cn-notes-sidebar";

  return (
    <aside className={sidebarClass}>
      <div className="cn-sidebar-header">
        <button className="cn-sidebar-create-btn" onClick={onCreateNew} title="Nueva hoja">
          <Plus size={20} />
          <span>Nueva hoja</span>
        </button>
      </div>

      <nav className="cn-sidebar-nav">
        <ul className="cn-sidebar-nav-list">
          <li>
            <button
              className="cn-sidebar-nav-item"
              data-active={activeTab === "recientes"}
              onClick={() => onTabChange("recientes")}
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
              onClick={() => onTabChange("favoritos")}
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
              onClick={() => onTabChange("todas")}
            >
              <FolderOpen size={18} />
              <span>Todas</span>
              <span className="cn-nav-badge">{counts.todas}</span>
            </button>
          </li>
          <li>
            <button
              className="cn-sidebar-nav-item"
              data-active={activeTab === "compartidos"}
              onClick={() => onTabChange("compartidos")}
            >
              <Users size={18} />
              <span>Compartidos</span>
              <span className="cn-nav-badge">{counts.compartidos}</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="cn-sidebar-divider" />

      <div className="cn-sidebar-section">
        <p className="cn-sidebar-section-header" style={{ cursor: "default" }}>
          <span>Acceso rápido</span>
        </p>
        <ul className="cn-sidebar-folders-list">
          {recentClasses.slice(0, 4).map((note) => (
            <li key={note.id}>
              <button
                className="cn-sidebar-folder-item"
                onClick={() => onSelectClass(note.id)}
              >
                <FolderOpen size={16} />
                <span className="truncate">{note.title || "Sin título"}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="cn-sidebar-footer">
        <div className="cn-sidebar-stats">
          <span className="cn-stat-item">
            <strong>{classes.length}</strong> hojas
          </span>
        </div>
      </div>
    </aside>
  );
}
