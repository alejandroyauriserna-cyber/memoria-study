import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { LibraryPremiumWorkspace } from "@/components/library/library-premium-workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { normalizeAcademicForWrite } from "@/lib/academic/normalize-academic";
import { recordToMaterial } from "@/lib/materials/mapper";
import type { MaterialRecord } from "@/types/material";

function materialOnOfficialMalla(mat: ReturnType<typeof recordToMaterial>): boolean {
  return (
    normalizeAcademicForWrite({
      courseId: mat.courseId,
      courseName: mat.courseName,
      cycleNumber: mat.cycleNumber,
      cycleLabel: mat.cycleLabel,
    }) !== null
  );
}

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

  const materials = (data ?? [])
    .map((record) => recordToMaterial(record as MaterialRecord))
    .filter(materialOnOfficialMalla);

  let favoriteIds: string[] = [];

  if (user) {
    const { data: favData } = await admin
      .schema("public")
      .from("favorites")
      .select("material_id")
      .eq("user_id", user.id);

    favoriteIds = (favData ?? []).map((item) => item.material_id as string);
  }

  const { data: historyData } = user
    ? await admin
        .schema("public")
        .from("material_study_history")
        .select("opened_at, materials(*)")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false })
        .limit(12)
    : { data: [] };

  const studyHistory = (historyData ?? [])
    .filter((item) => item.materials)
    .map((item) => {
      const materialsRow = item.materials as MaterialRecord | MaterialRecord[];
      const record = Array.isArray(materialsRow) ? materialsRow[0] : materialsRow;
      if (!record) return null;
      const mat = recordToMaterial(record);
      const official = normalizeAcademicForWrite({
        courseId: mat.courseId,
        courseName: mat.courseName,
        cycleNumber: mat.cycleNumber,
        cycleLabel: mat.cycleLabel,
      });
      if (!official) return null;
      return {
        ...mat,
        courseId: official.courseId,
        courseName: official.courseName,
        cycleNumber: official.cycleNumber,
        cycleLabel: official.cycleLabel,
        lastOpenedAt: item.opened_at as string,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <AppShell>
      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
              Biblioteca académica premium
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#F5F7FA] md:text-4xl">
              Ciclo → Curso → Material
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Materiales públicos de la malla curricular de Derecho UNT (2021). Solo se listan apuntes
              clasificados en un curso oficial del plan.
            </p>
          </div>
        </div>

        <LibraryPremiumWorkspace
          materials={materials}
          studyHistory={studyHistory}
          initialFavoriteIds={favoriteIds}
          isLoggedIn={Boolean(user)}
        />
      </section>
    </AppShell>
  );
}
