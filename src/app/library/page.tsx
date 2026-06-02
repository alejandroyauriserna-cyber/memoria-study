import Link from "next/link";
import { BookOpen, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { LibraryAcademicExplorer } from "@/components/library/library-academic-explorer";
import { LibrarySearch } from "@/components/library/library-search";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function LibraryHomePage() {
  if (!hasSupabaseEnv()) {
    return (
      <AppShell>
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Biblioteca</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Biblioteca no disponible</h1>
          <Link href="/" className="tron-btn-primary mt-8 inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
            Volver al inicio
          </Link>
        </section>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await admin
    .schema("public")
    .from("materials")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const materials = (data ?? []).map((record) => recordToMaterial(record as MaterialRecord));

  const { data: historyData } = user
    ? await admin
        .schema("public")
        .from("material_study_history")
        .select("opened_at, materials(*)")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false })
        .limit(8)
    : { data: [] };

  const studyHistory = (historyData ?? [])
    .filter((item) => item.materials)
    .map((item) => {
      const materials = item.materials as MaterialRecord | MaterialRecord[];
      const record = Array.isArray(materials) ? materials[0] : materials;
      if (!record) return null;
      return {
        ...recordToMaterial(record),
        lastOpenedAt: item.opened_at as string,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
              Biblioteca académica
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F5F7FA] md:text-4xl">
              Materiales por ciclo y curso
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Navega como carpetas: ciclo académico → curso → material. {materials.length} recursos disponibles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/upload-material"
              className="tron-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold"
            >
              Subir material
            </Link>
            <Link
              href="/favorites"
              className="tron-btn-secondary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold"
            >
              Favoritos
            </Link>
          </div>
        </div>

        {studyHistory.length ? (
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <PlayCircle size={16} className="text-[#00FFD5]" />
              <p className="text-sm font-semibold text-[#F5F7FA]">Continuar estudiando</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {studyHistory.map((material) => (
                <Link
                  key={material.id}
                  href={`/materials/${material.id}`}
                  className="tron-capsule min-w-56 shrink-0 rounded-xl p-4"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#00FFD5]">
                    {material.courseName}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-[#F5F7FA]">{material.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <LibraryAcademicExplorer materials={materials} />

          <aside className="space-y-6">
            <div className="ms-panel p-5">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
                <BookOpen size={13} />
                Búsqueda avanzada
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Encuentra organizadores IA, PDFs y cursos con sugerencias en tiempo real.
              </p>
              <div className="mt-4">
                <LibrarySearch compact />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
