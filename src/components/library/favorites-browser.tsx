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

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 rounded-[32px] border border-border bg-card p-5 shadow-sm lg:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar favoritos</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en favoritos"
            className="h-12 w-full rounded-3xl border border-border bg-muted px-12 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </label>

        <label className="relative block">
          <span className="sr-only">Filtrar por curso</span>
          <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="h-12 min-w-56 rounded-3xl border border-border bg-muted px-12 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
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
          className="h-12 rounded-3xl border border-border bg-muted px-4 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>
      </div>

      <p className="text-sm font-semibold text-muted-foreground">Tienes {materials.length} materiales guardados</p>

      {filtered.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {filtered.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-border bg-muted p-10 text-center text-sm text-muted-foreground">
          No hay favoritos que coincidan con los filtros.
        </div>
      )}
    </div>
  );
}
