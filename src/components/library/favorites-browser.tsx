"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { MaterialCard } from "@/components/library/material-card";
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

  const inputClass =
    "h-12 w-full rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(7,19,26,0.6)] text-sm text-[#F5F7FA] outline-none focus:border-[rgba(0,255,213,0.45)] focus:shadow-[0_0_24px_rgba(0,255,213,0.12)]";

  return (
    <div className="mt-8 space-y-6">
      <div className="tron-panel grid gap-4 rounded-2xl p-5 lg:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar favoritos</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00FFD5]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en favoritos"
            className={`${inputClass} px-12`}
          />
        </label>

        <label className="relative block">
          <span className="sr-only">Filtrar por curso</span>
          <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00FFD5]" />
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className={`${inputClass} min-w-56 px-12`}
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
          className={`${inputClass} px-4`}
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>
      </div>

      <p className="text-sm font-semibold text-muted-foreground">{materials.length} materiales guardados</p>

      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {filtered.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[rgba(0,255,213,0.2)] bg-[rgba(7,19,26,0.4)] p-10 text-center text-sm text-muted-foreground">
          No hay favoritos que coincidan con los filtros.
        </div>
      )}
    </div>
  );
}
