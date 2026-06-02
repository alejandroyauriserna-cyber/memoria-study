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
import { OrganizerDetailModal } from "@/components/organizers/organizer-detail-modal";
import { OrganizerListSkeleton } from "@/components/organizers/organizer-skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  formatOrganizerDate,
  organizerTypeLabel,
  wasOrganizerRegenerated,
} from "@/lib/organizers/format";
import type { OrganizerRecord } from "@/types/organizer";

type ViewMode = "grid" | "list";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrganizerCardActions({
  organizer,
  onView,
  onRegenerate,
  onDelete,
  onShare,
  regenerating,
}: {
  organizer: OrganizerRecord;
  onView: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onShare: () => void;
  regenerating: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={onView} className="h-9 px-3 text-xs">
        <Eye size={14} /> Ver
      </Button>
      <Button
        variant="secondary"
        onClick={onRegenerate}
        disabled={regenerating || !organizer.material_id}
        className="h-9 px-3 text-xs"
        title={organizer.material_id ? "Regenerar con IA" : "Sin material asociado"}
      >
        {regenerating ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <RefreshCw size={14} />
        )}
        Regenerar
      </Button>
      <Button variant="ghost" onClick={onShare} className="h-9 px-3 text-xs" title="Próximamente">
        <Share2 size={14} /> Compartir
      </Button>
      <Button
        variant="ghost"
        onClick={onDelete}
        className="h-9 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 size={14} /> Eliminar
      </Button>
    </div>
  );
}

function OrganizerCardItem({
  organizer,
  viewMode,
  highlighted,
  regenerating,
  onView,
  onRegenerate,
  onDelete,
  onShare,
}: {
  organizer: OrganizerRecord;
  viewMode: ViewMode;
  highlighted?: boolean;
  regenerating: boolean;
  onView: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const regenerated = wasOrganizerRegenerated(organizer.created_at, organizer.updated_at);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      id={`organizer-${organizer.id}`}
      className={`group overflow-hidden rounded-[28px] border bg-card/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(15,23,42,0.1)] ${
        highlighted ? "border-accent ring-2 ring-accent/20" : "border-border/80"
      } ${viewMode === "list" ? "p-5 sm:p-6" : "p-5"}`}
    >
      <div className={viewMode === "list" ? "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between" : ""}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/20 bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              {organizerTypeLabel(String(organizer.organizer_type))}
            </span>
            {regenerated ? (
              <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                Regenerado
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{organizer.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{organizer.description}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-muted/70 px-3 py-1">{organizer.course_name}</span>
            <span className="rounded-full border border-border bg-muted/70 px-3 py-1">{organizer.cycle_label}</span>
          </div>

          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>Creado {formatOrganizerDate(organizer.created_at)}</p>
            {regenerated ? <p>Última regeneración {formatOrganizerDate(organizer.updated_at)}</p> : null}
          </div>
        </div>

        <div className={viewMode === "list" ? "lg:pt-1" : "mt-5"}>
          <OrganizerCardActions
            organizer={organizer}
            onView={onView}
            onRegenerate={onRegenerate}
            onDelete={onDelete}
            onShare={onShare}
            regenerating={regenerating}
          />
        </div>
      </div>
    </motion.article>
  );
}

export function OrganizersWorkspace({
  initialOrganizers,
  highlightId,
  created,
}: {
  initialOrganizers: OrganizerRecord[];
  highlightId?: string;
  created?: boolean;
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

  useEffect(() => {
    const timer = window.setTimeout(() => setHydrated(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

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

  function handleShare() {
    toast("Compartir estará disponible próximamente.", "info");
  }

  function openDetail(organizer: OrganizerRecord) {
    setSelected(organizer);
  }

  if (!hydrated) {
    return (
      <div className="mt-8">
        <OrganizerListSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-[32px] border border-border/80 bg-card/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Organizadores</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              Tu espacio de estudio con IA
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Mapas conceptuales, repasos y síntesis generadas desde tus PDFs académicos.
            </p>
          </div>
          <Link
            href="/library"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90"
          >
            <BookOpen size={16} /> Buscar materiales
          </Link>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar organizadores..."
              className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm outline-none ring-accent focus:ring-2"
            />
          </label>

          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="h-12 rounded-2xl border border-border bg-background px-4 text-sm outline-none"
          >
            <option value="all">Todos los cursos</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select
            value={cycleFilter}
            onChange={(event) => setCycleFilter(event.target.value)}
            className="h-12 rounded-2xl border border-border bg-background px-4 text-sm outline-none"
          >
            <option value="all">Todos los ciclos</option>
            {cycles.map((cycle) => (
              <option key={cycle.cycleNumber} value={cycle.cycleNumber}>
                {cycle.cycleLabel}
              </option>
            ))}
          </select>

          <div className="flex rounded-2xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium ${
                viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              <Grid3X3 size={16} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium ${
                viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              <LayoutList size={16} /> Lista
            </button>
          </div>
        </div>
      </div>

      {organizers.length ? (
        <div className="mt-8">
          <OrganizerCreatedNotice organizerId={highlightId} created={created} />

          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length} organizador{filtered.length === 1 ? "" : "es"}
            </p>
          </div>

          {filtered.length ? (
            <div className={viewMode === "grid" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
              {filtered.map((organizer) => (
                <OrganizerCardItem
                  key={organizer.id}
                  organizer={organizer}
                  viewMode={viewMode}
                  highlighted={organizer.id === highlightId}
                  regenerating={regeneratingId === organizer.id}
                  onView={() => openDetail(organizer)}
                  onRegenerate={() => handleRegenerate(organizer)}
                  onDelete={() => setDeleteTarget(organizer)}
                  onShare={handleShare}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No hay organizadores que coincidan con tu búsqueda o filtros.
              </p>
            </div>
          )}
        </div>
      ) : (
        <OrganizersEmptyState />
      )}

      <OrganizerDetailModal
        organizer={selected}
        loading={Boolean(selected && regeneratingId === selected.id)}
        onClose={() => setSelected(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar organizador"
        description="Esta acción no se puede deshacer. Se eliminará el organizador y todo su contenido generado."
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function OrganizersEmptyState() {
  return (
    <div className="mt-8 rounded-[32px] border border-dashed border-border bg-gradient-to-br from-muted/40 via-card to-card p-12 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-accent-soft text-accent">
        <Sparkles size={34} />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-accent">
        Tu biblioteca visual está vacía
      </p>
      <h2 className="mt-4 text-3xl font-semibold text-foreground">Crea tu primer organizador con IA</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Abre un material en la biblioteca y pulsa Estudiar con IA para transformar el PDF en mapas,
        flashcards y repasos premium.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/library"
          className="inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90"
        >
          Buscar materiales
        </Link>
        <Link
          href="/upload-material"
          className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Subir material
        </Link>
      </div>
    </div>
  );
}
