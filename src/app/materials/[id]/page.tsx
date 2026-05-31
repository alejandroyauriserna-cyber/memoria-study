import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, Heart, User } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { MaterialDetailActions } from "@/components/materials/material-detail-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMaterialBadges } from "@/lib/materials/badges";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: materialId } = await params;
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await admin
    .schema("public")
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .single();

  if (error || !data) {
    notFound();
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: recentViews }, { data: favorite }] = await Promise.all([
    admin
      .schema("public")
      .from("material_views")
      .select("id", { count: "exact", head: true })
      .eq("material_id", materialId)
      .gte("viewed_at", sevenDaysAgo),
    user
      ? admin
          .schema("public")
          .from("favorites")
          .select("id")
          .eq("material_id", materialId)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const material = {
    ...recordToMaterial(data as MaterialRecord),
    isFavorite: Boolean(favorite),
  };
  const badges = getMaterialBadges(material, recentViews ?? 0);

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Detalle del material</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">{material.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Información completa del material compartido en la biblioteca pública.
            </p>
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
              {badges.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-6 text-lg font-semibold text-foreground">Descripción</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{material.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border bg-muted p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Autor</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-foreground">
                    <User size={16} /> {material.authorName}
                  </p>
                </div>
                <div className="rounded-3xl border border-border bg-muted p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Creado</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-foreground">
                    <CalendarDays size={16} /> {new Date(material.createdAt ?? "").toLocaleDateString("es-PE")}
                  </p>
                </div>
              </div>
            </div>

            <aside className="space-y-4 rounded-[32px] border border-border bg-background p-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-3xl border border-border bg-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vistas</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{material.views}</p>
                </div>
                <div className="rounded-3xl border border-border bg-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Likes</p>
                  <p className="mt-2 inline-flex items-center justify-center gap-1 text-xl font-semibold text-foreground">
                    <Heart size={16} /> {material.likes}
                  </p>
                </div>
                <div className="rounded-3xl border border-border bg-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bajas</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{material.downloads}</p>
                </div>
              </div>

              <MaterialDetailActions
                materialId={material.id ?? materialId}
                fileName={material.fileName}
                fileUrl={material.fileUrl}
                initialFavorite={material.isFavorite}
                initialLikes={material.likes}
                initialViews={material.views}
              />

              <a
                href={`/api/organizers/create?materialId=${material.id}`}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <BookOpen size={16} /> Estudiar con IA
              </a>
            </aside>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
