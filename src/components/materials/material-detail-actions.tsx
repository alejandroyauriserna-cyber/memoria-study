"use client";

import { useState } from "react";
import { ArrowDown, BookOpen, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/organizers/create?materialId=${materialId}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo crear el organizador.");
      }

      window.location.href = "/organizers";
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Error creando el organizador.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <Button onClick={handleOpenPdf} disabled={busy} className="h-12">
          <BookOpen size={16} /> Ver PDF
        </Button>
        <Button variant="secondary" onClick={handleDownload} disabled={busy} className="h-12">
          <ArrowDown size={16} /> Descargar PDF
        </Button>
        <Button variant="secondary" onClick={handleFavorite} disabled={busy} className="h-12 transition">
          <Star size={16} /> {favorite ? "Guardado" : "Guardar"}
        </Button>
        <Button variant="secondary" onClick={handleLike} disabled={busy} className="h-12">
          <Heart size={16} /> Me gusta ({likes})
        </Button>
        <Button variant="secondary" onClick={handleStudyWithAi} disabled={busy} className="h-12">
          <BookOpen size={16} /> Estudiar con IA
        </Button>
      </div>

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
