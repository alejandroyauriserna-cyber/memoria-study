import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { Button } from "@/components/ui/button";
import { ArrowDown, BookOpen, CalendarDays, Heart, User } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function MaterialPage({
  params,
}: {
  params: { id: string };
}) {
  const materialId = params.id;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .eq("is_public", true)
    .single();

  if (error || !data) {
    return (
      <AppShell>
        <section className="mx-auto min-h-[calc(100vh-9rem)] max-w-4xl px-4 py-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Material no encontrado</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">No se encontró el material solicitado</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Revisa que el enlace sea correcto o vuelve a la biblioteca.</p>
          <div className="mt-8">
            <Link href="/library" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
              Volver a Biblioteca
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  const material = recordToMaterial(data as MaterialRecord);

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Detalle del material</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">{material.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Información completa del material compartido en la biblioteca pública.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/library" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
              Volver a Biblioteca
            </Link>
            <Link href={`/library/${material.courseId}`} className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
              Ver curso
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">{material.courseName}</p>
              <p className="mt-3 text-sm text-muted-foreground">{material.cycleLabel}</p>
              <p className="mt-6 text-lg font-semibold text-foreground">Descripción</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{material.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border bg-muted p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Autor</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{material.authorName}</p>
                </div>
                <div className="rounded-3xl border border-border bg-muted p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Creado</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{new Date(material.createdAt ?? "").toLocaleDateString("es-PE")}</p>
                </div>
              </div>
            </div>

            <aside className="space-y-4 rounded-[32px] border border-border bg-background p-6">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Nombre de archivo</p>
                <p className="text-base font-semibold text-foreground">{material.fileName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Descargas</p>
                <p className="text-base font-semibold text-foreground">{material.downloads}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Vistas</p>
                <p className="text-base font-semibold text-foreground">{material.views}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Likes</p>
                <p className="text-base font-semibold text-foreground">{material.likes}</p>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90"
                >
                  <BookOpen size={16} /> Ver PDF
                </a>
                <a
                  href={material.fileUrl}
                  download={material.fileName}
                  className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  <ArrowDown size={16} /> Descargar PDF
                </a>
                <Link
                  href={`/organizers/create?materialId=${material.id}`}
                  className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  <BookOpen size={16} /> Estudiar con IA
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
