"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, FileText, Loader2, Sparkles } from "lucide-react";
import { MaterialCardDetail } from "@/components/library/material-card-detail";
import { StudyWithAiStatus } from "@/components/organizers/study-with-ai-status";
import { useStudyWithAi } from "@/hooks/use-study-with-ai";
import {
  getMaterialCoverFormat,
  getMaterialCoverGradient,
  getMaterialPagesDisplay,
} from "@/lib/materials/material-card-visual";
import type { Material } from "@/types/material";

type MaterialCardProps = {
  material: Material;
  /** `gallery` = tarjeta visual. `detail` = ficha completa (panel preview). */
  variant?: "gallery" | "detail";
};

export function MaterialCard({ material, variant = "gallery" }: MaterialCardProps) {
  if (variant === "detail") {
    return <MaterialCardDetail material={material} />;
  }

  return <MaterialCardGallery material={material} />;
}

function MaterialCardGallery({ material }: { material: Material }) {
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
  const coverGradient = getMaterialCoverGradient(material.courseId);
  const coverFormat = getMaterialCoverFormat(material);
  const pagesLabel = getMaterialPagesDisplay(material);

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
    <article className="lib-material-card group">
      <div className="lib-material-card-frame">
        <div className="lib-material-card-cover" style={{ background: coverGradient }}>
          <div className="lib-material-card-cover-shine" aria-hidden />
          <div className="lib-material-card-cover-grid" aria-hidden />

          <div className="lib-material-card-doc" aria-hidden>
            <div className="lib-material-card-doc-page lib-material-card-doc-page--back" />
            <div className="lib-material-card-doc-page lib-material-card-doc-page--front">
              <FileText size={32} strokeWidth={1.35} />
              <span>{coverFormat}</span>
              <div className="lib-material-card-doc-lines">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>

          <span className="lib-material-card-cover-tag">{coverFormat}</span>
        </div>

        <div className="lib-material-card-body">
          <span className="lib-material-card-course">{material.courseName}</span>

          <h3 className="lib-material-card-title">
            {material.id ? (
              <Link href={`/materials/${material.id}`}>{material.title}</Link>
            ) : (
              material.title
            )}
          </h3>

          <div className="lib-material-card-ai">
            <span className="lib-material-card-ai-dot" aria-hidden />
            IA lista
          </div>

          <p className="lib-material-card-pages">{pagesLabel}</p>

          <div className="lib-material-card-actions">
            <button
              type="button"
              className="lib-material-card-btn lib-material-card-btn--ghost"
              onClick={handleOpenPdf}
              disabled={actionsDisabled}
            >
              <ExternalLink size={15} />
              Abrir
            </button>
            <button
              type="button"
              className="lib-material-card-btn lib-material-card-btn--primary"
              onClick={() => void generateOrganizer()}
              disabled={actionsDisabled}
              aria-busy={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  {displayPercent}%
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Estudiar con IA
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <StudyWithAiStatus
        isGenerating={isGenerating}
        stageLabel={stage.label}
        message={stage.message}
        percent={displayPercent}
        error={studyAiError || undefined}
      />

      {message ? <p className="lib-material-card-message">{message}</p> : null}
    </article>
  );
}
