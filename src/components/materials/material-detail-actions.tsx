"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, BookOpen, GraduationCap, Heart, Loader2, Sparkles, Star } from "lucide-react";
import { StudyWithAiStatus } from "@/components/organizers/study-with-ai-status";
import { Button } from "@/components/ui/button";
import { useStudyWithAi } from "@/hooks/use-study-with-ai";

export function MaterialDetailActions({
  materialId,
  fileName,
  fileUrl,
  initialFavorite = false,
  initialLikes,
  initialViews,
}: {
  materialId: string;
  fileName: string;
  fileUrl: string;
  initialFavorite?: boolean;
  initialLikes: number;
  initialViews: number;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [likes, setLikes] = useState(initialLikes);
  const [views, setViews] = useState(initialViews);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const {
    isGenerating,
    stage,
    displayPercent,
    error: studyAiError,
    generate: generateOrganizer,
  } = useStudyWithAi(materialId);

  async function postJson(path: string) {
    const response = await fetch(path, { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "No se pudo completar la acción.");
    }

    return payload;
  }

  async function handleOpenPdf() {
    setBusy(true);
    setMessage("");

    try {
      const payload = await postJson(`/api/materials/${materialId}/view`);
      setViews(payload.views ?? views);
      window.open(payload.fileUrl ?? fileUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Error abriendo el PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    setMessage("");

    try {
      await postJson(`/api/materials/${materialId}/download`);
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Error registrando la descarga.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLike() {
    setBusy(true);
    setMessage("");

    try {
      const payload = await postJson(`/api/materials/${materialId}/like`);
      setLikes(payload.likes ?? likes);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Error registrando el like.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFavorite() {
    setBusy(true);
    setMessage("");

    try {
      const payload = await postJson(`/api/materials/${materialId}/favorite`);
      const nextFavorite = payload.isFavorite ?? !favorite;
      setFavorite(nextFavorite);
      setMessage(nextFavorite ? "Material agregado a favoritos" : "Material eliminado de favoritos");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Error actualizando favorito.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStudyWithAi() {
    setMessage("");
    await generateOrganizer();
  }

  const actionsDisabled = busy || isGenerating;

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <Button onClick={handleOpenPdf} disabled={actionsDisabled} className="h-12">
          <BookOpen size={16} /> Ver PDF
        </Button>
        <Button variant="secondary" onClick={handleDownload} disabled={actionsDisabled} className="h-12">
          <ArrowDown size={16} /> Descargar PDF
        </Button>
        <Button variant="secondary" onClick={handleFavorite} disabled={actionsDisabled} className="h-12 transition">
          <Star size={16} /> {favorite ? "Guardado" : "Guardar"}
        </Button>
        <Button variant="secondary" onClick={handleLike} disabled={actionsDisabled} className="h-12">
          <Heart size={16} /> Me gusta ({likes})
        </Button>
        <Button
          variant="secondary"
          onClick={handleStudyWithAi}
          disabled={actionsDisabled}
          className="h-12"
          aria-busy={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {isGenerating ? stage.label : "Estudiar con IA"}
        </Button>
        <Link
          href={`/estudio-guiado/${materialId}`}
          className="tron-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50"
          aria-disabled={actionsDisabled}
          onClick={(e) => {
            if (actionsDisabled) e.preventDefault();
          }}
        >
          <GraduationCap size={16} />
          Estudio guiado jurídico
        </Link>
      </div>

      <StudyWithAiStatus
        isGenerating={isGenerating}
        stageLabel={stage.label}
        message={stage.message}
        percent={displayPercent}
        error={studyAiError}
      />

      <div className="rounded-3xl border border-border bg-muted p-4 text-sm text-muted-foreground">
        <p>{views} vistas únicas</p>
        <p className="mt-1 break-all">{fileName}</p>
      </div>

      {message ? (
        <div className="rounded-3xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm">
          {message}
        </div>
      ) : null}
    </div>
  );
}
