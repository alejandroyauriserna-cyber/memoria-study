"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import "./cuaderno-notes-header.css";

export function CuadernoNotesHeader({
  onSearch,
  studyHours,
  profileName,
}: {
  onSearch: (query: string) => void;
  studyHours?: string;
  profileName?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <header className="cn-notes-header">
      <div className="cn-notes-header-content">
        {/* Título */}
        <div className="cn-notes-header-title">
          <h1>Cuaderno</h1>
          {profileName && <p>Hola, {profileName}</p>}
        </div>

        {/* Buscador */}
        <div className="cn-notes-search-wrapper">
          <div className="cn-notes-search">
            <Search size={16} className="cn-search-icon" />
            <input
              type="text"
              placeholder="Buscar notas..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="cn-search-input"
            />
            {searchQuery && (
              <button
                className="cn-search-clear"
                onClick={clearSearch}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {studyHours && (
          <div className="cn-notes-stats">
            <span className="cn-stat">📚 Estudio esta semana: {studyHours}</span>
          </div>
        )}
      </div>
    </header>
  );
}
