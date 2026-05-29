"use client";

import { useState } from "react";
import { ArrowDown, BookOpen, CalendarDays, Eye, Heart, Search, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Material } from "@/types/material";

export function MaterialCard({ material }: { material: Material }) {
  const [downloads, setDownloads] = useState(material.downloads);
  const [views, setViews] = useState(material.views);
  const [likes, setLikes] = useState(material.likes ?? 0);
  const [favorite, setFavorite] = useState(material.isFavorite ?? false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDownload() {
    if (!material.id) return;

    setBusy(true);
    setMessage("");

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
    <article className="rounded-[32px] border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-5 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">{material.courseName}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{material.title}</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{material.description}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:items-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2">
            <BookOpen size={14} /> {material.cycleLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2">
            <Eye size={14} /> {views}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <p className="inline-flex items-center gap-2">
          <User size={14} /> {material.authorName}
        </p>
        <p className="inline-flex items-center gap-2">
          <CalendarDays size={14} /> {new Date(material.createdAt ?? "").toLocaleDateString("es-PE")}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-2">
            <ArrowDown size={14} /> {downloads}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-2">
            <Heart size={14} /> {likes}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant={favorite ? "secondary" : "ghost"} onClick={handleFavorite} disabled={busy}>
            <Star size={16} /> {favorite ? "Guardado" : "Guardar"}
          </Button>
          <Button variant="secondary" onClick={handleLike} disabled={busy}>
            <Heart size={16} /> Me gusta
          </Button>
          <Button onClick={handleDownload} disabled={busy}>
            <ArrowDown size={16} /> Descargar
          </Button>
        </div>
      </div>

      {material.id ? (
        <div className="mt-5 text-right">
          <a
            href={`/organizers/create?materialId=${material.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-3xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Search size={16} /> Estudiar con IA
          </a>
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm text-red-500">{message}</p> : null}
    </article>
  );
}
