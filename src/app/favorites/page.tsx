import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { MaterialCard } from "@/components/library/material-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export default async function FavoritesPage() {
  if (!hasSupabaseEnv()) {
    return (
      <AppShell>
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Favoritos</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Favoritos no disponibles</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Verifica la conexión para cargar tus materiales guardados.
          </p>
        </section>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Favoritos</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Inicia sesión para ver tus favoritos</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Guarda materiales mientras navegas la biblioteca para encontrarlos fácilmente aquí.
          </p>
          <Link href="/auth" className="mt-8 inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90">
            Iniciar sesión
          </Link>
        </section>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("material_favorites")
    .select("material_id, materials(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const materials = (data ?? [])
    .map((item: any) => item.materials)
    .filter(Boolean)
    .map((record: MaterialRecord) => ({
      ...recordToMaterial(record),
      isFavorite: true,
    }));

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Favoritos</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">Tus materiales guardados</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Revisa los recursos que has marcado para estudiar más rápido, con acceso directo desde este espacio.
              </p>
            </div>
            <div className="rounded-3xl bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground">
              {materials.length} elementos guardados
            </div>
          </div>
        </div>

        {materials.length ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[32px] border border-dashed border-border bg-muted p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-3xl">📚</div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-accent">Aún no tienes favoritos</p>
            <h2 className="mt-4 text-3xl font-semibold">Explora la biblioteca y guarda materiales</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Marca cualquier material con el corazón para poder acceder a él más rápido desde aquí.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/library" className="inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90">
                Ir a Biblioteca
              </Link>
              <Link href="/upload-material" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
                Subir material
              </Link>
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-6 text-sm text-red-500">Error cargando favoritos: {error.message ?? "Intenta de nuevo."}</p>
        ) : null}
      </section>
    </AppShell>
  );
}
