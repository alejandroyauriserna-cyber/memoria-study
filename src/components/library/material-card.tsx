import { ArrowDown, BookOpen, CalendarDays, User } from "lucide-react";
import type { Material } from "@/types/material";

export function MaterialCard({ material }: { material: Material }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <p className="text-sm font-semibold text-accent">{material.courseName}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">{material.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{material.description}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2">
            <BookOpen size={14} /> {material.cycleLabel}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <p className="text-sm text-muted-foreground">
          <User size={14} className="inline-block align-text-bottom" /> {material.authorName}
        </p>
        <p className="text-sm text-muted-foreground">
          <CalendarDays size={14} className="inline-block align-text-bottom" /> {new Date(material.createdAt ?? "").toLocaleDateString("es-PE")}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-2">
            <ArrowDown size={14} /> {material.downloads}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-2">
            <BookOpen size={14} /> {material.views}
          </span>
        </div>
        <a
          href={material.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-foreground px-4 text-sm font-semibold text-background hover:bg-foreground/90"
        >
          Descargar archivo
        </a>
      </div>
    </article>
  );
}
