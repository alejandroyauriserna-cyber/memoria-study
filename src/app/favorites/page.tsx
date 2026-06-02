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
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Favoritos</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#F5F7FA]">Favoritos no disponibles</h1>
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
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Favoritos</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#F5F7FA]">Inicia sesión para ver tus favoritos</h1>
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
    .filter((item: any) => item.materials)
    .map((item: any) => ({
      ...recordToMaterial(item.materials as MaterialRecord),
      isFavorite: true,
      favoriteCreatedAt: item.created_at,
    }));

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="tron-panel rounded-2xl p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Favoritos · IA</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#F5F7FA]">Tus materiales guardados</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Revisa los recursos que has marcado para estudiar más rápido, con acceso directo desde este espacio.
              </p>
            </div>
            <div className="tron-stat rounded-xl px-5 py-3 text-sm font-semibold text-[#00FFD5]">
              {materials.length} materiales guardados
            </div>
          </div>
        </div>

        {materials.length ? (
          <FavoritesBrowser materials={materials} />
        ) : (
          <div className="tron-panel mt-8 rounded-2xl border-dashed p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(0,255,213,0.1)] text-3xl shadow-[0_0_32px_rgba(0,255,213,0.15)]">
              📚
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Aún no tienes favoritos</p>
            <h2 className="mt-4 text-3xl font-bold text-[#F5F7FA]">Explora la biblioteca y guarda materiales</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Marca cualquier material con el corazón para poder acceder a él más rápido desde aquí.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/library" className="tron-btn-primary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
                Ir a Biblioteca
              </Link>
              <Link href="/upload-material" className="tron-btn-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
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
