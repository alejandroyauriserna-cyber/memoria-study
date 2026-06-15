"use client";

import { useState } from "react";
import { Search, X, Filter, BarChart3 } from "lucide-react";
import "./cuaderno-notes-header-pro.css";

export function CuadernoNotesHeaderPro({
  onSearch,
  onFilterToggle,
  studyHours,
  profileName,
  dark = false,
  stats,
}: {
  onSearch: (query: string) => void;
  onFilterToggle: () => void;
  studyHours?: string;
  profileName?: string;
  dark?: boolean;
  stats?: {
    totalNotes: number;
    totalPages: number;
    studyStreak: number;
  };
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <header className={dark ? "cn-notes-header-pro cn-notes-header-pro--dark" : "cn-notes-header-pro"}>
      <div className="cn-header-content">
        {/* Sección izquierda: Título y subtítulo */}
        <div className="cn-header-intro">
          <div>
            <h1 className="cn-header-title">Cuaderno</h1>
            {profileName && (
              <p className="cn-header-subtitle">Hola, {profileName}</p>
            )}
          </div>

          {/* Stats badge */}
          {stats && (
            <div className="cn-header-stats-badge">
              <div className="cn-stat-badge-item">
                <span className="cn-stat-value">{stats.totalNotes}</span>
                <span className="cn-stat-label">notas</span>
              </div>
              <div className="cn-stat-divider" />
              <div className="cn-stat-badge-item">
                <span className="cn-stat-value">{stats.studyStreak}</span>
                <span className="cn-stat-label">días seguidos</span>
              </div>
            </div>
          )}
        </div>

        {/* Sección centro: Buscador avanzado */}
        <div className="cn-search-container">
          <div className="cn-search-wrapper">
            <Search size={18} className="cn-search-icon" />
            <input
              type="text"
              placeholder="Buscar notas, cursos, conceptos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="cn-search-input-pro"
              onFocus={() => setShowAdvanced(true)}
            />
            {searchQuery && (
              <button
                className="cn-search-clear-pro"
                onClick={clearSearch}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Botones de acciones */}
          <div className="cn-search-actions">
            <button
              className="cn-action-btn"
              onClick={onFilterToggle}
              title="Filtros avanzados"
            >
              <Filter size={18} />
            </button>
            <button
              className="cn-action-btn"
              title="Estadísticas"
            >
              <BarChart3 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Buscador avanzado expandido */}
      {showAdvanced && searchQuery && (
        <div className="cn-search-suggestions">
          <div className="cn-suggestion-group">
            <h4>Sugerencias</h4>
            <button className="cn-suggestion-item">
              📌 Recientes
            </button>
            <button className="cn-suggestion-item">
              ⭐ Favoritos
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
