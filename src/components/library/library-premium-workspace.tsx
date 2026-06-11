"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Filter,
  FileText,
  Folder,
  FolderOpen,
  GraduationCap,
  Grid3X3,
  Lightbulb,
  PlayCircle,
  Search,
  Star,
  Upload,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MaterialCardDetail } from "@/components/library/material-card-detail";
import { MaterialFileRow } from "@/components/library/material-file-row";
import {
  buildFilteredLibraryTree,
  MATERIAL_TYPE_OPTIONS,
  type LibraryFilters,
} from "@/lib/library/library-filters";
import {
  loadExpandedFolders,
  saveExpandedFolders,
  type LibraryTreeCycle,
} from "@/lib/library/library-tree";
import { getAllCycles } from "@/lib/academic/helpers";
import type { Material } from "@/types/material";
import { useCommandK } from "@/hooks/use-command-k";

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function LibraryPremiumWorkspace({
  materials,
  studyHistory = [],
  initialFavoriteIds = [],
  isLoggedIn = false,
}: {
  materials: Material[];
  studyHistory?: Material[];
  initialFavoriteIds?: string[];
  isLoggedIn?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Omit<LibraryFilters, "query">>({
    favoritesOnly: false,
    materialType: null,
    cycleNumber: null,
  });
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<Material | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(initialFavoriteIds),
  );
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useCommandK(searchInputRef);

  const { tree, expandedIds, matchCount } = useMemo(
    () =>
      buildFilteredLibraryTree(materials, favoriteIds, {
        query,
        ...filters,
      }),
    [materials, favoriteIds, query, filters.favoritesOnly, filters.materialType, filters.cycleNumber],
  );

  const cycles = useMemo(
    () =>
      getAllCycles().map((cycle) => ({
        number: cycle.cycleNumber,
        label: cycle.cycleLabel,
      })),
    [],
  );

  const favoritesList = useMemo(
    () => materials.filter((m) => m.id && favoriteIds.has(m.id)),
    [materials, favoriteIds],
  );

  useEffect(() => {
    setExpanded(loadExpandedFolders());
  }, []);

  useEffect(() => {
    if (query.trim() && expandedIds.size) {
      setExpanded((current) => {
        const next = new Set([...current, ...expandedIds]);
        saveExpandedFolders(next);
        return next;
      });
    }
  }, [query, expandedIds]);

  const toggle = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveExpandedFolders(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(async (material: Material) => {
    if (!material.id || !isLoggedIn) return;

    const wasFavorite = favoriteIds.has(material.id);
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (wasFavorite) next.delete(material.id!);
      else next.add(material.id!);
      return next;
    });

    try {
      const response = await fetch(`/api/materials/${material.id}/favorite`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);

      const isFavorite = payload.isFavorite ?? !wasFavorite;
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (isFavorite) next.add(material.id!);
        else next.delete(material.id!);
        return next;
      });
    } catch {
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (wasFavorite) next.add(material.id!);
        else next.delete(material.id!);
        return next;
      });
    }
  }, [favoriteIds, isLoggedIn]);

  const activeFilterCount =
    (filters.favoritesOnly ? 1 : 0) +
    (filters.materialType ? 1 : 0) +
    (filters.cycleNumber !== null ? 1 : 0);

  const hasActiveSearch = Boolean(query.trim()) || activeFilterCount > 0;

  return (
    <div className="library-premium library-workspace flex min-h-[calc(100vh-10rem)] flex-col overflow-hidden lg:min-h-[calc(100vh-8rem)] lg:flex-row">
      {/* Sidebar — Notion / VSCode explorer */}
      <aside className="library-sidebar flex w-full shrink-0 flex-col lg:w-[min(400px,38vw)]">
        <div className="library-sidebar-toolbar px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
              <GraduationCap size={13} />
              Explorador académico
            </p>
            <span className="library-count-badge">
              {matchCount} materiales
            </span>
          </div>

          <label className="library-search-field relative mt-3 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00FFD5]" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en toda la biblioteca…"
              className="h-11 w-full pl-10 pr-9 text-sm outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-[#00FFD5]"
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            ) : null}
          </label>

          <div className="library-filter-row mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold transition ${
                showFilters || activeFilterCount ? "is-active" : "text-muted-foreground"
              }`}
            >
              <Filter size={12} />
              Filtros
              {activeFilterCount ? (
                <span className="rounded-full bg-[#00FFD5] px-1.5 text-[9px] font-bold text-[#07131A]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() =>
                setFilters((f) => ({ ...f, favoritesOnly: !f.favoritesOnly }))
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold transition ${
                filters.favoritesOnly ? "is-active" : "text-muted-foreground"
              }`}
            >
              <Star size={12} className={filters.favoritesOnly ? "fill-current" : undefined} />
              Favoritos
            </button>
          </div>

          <AnimatePresence>
            {showFilters ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2 border-t border-[rgba(0,255,213,0.08)] pt-3">
                  <select
                    value={filters.cycleNumber ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        cycleNumber: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="h-9 w-full rounded-lg border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] px-2.5 text-xs text-[#F5F7FA] outline-none"
                  >
                    <option value="">Todos los ciclos</option>
                    {cycles.map((cycle) => (
                      <option key={cycle.number} value={cycle.number}>
                        {cycle.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1.5">
                    <FilterChip
                      active={filters.materialType === null}
                      onClick={() => setFilters((f) => ({ ...f, materialType: null }))}
                      label="Todos"
                    />
                    {MATERIAL_TYPE_OPTIONS.map((opt) => (
                      <FilterChip
                        key={opt.value}
                        active={filters.materialType === opt.value}
                        onClick={() =>
                          setFilters((f) => ({
                            ...f,
                            materialType: f.materialType === opt.value ? null : opt.value,
                          }))
                        }
                        label={opt.label}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="library-tree-scroll flex-1 overflow-y-auto px-2 py-2">
          {isLoggedIn && studyHistory.length ? (
            <SidebarSection icon={PlayCircle} title="Continuar estudiando" defaultOpen>
              {studyHistory.slice(0, 4).map((material) => (
                <QuickMaterialRow
                  key={`continue-${material.id}`}
                  material={material}
                  meta={material.lastOpenedAt ? formatRelativeTime(material.lastOpenedAt) : undefined}
                  selected={selected?.id === material.id}
                  onSelect={setSelected}
                />
              ))}
            </SidebarSection>
          ) : null}

          {isLoggedIn && favoritesList.length ? (
            <SidebarSection icon={Star} title={`Favoritos (${favoritesList.length})`}>
              {favoritesList.slice(0, 6).map((material) => (
                <QuickMaterialRow
                  key={`fav-${material.id}`}
                  material={material}
                  selected={selected?.id === material.id}
                  onSelect={setSelected}
                />
              ))}
              {favoritesList.length > 6 ? (
                <Link
                  href="/favorites"
                  className="block px-3 py-1.5 text-[11px] font-medium text-[#00FFD5] hover:underline"
                >
                  Ver todos los favoritos →
                </Link>
              ) : null}
            </SidebarSection>
          ) : null}

          {isLoggedIn && studyHistory.length > 4 ? (
            <SidebarSection icon={Clock} title="Recientes">
              {studyHistory.slice(4, 10).map((material) => (
                <QuickMaterialRow
                  key={`recent-${material.id}`}
                  material={material}
                  meta={material.lastOpenedAt ? formatRelativeTime(material.lastOpenedAt) : undefined}
                  selected={selected?.id === material.id}
                  onSelect={setSelected}
                />
              ))}
            </SidebarSection>
          ) : null}

          <div className="mt-1 px-2 pb-1 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Ciclo → Curso → Material
            </p>
          </div>

          {tree.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {hasActiveSearch
                ? "Sin resultados con los filtros actuales."
                : "No hay materiales publicados todavía."}
            </p>
          ) : (
            tree.map((cycle) => (
              <CycleBranch
                key={cycle.id}
                cycle={cycle}
                expanded={expanded}
                query={query}
                selectedId={selected?.id}
                favoriteIds={favoriteIds}
                onToggle={toggle}
                onSelect={setSelected}
                onToggleFavorite={isLoggedIn ? toggleFavorite : undefined}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main panel */}
      <main className="library-main-panel flex min-h-[320px] flex-1 flex-col overflow-hidden">
        {selected ? (
          <MaterialPreviewPanel
            material={{ ...selected, isFavorite: favoriteIds.has(selected.id ?? "") }}
            onClose={() => setSelected(null)}
          />
        ) : (
          <LibraryWelcomePanel
            materials={materials}
            matchCount={matchCount}
            cycleCount={cycles.length}
            favoritesCount={favoriteIds.size}
            hasActiveSearch={hasActiveSearch}
            isLoggedIn={isLoggedIn}
          />
        )}
      </main>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`library-filter-chip ms-home-chip rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active ? "is-active" : "text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function SidebarSection({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: typeof PlayCircle;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="library-sidebar-section mb-2 px-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-[rgba(0,255,213,0.05)]"
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-accent/80">
          <ChevronRight size={12} />
        </motion.span>
        <Icon size={13} className="text-accent" />
        <span className="library-sidebar-title text-[11px] font-semibold">{title}</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="ml-1 border-l border-[rgba(0,255,213,0.08)] pl-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function QuickMaterialRow({
  material,
  meta,
  selected,
  onSelect,
}: {
  material: Material;
  meta?: string;
  selected?: boolean;
  onSelect: (material: Material) => void;
}) {
  if (!material.id) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect(material)}
      className={`library-quick-row flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition ${
        selected ? "is-selected" : ""
      }`}
    >
      <span className="text-accent/70">•</span>
      <span className="min-w-0 flex-1 truncate font-medium">{material.title}</span>
      {meta ? <span className="shrink-0 text-[10px] text-muted-foreground">{meta}</span> : null}
    </button>
  );
}

function CycleBranch({
  cycle,
  expanded,
  query,
  selectedId,
  favoriteIds,
  onToggle,
  onSelect,
  onToggleFavorite,
}: {
  cycle: LibraryTreeCycle;
  expanded: Set<string>;
  query: string;
  selectedId?: string;
  favoriteIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (material: Material) => void;
  onToggleFavorite?: (material: Material) => void;
}) {
  const cycleOpen = expanded.has(cycle.id) || Boolean(query.trim());

  return (
    <div className="library-cycle-branch select-none px-1">
      <button
        type="button"
        onClick={() => onToggle(cycle.id)}
        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left transition hover:bg-[rgba(0,255,213,0.06)]"
      >
        <motion.span animate={{ rotate: cycleOpen ? 90 : 0 }} className="text-[#00FFD5]">
          <ChevronRight size={14} />
        </motion.span>
        {cycleOpen ? (
          <FolderOpen size={15} className="shrink-0 text-[#00FFD5]" />
        ) : (
          <Folder size={15} className="shrink-0 text-[#00FFD5]/70" />
        )}
        <span className="font-semibold text-[#F5F7FA]">{cycle.cycleLabel}</span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {cycle.materialCount}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {cycleOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-3 border-l border-[rgba(0,255,213,0.1)] pl-1">
              {cycle.courses.map((course) => {
                const courseOpen = expanded.has(course.id) || Boolean(query.trim());
                return (
                  <div key={course.id}>
                    <button
                      type="button"
                      onClick={() => onToggle(course.id)}
                      className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-[rgba(0,255,213,0.05)]"
                    >
                      <motion.span
                        animate={{ rotate: courseOpen ? 90 : 0 }}
                        className="text-[#00FFD5]/80"
                      >
                        <ChevronRight size={13} />
                      </motion.span>
                      <span className="truncate text-sm text-[#F5F7FA]/90">{course.courseName}</span>
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                        {course.materialCount}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {courseOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-2 border-l border-[rgba(0,255,213,0.06)] pb-1 pl-0.5">
                            {course.materials.map((material) => (
                              <MaterialFileRow
                                key={material.id}
                                material={material as Material}
                                selected={selectedId === material.id}
                                isFavorite={material.id ? favoriteIds.has(material.id) : false}
                                onSelect={onSelect}
                                onToggleFavorite={onToggleFavorite}
                              />
                            ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MaterialPreviewPanel({
  material,
  onClose,
}: {
  material: Material;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="library-preview-header flex items-center justify-between px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#00FFD5]">
            {material.courseName}
          </p>
          <h2 className="truncate text-lg font-bold text-[#F5F7FA]">{material.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-[rgba(0,255,213,0.08)] hover:text-[#00FFD5]"
          aria-label="Cerrar vista previa"
        >
          <X size={18} />
        </button>
      </div>
      <div className="library-preview-body flex-1 overflow-y-auto p-4">
        <MaterialCardDetail material={material} />
      </div>
    </div>
  );
}

function LibraryWelcomePanel({
  materials,
  matchCount,
  cycleCount,
  favoritesCount,
  hasActiveSearch,
  isLoggedIn,
}: {
  materials: Material[];
  matchCount: number;
  cycleCount: number;
  favoritesCount: number;
  hasActiveSearch: boolean;
  isLoggedIn: boolean;
}) {
  return (
    <div className="library-welcome flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="library-welcome-stage" aria-hidden>
        <div className="library-welcome-stage__panel library-welcome-stage__panel--main">
          <div className="library-welcome-stage__bar">
            <span />
            <span />
            <span />
          </div>
          <div className="library-welcome-stage__search">
            <Search size={15} />
            <span>Derecho constitucional</span>
          </div>
          <div className="library-welcome-stage__rows">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="library-welcome-stage__panel library-welcome-stage__panel--card">
          <FileText size={22} />
          <strong>{matchCount}</strong>
          <span>materiales</span>
        </div>
        <div className="library-welcome-stage__panel library-welcome-stage__panel--ai">
          <Lightbulb size={18} />
          <span>IA lista</span>
        </div>
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
        {hasActiveSearch ? `${matchCount} materiales encontrados` : "Biblioteca académica UNT"}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {hasActiveSearch
          ? "Selecciona un material del explorador para ver detalles, descargar o estudiar con IA."
          : "Navega por ciclos y cursos como carpetas. Expande cada curso para ver sus materiales — sin listas infinitas de PDFs."}
      </p>

      <div className="library-stat-grid mt-8 grid grid-cols-3 gap-4">
        <StatPill icon={Grid3X3} label="Materiales" value={String(matchCount)} />
        <StatPill icon={BookOpen} label="Ciclos" value={String(cycleCount)} />
        <StatPill icon={Star} label="Favoritos" value={isLoggedIn ? String(favoritesCount) : "--"} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/upload-material"
          className="tron-btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
        >
          <Upload size={16} />
          Subir material
        </Link>
        {isLoggedIn ? (
          <Link
            href="/favorites"
            className="tron-btn-secondary inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
          >
            <Star size={16} />
            Mis favoritos
          </Link>
        ) : null}
      </div>

      {!hasActiveSearch && materials.length ? (
        <p className="mt-8 max-w-sm text-xs text-muted-foreground">
          Tip: usa la búsqueda global o los filtros por tipo y ciclo. Marca favoritos con ★ desde
          cualquier material del árbol.
        </p>
      ) : null}
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="library-stat-pill px-4 py-3">
      <Icon size={15} className="library-stat-pill-icon" aria-hidden />
      <p className="text-xl font-bold tabular-nums text-accent">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
