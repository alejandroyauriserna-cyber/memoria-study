"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, ExternalLink, FileText, Loader2, Sparkles, Star } from "lucide-react";
import { StudyWithAiStatus } from "@/components/organizers/study-with-ai-status";
import { useStudyWithAi } from "@/hooks/use-study-with-ai";
import {
  getMaterialCoverFormat,
  getMaterialLastStudiedLabel,
  getMaterialLegalArea,
  getMaterialPagesDisplay,
  getMaterialStudyProgress,
  getMaterialThumbnailUrl,
  getMaterialTypeLabel,
} from "@/lib/materials/material-card-visual";
import type { Material } from "@/types/material";

export function FavoriteMaterialCard({ material }: { material: Material }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const {
    isGenerating,
    stage,
    displayPercent,
    error: studyAiError,
    generate: generateOrganizer,
  } = useStudyWithAi(material.id);

  const actionsDisabled = busy || isGenerating || !material.id;
  const area = getMaterialLegalArea(material);
  const thumbnail = getMaterialThumbnailUrl(material);
  const typeLabel = getMaterialTypeLabel(material.materialType);
  const formatLabel = getMaterialCoverFormat(material);
  const pagesLabel = getMaterialPagesDisplay(material);
  const lastStudied = getMaterialLastStudiedLabel(material);
  const progress = getMaterialStudyProgress(material);

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

  return (
    <article className="fav-card group">
      <div className="fav-card-cover" style={{ "--fav-accent": area.accent } as React.CSSProperties}>
        {thumbnail ? (
          <img src={thumbnail} alt="" className="fav-card-thumb" />
        ) : (
          <div className="fav-card-cover-art" style={{ background: area.soft }} aria-hidden>
            <div className="fav-card-doc fav-card-doc--back" />
            <div className="fav-card-doc fav-card-doc--front">
              <FileText size={18} strokeWidth={1.5} />
              <span>{formatLabel}</span>
            </div>
            <p className="fav-card-cover-course">{material.courseName}</p>
          </div>
        )}
        <span className="fav-card-cover-tag">{typeLabel}</span>
      </div>

      <div className="fav-card-body">
        <div className="fav-card-badges">
          <span className="fav-card-badge fav-card-badge--saved">
            <Star size={11} fill="currentColor" />
            Guardado
          </span>
          <span className="fav-card-badge fav-card-badge--ai">
            <Sparkles size={11} />
            IA lista
          </span>
        </div>

        <p className="fav-card-course">{material.courseName}</p>

        <h3 className="fav-card-title">
          {material.id ? (
            <Link href={`/materials/${material.id}`}>{material.title}</Link>
          ) : (
            material.title
          )}
        </h3>

        <div className="fav-card-meta">
          {lastStudied ? <span>Estudiado {lastStudied}</span> : null}
          <span>{pagesLabel}</span>
          {progress !== null ? (
            <span className="fav-card-progress">
              <span className="fav-card-progress-bar" aria-hidden>
                <i style={{ width: `${progress}%` }} />
              </span>
              {progress}%
            </span>
          ) : null}
        </div>

        <div className="fav-card-actions">
          <button
            type="button"
            className="fav-card-btn fav-card-btn--ghost"
            onClick={handleOpenPdf}
            disabled={actionsDisabled}
          >
            <ExternalLink size={14} />
            Abrir
          </button>
          <button
            type="button"
            className="fav-card-btn fav-card-btn--primary"
            onClick={() => void generateOrganizer()}
            disabled={actionsDisabled}
            aria-busy={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                {displayPercent}%
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Estudiar
              </>
            )}
          </button>
        </div>
      </div>

      <div className="fav-card-footer">
        <StudyWithAiStatus
          isGenerating={isGenerating}
          stageLabel={stage.label}
          message={stage.message}
          percent={displayPercent}
          error={studyAiError || undefined}
        />

        {message ? <p className="fav-card-message">{message}</p> : null}
      </div>
    </article>
  );
}
