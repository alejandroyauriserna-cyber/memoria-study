import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { MaterialCard } from "@/components/library/material-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: any }) {
  const resolvedParams = await params;
  const cycleNumber = Number(resolvedParams?.cycleNumber ?? "");
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  let favoriteIds = new Set<string>();

  if (user) {
    const { data: favorites } = await admin
      .schema("public")
      .from("favorites")
      .select("material_id")
      .eq("user_id", user.id);

    favoriteIds = new Set((favorites ?? []).map((favorite) => favorite.material_id as string));
  }

  const materials = (data ?? []).map((record) => ({
    ...recordToMaterial(record as MaterialRecord),
    isFavorite: favoriteIds.has(record.id),
  }));

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
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
