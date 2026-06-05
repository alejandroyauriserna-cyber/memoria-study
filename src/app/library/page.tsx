import Link from "next/link";
import { BookOpen, Layers3, LibraryBig, Search, Sparkles } from "lucide-react";
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
        <div className="ms-home mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-3xl flex-col items-center justify-center px-4 text-center sm:px-6">
          <p className="ms-home-kicker">
            <Sparkles size={14} /> Biblioteca
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#F5F7FA]">
            Biblioteca no disponible
          </h1>
          <Link href="/" className="tron-btn-primary mt-8 inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
            Volver al inicio
          </Link>
        </div>
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
      <div className="ms-home library-page mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="library-page-hero">
          <div className="library-page-hero-copy">
            <p className="ms-home-kicker">
              <Sparkles size={14} /> Biblioteca academica inteligente
            </p>
            <h1>Todo tu conocimiento juridico, perfectamente organizado.</h1>
            <p className="ms-home-lead">
              Explora la malla oficial por ciclo y curso, encuentra materiales al instante y abre cada
              recurso en un espacio de estudio enfocado.
            </p>
          </div>

          <div className="library-page-stats" aria-label="Resumen de la biblioteca">
            <div className="library-page-stat">
              <span className="library-page-stat-icon">
                <LibraryBig size={18} />
              </span>
              <span>
                <strong>{materials.length}</strong>
                <em>Materiales</em>
              </span>
            </div>
            <div className="library-page-stat">
              <span className="library-page-stat-icon">
                <Layers3 size={18} />
              </span>
              <span>
                <strong>10</strong>
                <em>Ciclos UNT</em>
              </span>
            </div>
            <div className="library-page-stat">
              <span className="library-page-stat-icon">
                <Search size={18} />
              </span>
              <span>
                <strong>Instantanea</strong>
                <em>Busqueda</em>
              </span>
            </div>
            <div className="library-page-stat">
              <span className="library-page-stat-icon">
                <BookOpen size={18} />
              </span>
              <span>
                <strong>2021</strong>
                <em>Malla oficial</em>
              </span>
            </div>
          </div>
        </header>

        <LibraryPremiumWorkspace
          materials={materials}
          studyHistory={studyHistory}
          initialFavoriteIds={favoriteIds}
          isLoggedIn={Boolean(user)}
        />
      </div>
    </AppShell>
  );
}
