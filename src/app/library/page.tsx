import Link from "next/link";
import { ArrowDown, BookOpen, Eye, Heart, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { LibrarySearch } from "@/components/library/library-search";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { getMaterialBadges } from "@/lib/materials/badges";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function LibraryHomePage() {
  if (!hasSupabaseEnv()) {
    return (
      <AppShell>
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Biblioteca</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Biblioteca no disponible</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Verifica la configuración de Supabase para acceder a los materiales de la biblioteca colaborativa.
          </p>
          <Link href="/" className="mt-8 inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90">
            Volver al inicio
          </Link>
        </section>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await admin
    .schema("public")
    .from("materials")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const materials = (data ?? []) as MaterialRecord[];
  const totalViews = materials.reduce((sum, item) => sum + (item.views ?? 0), 0);
  const totalLikes = materials.reduce((sum, item) => sum + (item.likes ?? 0), 0);
  const totalDownloads = materials.reduce((sum, item) => sum + (item.downloads ?? 0), 0);
  const mostViewed = [...materials].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
  const mostDownloaded = [...materials].sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))[0];
  const mostLiked = [...materials].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0];

  const recentViewsSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentViewsData } = await admin
    .schema("public")
    .from("material_views")
    .select("material_id")
    .gte("viewed_at", recentViewsSince);

  const recentViewsByMaterial = new Map<string, number>();
  (recentViewsData ?? []).forEach((view) => {
    const materialId = view.material_id as string;
    recentViewsByMaterial.set(materialId, (recentViewsByMaterial.get(materialId) ?? 0) + 1);
  });

  const { data: historyData } = user
    ? await admin
        .schema("public")
        .from("material_study_history")
        .select("opened_at, materials(*)")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false })
        .limit(8)
    : { data: [] };

  const studyHistory = (historyData ?? [])
    .filter((item: any) => item.materials)
    .map((item: any) => ({
      ...recordToMaterial(item.materials as MaterialRecord),
      lastOpenedAt: item.opened_at,
    }));

  const cycleStats = new Map<number, { materialCount: number; lastUpdate: string; courseCount: number }>();

  materials.forEach((item) => {
    const updatedAt = new Date(item.created_at).toLocaleDateString("es-PE");
    const cycle = cycleStats.get(item.cycle_number) ?? {
      materialCount: 0,
      lastUpdate: updatedAt,
      courseCount: 0,
    };

    cycleStats.set(item.cycle_number, {
      materialCount: cycle.materialCount + 1,
      lastUpdate: new Date(item.created_at) > new Date(cycle.lastUpdate) ? updatedAt : cycle.lastUpdate,
      courseCount: cycle.courseCount,
    });
  });

  UNT_DERECHO.years.forEach((year) => {
    year.cycles.forEach((cycle) => {
      const entry = cycleStats.get(cycle.number);
      cycleStats.set(cycle.number, {
        materialCount: entry?.materialCount ?? 0,
        lastUpdate: entry?.lastUpdate ?? "Sin actualizaciones",
        courseCount: cycle.courses.length,
      });
    });
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-start">
          <div className="glass-card rounded-[32px] p-10 md:p-12">
            <div className="flex flex-col gap-6">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Biblioteca colaborativa</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Banco de apuntes UNT</h1>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Explora materiales por ciclo y curso, con estadísticas reales para estudiar y volver rápido a tus recursos.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Materiales", value: materials.length, icon: BookOpen },
                  { label: "Vistas", value: totalViews, icon: Eye },
                  { label: "Likes", value: totalLikes, icon: Heart },
                  { label: "Descargas", value: totalDownloads, icon: ArrowDown },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                    <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-muted-foreground">
                      <Icon size={16} /> {label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {studyHistory.length ? (
                <div className="mt-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Continuar estudiando</p>
                    <PlayCircle size={20} className="text-muted-foreground" />
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {studyHistory.map((material) => (
                      <Link
                        key={material.id}
                        href={`/materials/${material.id}`}
                        className="min-w-64 rounded-[28px] border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{material.courseName}</p>
                        <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-foreground">{material.title}</h3>
                        <p className="mt-4 text-xs text-muted-foreground">
                          Última apertura: {new Date(material.lastOpenedAt ?? "").toLocaleDateString("es-PE")}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/upload-material" className="inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background transition hover:-translate-y-0.5 hover:bg-foreground/90">
                  Subir material
                </Link>
                <Link href="/favorites" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-muted">
                  Ver favoritos
                </Link>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-card rounded-[32px] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Rankings</p>
              <div className="mt-6 grid gap-4">
                {[
                  { label: "Material más visto", item: mostViewed, value: mostViewed?.views ?? 0, icon: Eye },
                  { label: "Material más descargado", item: mostDownloaded, value: mostDownloaded?.downloads ?? 0, icon: ArrowDown },
                  { label: "Material más valorado", item: mostLiked, value: mostLiked?.likes ?? 0, icon: Heart },
                ].map(({ label, item, value, icon: Icon }) => (
                  <div key={label} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    {item ? (
                      <>
                        <Link href={`/materials/${item.id}`} className="mt-2 block text-sm text-muted-foreground hover:text-accent">
                          {item.title}
                        </Link>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                            <Icon size={14} /> {value}
                          </span>
                          <div className="flex flex-wrap justify-end gap-1">
                            {getMaterialBadges(recordToMaterial(item), recentViewsByMaterial.get(item.id) ?? 0).map((badge) => (
                              <span key={badge} className="rounded-full bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">Sin datos todavía.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-10">
          <LibrarySearch />
        </div>

        <div className="mt-10 grid gap-6">
          {UNT_DERECHO.years.map((year) => (
            <div key={year.number} className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">{year.label}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Ciclos académicos</h2>
                </div>
                <div className="text-sm text-muted-foreground">
                  {year.cycles.length} ciclos · {year.cycles.reduce((sum, cycle) => sum + cycle.courses.length, 0)} cursos
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {year.cycles.map((cycle) => {
                  const stats = cycleStats.get(cycle.number);
                  return (
                    <Link
                      key={cycle.number}
                      href={`/library/cycle/${cycle.number}`}
                      className="group rounded-[28px] border border-border bg-muted p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-accent">{cycle.label}</p>
                          <p className="mt-2 text-2xl font-semibold text-foreground group-hover:text-foreground">{cycle.courses.length} cursos</p>
                        </div>
                        <BookOpen className="text-muted-foreground" size={28} />
                      </div>
                      <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                        <p>{stats?.materialCount ?? 0} materiales disponibles</p>
                        <p>Última actualización: {stats?.lastUpdate ?? "Sin actualizaciones"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
