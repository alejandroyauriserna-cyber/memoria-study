import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { FavoritesBrowser } from "@/components/library/favorites-browser";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export default async function FavoritesPage() {
  if (!hasSupabaseEnv()) {
    return (
      <AppShell>
        <section className="favorites-page mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="favorites-page-kicker">Favoritos</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Favoritos no disponibles</h1>
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
        <section className="favorites-page mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="favorites-page-kicker">Favoritos</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Inicia sesión para ver tus favoritos</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Guarda materiales mientras navegas la biblioteca para encontrarlos fácilmente aquí.
          </p>
          <Link href="/auth" className="tron-btn-primary mt-8 inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
            Iniciar sesión
          </Link>
        </section>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .schema("public")
    .from("favorites")
    .select("material_id, created_at, materials(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const materials = (data ?? [])
    .filter((item) => item.materials)
    .map((item) => {
      const materialsRow = item.materials as MaterialRecord | MaterialRecord[];
      const record = Array.isArray(materialsRow) ? materialsRow[0] : materialsRow;
      return {
        ...recordToMaterial(record),
        isFavorite: true,
        favoriteCreatedAt: item.created_at as string,
      };
    });

  return (
    <AppShell>
      <section className="favorites-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="favorites-page-hero flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="favorites-page-kicker">Tu colección de estudio</p>
            <h1>Materiales guardados</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Acceso rápido a lo que marcaste como importante. Estudiar, repasar y retomar sin buscar en toda la biblioteca.
            </p>
          </div>
          <span className="favorites-page-stat">{materials.length} guardados</span>
        </div>

        {materials.length ? (
          <FavoritesBrowser materials={materials} />
        ) : (
          <div className="favorites-empty mt-8">
            <p className="favorites-page-kicker">Colección vacía</p>
            <h2 className="mt-3 text-2xl font-bold text-foreground">Explora la biblioteca y guarda materiales</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Marca cualquier material con la estrella para encontrarlo aquí al instante.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/library" className="tron-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold">
                Ir a Biblioteca
              </Link>
              <Link href="/upload-material" className="tron-btn-secondary inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold">
                Subir material
              </Link>
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-6 text-sm text-[#FF8A00]">Error cargando favoritos: {error.message ?? "Intenta de nuevo."}</p>
        ) : null}
      </section>
    </AppShell>
  );
}
