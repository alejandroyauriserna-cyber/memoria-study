import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: any }) {
  const resolvedParams = await params;
  const cycleNumber = Number(resolvedParams?.cycleNumber ?? "");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("materials")
    .select("*")
    .eq("cycle_number", cycleNumber)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <AppShell>
        <section className="mx-auto min-h-[calc(100vh-9rem)] max-w-3xl px-4 py-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Error cargando materiales</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">No se pudieron cargar los materiales del ciclo</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Ocurrió un error al obtener los recursos compartidos. Intenta recargar la página.</p>
          <p className="mt-4 text-sm text-red-500">{error.message}</p>
          <div className="mt-8">
            <Link href="/library" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
              Volver a Biblioteca
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  const materials = (data ?? []).map((record) => recordToMaterial(record as MaterialRecord));

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Ciclo académico</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">Materiales del ciclo {resolvedParams?.cycleNumber}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Recursos públicos compartidos para el ciclo seleccionado. Haz clic en un material para ver el detalle.
          </p>
        </div>

        {materials.length === 0 ? (
          <div className="rounded-[32px] border border-border bg-card p-10 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Sin materiales</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Aún no hay recursos para este ciclo</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              No se encontraron materiales públicos para este ciclo. Revisa otro ciclo o vuelve más tarde.
            </p>
            <Link href="/library" className="mt-8 inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
              Volver a Biblioteca
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {materials.map((material) => (
              <Link
                key={material.id}
                href={`/materials/${material.id}`}
                className="block rounded-[32px] border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">{material.courseName}</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{material.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{material.description}</p>
                  </div>
                  <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:items-end">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2">Curso: {material.courseName}</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2">Tipo: {material.materialType}</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2">Fecha: {new Date(material.createdAt ?? "").toLocaleDateString("es-PE")}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-2">Ciclo: {material.cycleLabel}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-2">Archivo: {material.fileName}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
