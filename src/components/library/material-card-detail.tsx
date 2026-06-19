"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  GraduationCap,
  Heart,
  Layers3,
  Loader2,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { StudyWithAiStatus } from "@/components/organizers/study-with-ai-status";
import { useStudyWithAi } from "@/hooks/use-study-with-ai";
import {
  getMaterialConceptCount,
  getMaterialCoverFormat,
  getMaterialCoverGradient,
  getMaterialPageCount,
  getMaterialPagesDisplay,
  getMaterialReadingMinutes,
  getMaterialTypeLabel,
} from "@/lib/materials/material-card-visual";
import type { Material } from "@/types/material";

/** Panel lateral premium — no usar en galería. */
export function MaterialCardDetail({
  material,
  isModerator = false,
  onDeleted,
}: {
  material: Material;
  isModerator?: boolean;
  onDeleted?: (materialId: string) => void;
}) {
  const [downloads, setDownloads] = useState(material.downloads);
  const [likes, setLikes] = useState(material.likes ?? 0);
  const [favorite, setFavorite] = useState(material.isFavorite ?? false);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    isGenerating,
    stage,
    displayPercent,
    error: studyAiError,
    generate: generateOrganizer,
  } = useStudyWithAi(material.id);

  const actionsDisabled = busy || isGenerating || !material.id;
  const coverGradient = getMaterialCoverGradient(material.courseId);
  const typeLabel = getMaterialTypeLabel(material.materialType);
  const coverFormat = getMaterialCoverFormat(material);
  const pagesLabel = getMaterialPagesDisplay(material);
  const pageCount = getMaterialPageCount(material);
  const conceptCount = getMaterialConceptCount(material);
  const readingMinutes = getMaterialReadingMinutes(material);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  async function handleDeleteMaterial() {
    if (!material.id || !isModerator) return;

    const confirmed = window.confirm(
      `¿Eliminar permanentemente «${material.title}» de la biblioteca? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage("");
    setMenuOpen(false);

    try {
      const response = await fetch(`/api/materials/${material.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo eliminar el material.");
      }
      onDeleted?.(material.id);
      setMessage("Material eliminado de la biblioteca.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar el material.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenPdf() {
    if (!material.id) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/materials/${material.id}/view`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo abrir el PDF.");
      }
      window.open(payload.fileUrl ?? material.fileUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error abriendo el PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    if (!material.id) return;

    setBusy(true);
    setMessage("");
    setMenuOpen(false);

    try {
      const response = await fetch(`/api/materials/${material.id}/download`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo registrar la descarga.");
      }
      setDownloads(payload.downloads ?? downloads + 1);
      window.open(material.fileUrl, "_blank");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error registrando la descarga.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLike() {
    if (!material.id) return;

    setBusy(true);
    setMessage("");
    setMenuOpen(false);

    try {
      const response = await fetch(`/api/materials/${material.id}/like`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo registrar el like.");
      }
      setLikes(payload.likes ?? likes);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error registrando el like.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFavorite() {
    if (!material.id) return;

    setBusy(true);
    setMessage("");
    setMenuOpen(false);

    try {
      const response = await fetch(`/api/materials/${material.id}/favorite`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo actualizar el favorito.");
      }
      setFavorite(payload.isFavorite ?? !favorite);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error actualizando favorito.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="lib-detail">
      <section className="lib-detail-hero" aria-label="Estado del material">
        <div className="lib-detail-hero-chip">
          <FileText size={15} strokeWidth={1.6} aria-hidden />
          <span>{typeLabel}</span>
        </div>
        <div className="lib-detail-hero-chip lib-detail-hero-chip--active">
          <Sparkles size={15} strokeWidth={1.6} aria-hidden />
          <span>IA lista</span>
        </div>
        <div className="lib-detail-hero-chip">
          <GraduationCap size={15} strokeWidth={1.6} aria-hidden />
          <span>Guiado</span>
        </div>
        <div className="lib-detail-hero-chip">
          <ShieldCheck size={15} strokeWidth={1.6} aria-hidden />
          <span>Verificado</span>
        </div>
      </section>

      <section
        className="lib-detail-preview"
        style={{ background: coverGradient }}
        aria-label={`Portada de ${material.title}`}
      >
        <div className="lib-detail-preview-shine" />
        <div className="lib-detail-preview-cover">
          <span className="lib-detail-preview-format">{coverFormat}</span>
          <h3 className="lib-detail-preview-title">{material.title}</h3>
          <p className="lib-detail-preview-course">{material.courseName}</p>
          <p className="lib-detail-preview-pages">{pagesLabel}</p>
          <span className="lib-detail-preview-ai">
            <Sparkles size={12} strokeWidth={2} aria-hidden />
            IA lista
          </span>
        </div>
      </section>

      <section className="lib-detail-academic" aria-label="Métricas académicas">
        <div className="lib-detail-metric">
          <Layers3 size={16} className="lib-detail-metric-icon" aria-hidden />
          <p className="lib-detail-metric-value">{pageCount}</p>
          <p className="lib-detail-metric-label">Páginas</p>
        </div>
        <div className="lib-detail-metric">
          <Sparkles size={16} className="lib-detail-metric-icon" aria-hidden />
          <p className="lib-detail-metric-value">{conceptCount}</p>
          <p className="lib-detail-metric-label">Conceptos</p>
        </div>
        <div className="lib-detail-metric">
          <Clock3 size={16} className="lib-detail-metric-icon" aria-hidden />
          <p className="lib-detail-metric-value">{readingMinutes}</p>
          <p className="lib-detail-metric-label">Min lectura</p>
        </div>
      </section>

      <div className="lib-detail-actions">
        <button
          type="button"
          className="lib-detail-btn lib-detail-btn--ghost"
          onClick={handleOpenPdf}
          disabled={actionsDisabled}
        >
          <BookOpen size={16} />
          Ver PDF
        </button>
        <button
          type="button"
          className="lib-detail-btn lib-detail-btn--primary"
          onClick={() => void generateOrganizer()}
          disabled={actionsDisabled}
          aria-busy={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              {displayPercent}%
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Estudiar con IA
            </>
          )}
        </button>

        {material.id ? (
          <div className="lib-detail-menu" ref={menuRef}>
            <button
              type="button"
              className="lib-detail-menu-trigger"
              onClick={() => setMenuOpen((open) => !open)}
              disabled={actionsDisabled}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Más acciones"
            >
              <MoreHorizontal size={18} />
            </button>

            {menuOpen ? (
              <div className="lib-detail-menu-panel" role="menu">
                <button type="button" role="menuitem" onClick={handleDownload} disabled={actionsDisabled}>
                  <ArrowDown size={15} />
                  Descargar
                </button>
                <button type="button" role="menuitem" onClick={handleLike} disabled={actionsDisabled}>
                  <Heart size={15} />
                  Me gusta
                </button>
                <button type="button" role="menuitem" onClick={handleFavorite} disabled={actionsDisabled}>
                  <Star size={15} fill={favorite ? "currentColor" : "none"} />
                  {favorite ? "Quitar favorito" : "Guardar"}
                </button>
                <Link href={`/materials/${material.id}`} role="menuitem" onClick={() => setMenuOpen(false)}>
                  <Search size={15} />
                  Ver detalle
                </Link>
                <Link href={`/estudio-guiado/${material.id}`} role="menuitem" onClick={() => setMenuOpen(false)}>
                  <GraduationCap size={15} />
                  Estudio guiado
                </Link>
                {isModerator ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="is-danger"
                    onClick={() => void handleDeleteMaterial()}
                    disabled={actionsDisabled}
                  >
                    <Trash2 size={15} />
                    Eliminar de biblioteca
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="lib-detail-meta" aria-label="Información del material">
        <div className="lib-detail-meta-row">
          <User size={14} aria-hidden />
          <span>{material.authorName}</span>
        </div>
        <div className="lib-detail-meta-row">
          <GraduationCap size={14} aria-hidden />
          <span>
            {material.cycleLabel} · {material.courseName}
          </span>
        </div>
        <div className="lib-detail-meta-row">
          <CalendarDays size={14} aria-hidden />
          <span>{new Date(material.createdAt ?? "").toLocaleDateString("es-PE")}</span>
        </div>
        <div className="lib-detail-meta-stats">
          <span>
            <ArrowDown size={13} aria-hidden />
            {downloads} descargas
          </span>
          <span>
            <Heart size={13} aria-hidden />
            {likes} likes
          </span>
        </div>
      </section>

      <StudyWithAiStatus
        isGenerating={isGenerating}
        stageLabel={stage.label}
        message={stage.message}
        percent={displayPercent}
        error={studyAiError || undefined}
      />

      {message ? <p className="lib-detail-message">{message}</p> : null}
    </article>
  );
}
