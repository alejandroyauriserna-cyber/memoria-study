"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Folder, FolderOpen, GraduationCap, Search } from "lucide-react";
import { MaterialFileRow } from "@/components/library/material-file-row";
import {
  buildLibraryTree,
  filterLibraryTree,
  loadExpandedFolders,
  saveExpandedFolders,
} from "@/lib/library/library-tree";
import type { Material } from "@/types/material";

export function LibraryAcademicExplorer({ materials }: { materials: Material[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const fullTree = useMemo(() => buildLibraryTree(materials), [materials]);

  const { tree, expandedIds: searchExpanded } = useMemo(
    () => filterLibraryTree(fullTree, query),
    [fullTree, query],
  );

  useEffect(() => {
    setExpanded(loadExpandedFolders());
  }, []);

  useEffect(() => {
    if (query.trim() && searchExpanded.size) {
      setExpanded((current) => {
        const next = new Set([...current, ...searchExpanded]);
        saveExpandedFolders(next);
        return next;
      });
    }
  }, [query, searchExpanded]);

  const toggle = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveExpandedFolders(next);
      return next;
    });
  }, []);

  const totalMaterials = materials.length;

  return (
    <section className="ms-panel overflow-hidden">
      <div className="border-b border-[rgba(0,255,213,0.1)] px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
              <GraduationCap size={13} />
              Explorador académico
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#F5F7FA]">Ciclo → Curso → Material</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalMaterials} materiales en {fullTree.length} ciclos
            </p>
          </div>
        </div>

        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00FFD5]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar materiales..."
            className="h-11 w-full rounded-xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.55)] pl-10 pr-4 text-sm text-[#F5F7FA] outline-none focus:border-[rgba(0,255,213,0.35)]"
          />
        </label>
      </div>

      <div className="max-h-[min(70vh,720px)] overflow-y-auto px-2 py-3 font-mono text-sm md:px-3">
        {tree.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {query ? `Sin resultados para «${query}»` : "No hay materiales publicados todavía."}
          </p>
        ) : (
          tree.map((cycle) => {
            const cycleOpen = expanded.has(cycle.id) || Boolean(query.trim());
            return (
              <div key={cycle.id} className="select-none">
                <button
                  type="button"
                  onClick={() => toggle(cycle.id)}
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
                  <span className="ml-auto text-xs text-muted-foreground">({cycle.materialCount})</span>
                </button>

                <AnimatePresence initial={false}>
                  {cycleOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 border-l border-[rgba(0,255,213,0.12)] pl-1">
                        {cycle.courses.map((course) => {
                          const courseOpen = expanded.has(course.id) || Boolean(query.trim());
                          return (
                            <div key={course.id}>
                              <button
                                type="button"
                                onClick={() => toggle(course.id)}
                                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-[rgba(0,255,213,0.05)]"
                              >
                                <motion.span animate={{ rotate: courseOpen ? 90 : 0 }} className="text-[#00FFD5]/80">
                                  <ChevronRight size={13} />
                                </motion.span>
                                <span className="truncate text-[#F5F7FA]/90">{course.courseName}</span>
                                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                  ({course.materialCount})
                                </span>
                              </button>

                              <AnimatePresence initial={false}>
                                {courseOpen ? (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="ml-2 border-l border-[rgba(0,255,213,0.08)] pb-1 pl-1">
                                      {course.materials.map((material) => (
                                        <MaterialFileRow
                                          key={material.id}
                                          material={material as Material}
                                        />
                                      ))}
                                      {!course.materials.length ? (
                                        <p className="px-8 py-2 text-xs text-muted-foreground">Sin materiales</p>
                                      ) : null}
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
          })
        )}
      </div>
    </section>
  );
}
