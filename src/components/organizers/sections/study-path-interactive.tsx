"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Lock,
  Map,
  Star,
  Target,
} from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";
import {
  GuidedStudyLaunchButton,
  GuidedStudyWalkthrough,
} from "@/components/organizers/sections/guided-study-walkthrough";
import { STUDY_BRANCHES } from "@/lib/organizers/concept-map-study";
import {
  buildPathNodeDetail,
  type EnrichedStudyContext,
} from "@/lib/organizers/study-content";
import {
  loadPathProgress,
  markPathNodeComplete,
  savePathProgress,
} from "@/lib/organizers/study-path-progress";

const DIFFICULTY_LABEL = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
} as const;

const IMPORTANCE_STARS = { alta: 3, media: 2, baja: 1 } as const;

type PathItem = {
  id: string;
  label: string;
  index: number;
  branchId: number;
};

function buildPathItems(root: string, branches: string[]): PathItem[] {
  return [
    { id: "root", label: root, index: 0, branchId: -1 },
    ...branches.map((label, index) => ({
      id: `branch-${index}`,
      label,
      index: index + 1,
      branchId: index % STUDY_BRANCHES.length,
    })),
  ];
}

export function StudyPathInteractive({
  root,
  branches,
  pathKey = "default",
  studyContext,
  bare = false,
}: {
  root: string;
  branches: string[];
  pathKey?: string;
  studyContext?: EnrichedStudyContext;
  bare?: boolean;
}) {
  const items = useMemo(() => buildPathItems(root, branches), [root, branches]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guidedMode, setGuidedMode] = useState(false);

  useEffect(() => {
    setProgress(loadPathProgress(pathKey));
  }, [pathKey]);

  const completedCount = items.filter((item) => progress[item.id]).length;
  const pathProgressPct = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const selectedDetail = useMemo(() => {
    if (!selected || !studyContext) return null;
    return buildPathNodeDetail(selected.label, selected.index, items.length, studyContext);
  }, [selected, studyContext, items.length]);

  const isUnlocked = useCallback(
    (item: PathItem) => {
      if (item.index === 0) return true;
      const prev = items[item.index - 1];
      return prev ? Boolean(progress[prev.id]) : false;
    },
    [items, progress],
  );

  function handleComplete() {
    if (!selected) return;
    markPathNodeComplete(pathKey, selected.id);
    setProgress(loadPathProgress(pathKey));
    setGuidedMode(false);

    const next = items.find((item) => item.index === selected.index + 1);
    if (next && isUnlocked(next)) {
      setSelectedId(next.id);
    }
  }

  const body = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
            Ruta de estudio
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {completedCount} de {items.length} conceptos completados
          </p>
        </div>
        <div className="min-w-[120px]">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Progreso</span>
            <span>{pathProgressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#00FFD5] to-[#00BFFF]"
              animate={{ width: `${pathProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative space-y-0">
        {items.map((item, index) => {
          const branch = item.branchId >= 0 ? STUDY_BRANCHES[item.branchId] : null;
          const Icon = branch?.icon ?? Target;
          const completed = Boolean(progress[item.id]);
          const unlocked = isUnlocked(item);
          const active = selectedId === item.id;
          const detail = studyContext
            ? buildPathNodeDetail(item.label, item.index, items.length, studyContext)
            : null;

          return (
            <div key={item.id} className="relative flex gap-3 pb-4">
              {index < items.length - 1 ? (
                <div
                  className={`absolute left-[18px] top-10 w-0.5 ${
                    completed ? "bg-[rgba(0,255,213,0.45)]" : "bg-[rgba(0,255,213,0.12)]"
                  }`}
                  style={{ height: "calc(100% - 12px)" }}
                />
              ) : null}

              <button
                type="button"
                disabled={!unlocked}
                onClick={() => {
                  if (!unlocked) return;
                  setSelectedId(item.id);
                  setGuidedMode(false);
                }}
                className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  completed
                    ? "border-[#00FFD5] bg-[#00FFD5] text-[#07131A]"
                    : active
                      ? "border-[#00FFD5] bg-[rgba(0,255,213,0.15)] text-[#00FFD5]"
                      : unlocked
                        ? "border-[rgba(0,255,213,0.35)] bg-[rgba(16,39,48,0.9)] text-[#00FFD5]"
                        : "border-[rgba(0,255,213,0.12)] bg-[rgba(16,39,48,0.6)] text-muted-foreground"
                }`}
              >
                {completed ? (
                  <CheckCircle2 size={16} />
                ) : unlocked ? (
                  <Icon size={14} />
                ) : (
                  <Lock size={13} />
                )}
              </button>

              <div
                className={`min-w-0 flex-1 rounded-xl border p-3 transition ${
                  active
                    ? "border-[rgba(0,255,213,0.4)] bg-[rgba(0,255,213,0.08)]"
                    : unlocked
                      ? "border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.45)] hover:border-[rgba(0,255,213,0.25)]"
                      : "border-[rgba(0,255,213,0.08)] bg-[rgba(7,19,26,0.25)] opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm font-semibold ${active ? "text-[#F5F7FA]" : "text-[#F5F7FA]/85"}`}>
                    {item.label}
                  </p>
                  {detail ? (
                    <>
                      <span className="rounded-full bg-[rgba(0,191,255,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#00BFFF]">
                        {DIFFICULTY_LABEL[detail.difficulty]}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-200">
                        {Array.from({ length: IMPORTANCE_STARS[detail.importance] }).map((_, i) => (
                          <Star key={i} size={10} fill="currentColor" />
                        ))}
                      </span>
                    </>
                  ) : null}
                  {completed ? (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-[#00FFD5]">
                      Completado
                    </span>
                  ) : null}
                </div>
                {item.id === "root" ? (
                  <p className="mt-1 text-xs text-muted-foreground">Tema central del organizador</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selected && selectedDetail ? (
          <motion.div
            key={selected.id + (guidedMode ? "-guided" : "")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.55)] p-4"
          >
            {guidedMode ? (
              <GuidedStudyWalkthrough
                conceptLabel={selected.label}
                detail={selectedDetail}
                onComplete={handleComplete}
                onClose={() => setGuidedMode(false)}
              />
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
                  {selected.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#F5F7FA]/88">{selectedDetail.summary}</p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{selectedDetail.simpleExplanation}</p>
                <div className="mt-4 space-y-2">
                  <GuidedStudyLaunchButton onClick={() => setGuidedMode(true)} />
                  {!progress[selected.id] ? (
                    <button
                      type="button"
                      onClick={handleComplete}
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-[#07131A]"
                      style={{ background: "#00FFD5" }}
                    >
                      <CheckCircle2 size={13} />
                      Marcar como completado
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...progress, [selected.id]: false };
                        savePathProgress(pathKey, next);
                        setProgress(next);
                      }}
                      className="text-xs text-muted-foreground hover:text-[#00FFD5]"
                    >
                      Repasar de nuevo
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  if (bare) return body;

  return (
    <OrganizerFloatPanel
      title="Ruta de estudio"
      hint="Aprendizaje guiado por conceptos"
      icon={<Map size={17} />}
      span={6}
    >
      {body}
    </OrganizerFloatPanel>
  );
}
