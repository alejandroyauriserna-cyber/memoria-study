"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { FavoriteMaterialCard } from "@/components/library/favorite-material-card";
import type { Material } from "@/types/material";

export function FavoritesBrowser({ materials }: { materials: Material[] }) {
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [sort, setSort] = useState("newest");

  const courses = useMemo(() => {
    const entries = new Map<string, string>();
    materials.forEach((material) => entries.set(material.courseId, material.courseName));
    return Array.from(entries, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [materials]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return materials
      .filter((material) => {
        const matchesCourse = courseId === "all" || material.courseId === courseId;
        const matchesQuery =
          !normalized ||
          [material.title, material.description, material.courseName, material.fileName, material.authorName]
            .join(" ")
            .toLowerCase()
            .includes(normalized);

        return matchesCourse && matchesQuery;
      })
      .sort((a, b) => {
        const left = new Date(a.favoriteCreatedAt ?? a.createdAt ?? 0).getTime();
        const right = new Date(b.favoriteCreatedAt ?? b.createdAt ?? 0).getTime();
        return sort === "oldest" ? left - right : right - left;
      });
  }, [courseId, materials, query, sort]);

  return (
    <div className="favorites-browser mt-6 space-y-4">
      <div className="favorites-browser-toolbar">
        <label className="favorites-browser-field">
          <span className="sr-only">Buscar favoritos</span>
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en tu colección…"
            className="favorites-browser-input"
          />
        </label>

        <label className="favorites-browser-field">
          <span className="sr-only">Filtrar por curso</span>
          <SlidersHorizontal size={16} />
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="favorites-browser-input min-w-52"
          >
            <option value="all">Todos los cursos</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="favorites-browser-input favorites-browser-select"
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {filtered.length} de {materials.length} guardados
      </p>

      {filtered.length ? (
        <div className="favorites-browser-grid">
          {filtered.map((material) => (
            <FavoriteMaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="favorites-filter-empty text-sm text-muted-foreground">
          No hay favoritos que coincidan con los filtros.
        </div>
      )}
    </div>
  );
}
