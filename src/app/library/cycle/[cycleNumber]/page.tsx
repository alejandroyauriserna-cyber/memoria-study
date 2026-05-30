import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { recordToMaterial } from "@/lib/materials/mapper";
import { MaterialCard } from "@/components/library/material-card";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function CycleMaterialsPage({ params }: { params: Record<string, string | undefined> }) {
  // Allow rendering even if environment detection is imperfect; prefer showing DB results when available.
  // Accept several common param names to tolerate mismatches between folder name and usage.
  // NOTE: dynamic folder is [cycleNumber] — use exact param name.
  console.log('cycle params', params);
  const rawCycle = params?.cycleNumber;
  const cycleNumber = Number(rawCycle);

  // Validate cycleNumber before using in DB queries to avoid passing NaN to Supabase.
  if (Number.isNaN(cycleNumber)) {
    return (
      <AppShell>
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Ciclo inválido</p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Parámetro de ciclo no válido</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">El identificador del ciclo proporcionado no es un número válido: {String(rawCycle)}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/library" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">Volver a Biblioteca</a>
          </div>
        </section>
      </AppShell>
    );
  }

  const cycleLookup = UNT_DERECHO.years
    .flatMap((year) => year.cycles)
    .find((item) => item.number === cycleNumber);

  const admin = createAdminClient();

  // Query materials directly by cycle number and public flag.
  const { data, error } = await admin
    .from("materials")
    .select("*")
    .eq("cycle_number", cycleNumber)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    // If there's an error querying, show a simple page with the error message instead of throwing notFound.
    return (
      <AppShell>
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Error cargando materiales</p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">No se pudieron obtener los materiales</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{String(error.message ?? error)}</p>
          <Link href="/library" className="mt-8 inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
            Volver a Biblioteca
          </Link>
        </section>
      </AppShell>
    );
  }

  const materials = (data ?? []).map((record) => recordToMaterial(record as MaterialRecord));

  const cycleLabel = cycleLookup?.label ?? `Ciclo ${cycleNumber}`;
  const courseCount = cycleLookup?.courses.length ?? 0;

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Ciclo académico</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">{cycleLabel}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Materiales públicos compartidos para {cycleLabel}. Navega por todos los recursos disponibles de este ciclo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/library" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
              Volver a Biblioteca
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Materiales en {cycleLabel}</p>
            <p className="mt-4 text-4xl font-semibold text-foreground">{materials.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Mostrando materiales públicos del ciclo seleccionado.</p>
          </div>
          <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Cursos en este ciclo</p>
            <p className="mt-4 text-4xl font-semibold text-foreground">{courseCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">Puedes usar el buscador para filtrar resultados por título, descripción o nombre de archivo.</p>
          </div>
        </div>

        <div className="mt-10">
          {materials.length === 0 ? (
            <div className="rounded-[32px] border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
              No hay materiales públicos disponibles para este ciclo.
            </div>
          ) : (
            <div className="grid gap-6">
              {materials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
