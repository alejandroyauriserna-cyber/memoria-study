import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { MaterialCard } from "@/components/library/material-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export default async function MyMaterialsPage() {
  if (!hasSupabaseEnv()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("materials")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const materials = (data ?? []).map((record) => recordToMaterial(record as MaterialRecord));

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Mis materiales</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#F5F7FA]">Tus archivos compartidos</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Administra y revisa el material que has subido. Todos los archivos se pueden descargar desde aquí.
            </p>
          </div>
          <Link
            href="/upload-material"
            className="tron-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold"
          >
            Subir nuevo material
          </Link>
        </div>

        {materials.length === 0 ? (
          <div className="tron-panel rounded-2xl p-8 text-center text-muted-foreground">
            No has subido ningún material aún.
          </div>
        ) : (
          <div className="grid gap-4">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
