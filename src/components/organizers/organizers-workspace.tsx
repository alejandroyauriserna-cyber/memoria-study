"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Eye,
  Grid3X3,
  LayoutList,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { OrganizerCreatedNotice } from "@/components/organizers/organizer-created-notice";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { OrganizerDetailModal } from "@/components/organizers/organizer-detail-modal";
import { OrganizerListSkeleton } from "@/components/organizers/organizer-skeleton";
import { useToast } from "@/components/ui/toast";
import {
  formatOrganizerDate,
  wasOrganizerRegenerated,
} from "@/lib/organizers/format";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";
import {
  layoutStudyMapNodes,
  studyBezierPath,
  branchForId,
} from "@/lib/organizers/concept-map-study";
import type { OrganizerRecord } from "@/types/organizer";

type ViewMode = "grid" | "list";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  loading,
  preset = "generic",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  preset?: "generic" | "regenerate";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogProgress = useLoadingProgress(Boolean(loading), preset);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="organizer-glass w-full max-w-md rounded-[24px] p-6"
      >
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {loading ? (
          <LoadingState
            active
            preset={preset}
            percent={dialogProgress.percent}
            message={dialogProgress.message}
            stageLabel={dialogProgress.stageLabel}
            variant="inline"
            className="mt-4"
          />
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 rounded-xl px-4 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            {loading ? `${dialogProgress.stageLabel} ${dialogProgress.percent}%` : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CardMapPreview({ content }: { content: unknown }) {
  const parsed = parseOrganizerContent(content);
  const title = parsed.conceptMap?.title;
  const nodes = parsed.conceptMap?.nodes?.filter(Boolean).slice(0, 8) ?? [];

  if (!nodes.length) {
    return (
      <div className="study-map-viewport flex h-full min-h-[100px] items-center justify-center rounded-xl">
        <Sparkles className="text-[#00FFD5]/50" size={28} />
      </div>
    );
  }

  const layout = layoutStudyMapNodes(title, nodes);
  const { nodes: layoutNodes, cx, cy, w, h } = layout;

  return (
    <div className="study-map-viewport relative h-full min-h-[100px] overflow-hidden rounded-xl">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" aria-hidden>
        {layoutNodes.map((node, index) => {
          const branch = branchForId(node.branchId);
          return (
            <path
              key={`${node.label}-${index}`}
              d={studyBezierPath(cx, cy, node.x, node.y)}
              fill="none"
              stroke={branch.color}
              strokeWidth={1.2}
              strokeOpacity={0.4}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={20} fill="rgba(0,255,213,0.25)" />
        {layoutNodes.map((node, index) => (
          <circle
            key={`n-${index}`}
            cx={node.x}
            cy={node.y}
            r={9}
            fill={branchForId(node.branchId).color}
            fillOpacity={0.85}
          />
        ))}
      </svg>
    </div>
  );
}

function OrganizerCardItem({
  organizer,
  viewMode,
  highlighted,
  regenerating,
  regenerateLabel,
  onView,
  onRegenerate,
  onDelete,
  onShare,
}: {
  organizer: OrganizerRecord;
  viewMode: ViewMode;
  highlighted?: boolean;
  regenerating: boolean;
  regenerateLabel?: string;
  onView: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const regenerated = wasOrganizerRegenerated(organizer.created_at, organizer.updated_at);

  if (viewMode === "list") {
    return (
      <motion.article
        layout
        id={`organizer-${organizer.id}`}
        whileHover={{ x: 4 }}
        className={`organizer-float-card organizer-glass group flex gap-4 rounded-[22px] p-3 sm:p-4 ${
          highlighted ? "ring-2 ring-accent/30" : ""
        }`}
      >
        <button type="button" onClick={onView} className="w-36 shrink-0 overflow-hidden rounded-xl sm:w-44">
          <CardMapPreview content={organizer.content} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <button type="button" onClick={onView} className="text-left">
            <h2 className="line-clamp-1 text-base font-semibold text-foreground">{organizer.title}</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{organizer.description}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {organizer.course_name} · {regenerated ? `Regenerado ${formatOrganizerDate(organizer.updated_at)}` : formatOrganizerDate(organizer.created_at)}
            </p>
          </button>
          <CardActionBar
            regenerating={regenerating}
            regenerateLabel={regenerateLabel}
            hasMaterial={Boolean(organizer.material_id)}
            onView={onView}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
            onShare={onShare}
            compact
          />
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      layout
      id={`organizer-${organizer.id}`}
      className={`group relative overflow-hidden rounded-[24px] ${
        highlighted ? "ring-2 ring-accent/35 shadow-[0_0_60px_-12px_rgba(31,107,67,0.45)]" : ""
      }`}
    >
      <div className="organizer-float-card organizer-glass relative flex h-full flex-col overflow-hidden rounded-[24px]">
        <button type="button" onClick={onView} className="relative block text-left">
          <div className="relative h-32 overflow-hidden border-b border-white/30 sm:h-36">
            <CardMapPreview content={organizer.content} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent dark:from-[#0b1220]/90" />
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2">
              {regenerated ? (
                <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  Regenerado
                </span>
              ) : null}
              <span className="text-[10px] text-muted-foreground">{organizer.cycle_label}</span>
            </div>
            <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {organizer.title}
            </h2>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{organizer.course_name}</p>
          </div>
        </button>

        <div className="absolute inset-x-0 bottom-0 translate-y-full border-t border-white/20 bg-white/80 p-2 backdrop-blur-xl transition duration-300 group-hover:translate-y-0 dark:bg-black/50">
          <CardActionBar
            regenerating={regenerating}
            regenerateLabel={regenerateLabel}
            hasMaterial={Boolean(organizer.material_id)}
            onView={onView}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
            onShare={onShare}
          />
        </div>
      </div>
    </motion.article>
  );
}

function CardActionBar({
  onView,
  onRegenerate,
  onDelete,
  onShare,
  regenerating,
  regenerateLabel,
  hasMaterial,
  compact = false,
}: {
  onView: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onShare: () => void;
  regenerating: boolean;
  regenerateLabel?: string;
  hasMaterial: boolean;
  compact?: boolean;
}) {
  const btnClass = compact
    ? "flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-medium transition hover:bg-foreground/5"
    : "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-medium transition hover:bg-foreground/5";

  return (
    <div className={`flex ${compact ? "gap-1" : "gap-1"}`}>
      <button type="button" onClick={onView} className={btnClass}>
        <Eye size={13} /> Ver
      </button>
      <button
        type="button"
        onClick={onRegenerate}
        disabled={regenerating || !hasMaterial}
        className={btnClass}
      >
        {regenerating ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />}
        {regenerating ? regenerateLabel : compact ? null : "Regenerar"}
      </button>
      <button type="button" onClick={onShare} className={btnClass} title="Compartir">
        <Share2 size={13} /> {compact ? null : "Compartir"}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={`${btnClass} text-red-400 hover:bg-red-500/10`}
        title="Eliminar"
      >
        <Trash2 size={13} /> {compact ? null : "Eliminar"}
      </button>
    </div>
  );
}

export function OrganizersWorkspace({
  initialOrganizers,
  highlightId,
  created,
  sharedOrganizer,
}: {
  initialOrganizers: OrganizerRecord[];
  highlightId?: string;
  created?: boolean;
  sharedOrganizer?: OrganizerRecord | null;
}) {
  const { toast } = useToast();
  const [organizers, setOrganizers] = useState(initialOrganizers);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [selected, setSelected] = useState<OrganizerRecord | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrganizerRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const regenerateProgress = useLoadingProgress(regeneratingId !== null, "regenerate");

  useEffect(() => {
    const timer = window.setTimeout(() => setHydrated(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (sharedOrganizer) {
      setSelected(sharedOrganizer);
    }
  }, [sharedOrganizer?.id]);

  const isSharedView =
    Boolean(selected && sharedOrganizer && selected.id === sharedOrganizer.id) &&
    !organizers.some((item) => item.id === sharedOrganizer?.id);

  const courses = useMemo(
    () => [...new Set(organizers.map((item) => item.course_name))].sort(),
    [organizers],
  );

  const cycles = useMemo(
    () =>
      [...new Set(organizers.map((item) => `${item.cycle_number}::${item.cycle_label}`))]
        .sort((a, b) => Number(a.split("::")[0]) - Number(b.split("::")[0]))
        .map((value) => {
          const [cycleNumber, cycleLabel] = value.split("::");
          return { cycleNumber, cycleLabel };
        }),
    [organizers],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return organizers.filter((organizer) => {
      const matchesSearch =
        !query ||
        organizer.title.toLowerCase().includes(query) ||
        organizer.description.toLowerCase().includes(query) ||
        organizer.course_name.toLowerCase().includes(query);

      const matchesCourse = courseFilter === "all" || organizer.course_name === courseFilter;
      const matchesCycle =
        cycleFilter === "all" || String(organizer.cycle_number) === cycleFilter;

      return matchesSearch && matchesCourse && matchesCycle;
    });
  }, [courseFilter, cycleFilter, organizers, search]);

  async function handleRegenerate(organizer: OrganizerRecord) {
    setRegeneratingId(organizer.id);

    try {
      const response = await fetch(`/api/organizers/${organizer.id}/regenerate`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo regenerar el organizador.");
      }

      const updated = payload.organizer as OrganizerRecord;
      setOrganizers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );

      if (selected?.id === updated.id) {
        setSelected(updated);
      }

      toast("Organizador regenerado correctamente.", "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Error regenerando el organizador.",
        "error",
      );
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleShare(organizer: OrganizerRecord) {
    try {
      const response = await fetch(`/api/organizers/${organizer.id}/share`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo generar el enlace.");
      }
      await navigator.clipboard.writeText(payload.shareUrl);
      toast("Enlace de compartir copiado al portapapeles.", "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Error al compartir el organizador.",
        "error",
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/organizers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo eliminar el organizador.");
      }

      setOrganizers((current) => current.filter((item) => item.id !== deleteTarget.id));

      if (selected?.id === deleteTarget.id) {
        setSelected(null);
      }

      toast("Organizador eliminado.", "success");
      setDeleteTarget(null);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Error eliminando el organizador.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!hydrated) {
    return <OrganizerListSkeleton />;
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(0,255,213,0.2)] bg-[rgba(0,255,213,0.08)] px-3 py-1 text-xs font-medium text-[#00FFD5]">
            <Sparkles size={12} /> MemoriaStudy
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA] sm:text-4xl">
            Organizadores visuales
          </h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            {organizers.length} organizador{organizers.length === 1 ? "" : "es"} · mapas conceptuales generados por IA
            {filtered.length !== organizers.length ? ` · ${filtered.length} visibles` : ""}
          </p>
        </div>
        <Link
          href="/library"
          className="tron-btn-primary inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
        >
          <BookOpen size={16} /> Nuevo desde biblioteca
        </Link>
      </div>

      <div className="organizer-glass mb-5 flex flex-col gap-3 rounded-[22px] p-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar..."
            className="h-10 w-full rounded-xl border-0 bg-foreground/[0.03] pl-9 pr-3 text-sm outline-none ring-accent focus:ring-2"
          />
        </label>
        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          className="h-10 rounded-xl border-0 bg-foreground/[0.03] px-3 text-sm outline-none"
        >
          <option value="all">Curso</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
        <select
          value={cycleFilter}
          onChange={(event) => setCycleFilter(event.target.value)}
          className="h-10 rounded-xl border-0 bg-foreground/[0.03] px-3 text-sm outline-none"
        >
          <option value="all">Ciclo</option>
          {cycles.map((cycle) => (
            <option key={cycle.cycleNumber} value={cycle.cycleNumber}>
              {cycle.cycleLabel}
            </option>
          ))}
        </select>
        <div className="flex rounded-xl bg-foreground/[0.04] p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium ${
              viewMode === "grid" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium ${
              viewMode === "list" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <LayoutList size={14} />
          </button>
        </div>
      </div>

      {organizers.length ? (
        <>
          <OrganizerCreatedNotice organizerId={highlightId} created={created} />

          {filtered.length ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-3"
              }
            >
              {filtered.map((organizer) => (
                <OrganizerCardItem
                  key={organizer.id}
                  organizer={organizer}
                  viewMode={viewMode}
                  highlighted={organizer.id === highlightId}
                  regenerating={regeneratingId === organizer.id}
                  regenerateLabel={
                    regeneratingId === organizer.id
                      ? `${regenerateProgress.stageLabel} ${regenerateProgress.percent}%`
                      : undefined
                  }
                  onView={() => setSelected(organizer)}
                  onRegenerate={() => handleRegenerate(organizer)}
                  onDelete={() => setDeleteTarget(organizer)}
                  onShare={() => void handleShare(organizer)}
                />
              ))}
            </div>
          ) : (
            <div className="organizer-glass rounded-[22px] px-6 py-14 text-center text-sm text-muted-foreground">
              Sin resultados para tu búsqueda.
            </div>
          )}
        </>
      ) : (
        <OrganizersEmptyState />
      )}

      <OrganizerDetailModal
        organizer={selected}
        readOnly={isSharedView}
        loading={Boolean(selected && regeneratingId === selected.id)}
        onClose={() => setSelected(null)}
        onContentUpdate={(organizerId, content) => {
          const nextContent = content as OrganizerRecord["content"];
          setOrganizers((current) =>
            current.map((item) =>
              item.id === organizerId ? { ...item, content: nextContent } : item,
            ),
          );
          setSelected((current) =>
            current?.id === organizerId ? { ...current, content: nextContent } : current,
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar organizador"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
        preset="generic"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function OrganizersEmptyState() {
  return (
    <div className="organizer-glass relative overflow-hidden rounded-[28px] px-8 py-16 text-center">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-emerald-600 text-white shadow-xl shadow-accent/25">
        <Sparkles size={28} />
      </div>
      <h2 className="relative mt-6 text-2xl font-semibold text-foreground">Tu canvas está vacío</h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Genera un organizador desde cualquier PDF y explora mapas, flashcards y repaso en un espacio visual.
      </p>
      <Link
        href="/library"
        className="relative mt-8 inline-flex h-11 items-center rounded-2xl bg-foreground px-6 text-sm font-semibold text-background"
      >
        Ir a biblioteca
      </Link>
    </div>
  );
}
