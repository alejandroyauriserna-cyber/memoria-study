import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { findCourseById } from "@/lib/academic/helpers";
import { preparePublicMaterialCatalog } from "@/lib/materials/prepare-public-material-catalog";
import { MaterialCard } from "@/components/library/material-card";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function CourseLibraryPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  if (!hasSupabaseEnv()) {
    notFound();
  }

  const { courseId } = await params;
  const located = findCourseById(courseId);

  if (!located) {
    notFound();
  }

  const course = {
    ...located.course,
    cycleNumber: located.cycle.cycleNumber,
    cycleLabel: located.cycle.cycleLabel,
  };

  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await admin
    .from("materials")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });


  let favoriteIds = new Set<string>();

  if (user) {
    const { data: favorites } = await admin
      .schema("public")
      .from("favorites")
      .select("material_id")
      .eq("user_id", user.id);

    favoriteIds = new Set((favorites ?? []).map((favorite) => favorite.material_id as string));
  }

  const { catalog, redirects } = preparePublicMaterialCatalog((data ?? []) as MaterialRecord[]);

  const materials = catalog.map((material) => ({
    ...material,
    isFavorite: material.id
      ? favoriteIds.has(material.id) ||
        Array.from(redirects.entries()).some(
          ([duplicateId, winnerId]) => winnerId === material.id && favoriteIds.has(duplicateId),
        )
      : false,
  }));

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">{course.cycleLabel}</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#F5F7FA]">{course.name}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Material compartido para este curso. Accede a archivos, guías y casos prácticos.
            </p>
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="tron-panel rounded-2xl p-8 text-center text-muted-foreground">
            No hay materiales compartidos para este curso todavía.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
