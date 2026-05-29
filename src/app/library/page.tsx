import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { BookOpen, ChevronRight } from "lucide-react";
import { LibrarySearch } from "@/components/library/library-search";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import type { MaterialRecord } from "@/types/material";

export default async function LibraryHomePage() {
  if (!hasSupabaseEnv()) {
    notFound();
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
      latest: existing?.latest ? (new Date(item.created_at) > new Date(existing.latest) ? updatedAt : existing.latest) : updatedAt,
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
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-accent">Biblioteca Colaborativa</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Banco de Apuntes UNT</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Explora materiales compartidos por ciclo y curso. Todo derecho UNT está abierto para consulta.
            </p>
          </div>
          <Link
            href="/upload-material"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Subir material
          </Link>
        </div>

        <LibrarySearch />

        <div className="mt-8 grid gap-4">
          {UNT_DERECHO.years.map((year) => (
            <div key={year.number} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-accent">{year.label}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">Ciclos académicos</h2>
                </div>
                <div className="grid gap-2 text-right text-sm text-muted-foreground">
                  <p>{year.cycles.reduce((sum, cycle) => sum + cycle.courses.length, 0)} cursos</p>
                  <p>{year.cycles.length} ciclos</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {year.cycles.map((cycle) => {
                  const stats = cycleStats.get(cycle.number);
                  return (
                    <div key={cycle.number} className="rounded-2xl border border-border bg-muted p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-accent">{cycle.label}</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">{cycle.courses.length} cursos</p>
                        </div>
                        <BookOpen className="text-muted-foreground" size={26} />
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

        <div className="mt-8 grid gap-4">
          {UNT_DERECHO.years.map((year) => (
            <div key={year.number} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-semibold">{year.label}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {year.cycles.map((cycle) => (
                  <div key={cycle.number} className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-sm font-semibold text-accent">{cycle.label}</p>
                    <div className="mt-4 space-y-3">
                      {cycle.courses.map((course) => {
                        const stats = courseStats.get(course.id);
                        return (
                          <Link
                            key={course.id}
                            href={`/library/${course.id}`}
                            className="block rounded-xl border border-border bg-card p-3 text-sm font-medium text-foreground hover:border-accent hover:bg-background"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span>{course.name}</span>
                              <ChevronRight size={14} />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {stats?.count ?? 0} materiales · última {stats?.latest ?? "sin datos"}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
