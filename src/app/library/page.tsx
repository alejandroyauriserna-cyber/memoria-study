import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { LibrarySearch } from "@/components/library/library-search";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import type { MaterialRecord } from "@/types/material";

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
  const { data } = await admin
    .from("materials")
    .select("id,course_id,course_name,cycle_number,cycle_label,created_at")
    .eq("is_public", true);

  const materials = (data ?? []) as MaterialRecord[];
  const courseStats = new Map<string, { count: number; latest: string; courseName: string }>();
  const cycleStats = new Map<number, { materialCount: number; lastUpdate: string; courseCount: number }>();

  materials.forEach((item) => {
    const existing = courseStats.get(item.course_id);
    const updatedAt = new Date(item.created_at).toLocaleDateString("es-PE");

    courseStats.set(item.course_id, {
      count: (existing?.count ?? 0) + 1,
      latest: existing?.latest
        ? new Date(item.created_at) > new Date(existing.latest)
          ? updatedAt
          : existing.latest
        : updatedAt,
      courseName: item.course_name,
    });

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
                  Explora materiales por ciclo y curso, con una experiencia fresca, ágil y moderna para estudiantes de Derecho.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Materiales</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{materials.length}</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Cursos</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {UNT_DERECHO.years.reduce((sum, year) => sum + year.cycles.reduce((inner, cycle) => inner + cycle.courses.length, 0), 0)}
                  </p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Ciclos</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{UNT_DERECHO.years.reduce((sum, year) => sum + year.cycles.length, 0)}</p>
                </div>
              </div>

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
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Tendencias</p>
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">Material más descargado</p>
                  <p className="mt-2 text-sm text-muted-foreground">Descubre los recursos más solicitados esta semana.</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">Material más valorado</p>
                  <p className="mt-2 text-sm text-muted-foreground">Contenido reconocido por la comunidad UNT.</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">Organizador destacado</p>
                  <p className="mt-2 text-sm text-muted-foreground">Mapas conceptuales y cuadros sinópticos populares.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Filtros rápidos</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Más recientes', 'Más descargados', 'Más valorados', 'Estudios', 'Casos'].map((label) => (
                  <span key={label} className="rounded-full border border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
                    {label}
                  </span>
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
                    <div key={cycle.number} className="rounded-[28px] border border-border bg-muted p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-accent">{cycle.label}</p>
                          <p className="mt-2 text-2xl font-semibold text-foreground">{cycle.courses.length} cursos</p>
                        </div>
                        <BookOpen className="text-muted-foreground" size={28} />
                      </div>
                      <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                        <p>{stats?.materialCount ?? 0} materiales disponibles</p>
                        <p>Última actualización: {stats?.lastUpdate ?? "Sin actualizaciones"}</p>
                      </div>
                    </div>
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
