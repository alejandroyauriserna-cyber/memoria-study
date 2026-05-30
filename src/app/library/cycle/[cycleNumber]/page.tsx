import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { recordToMaterial } from "@/lib/materials/mapper";
import { MaterialCard } from "@/components/library/material-card";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function CycleMaterialsPage({ params }: { params: { cycleNumber: string } }) {
  if (!hasSupabaseEnv()) {
    notFound();
  }

  const cycleNumber = Number(params.cycleNumber);
  if (!Number.isInteger(cycleNumber)) {
    notFound();
  }

  const cycle = UNT_DERECHO.years
    .flatMap((year) => year.cycles)
    .find((item) => item.number === cycleNumber);

  if (!cycle) {
    notFound();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("materials")
    .select("*")
    .eq("cycle_number", cycleNumber)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const materials = (data ?? []).map((record) => recordToMaterial(record as MaterialRecord));

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Ciclo académico</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">{cycle.label}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Materiales públicos compartidos para el {cycle.label}. Navega por todos los recursos disponibles de este ciclo.
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
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Materiales en {cycle.label}</p>
            <p className="mt-4 text-4xl font-semibold text-foreground">{materials.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Mostrando materiales públicos del ciclo seleccionado.</p>
          </div>
          <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Cursos en este ciclo</p>
            <p className="mt-4 text-4xl font-semibold text-foreground">{cycle.courses.length}</p>
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
