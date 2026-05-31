import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { recordToMaterial } from "@/lib/materials/mapper";
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
  const course = UNT_DERECHO.years
    .flatMap((year) => year.cycles)
    .flatMap((cycle) => cycle.courses.map((courseItem) => ({
      ...courseItem,
      cycleNumber: cycle.number,
      cycleLabel: cycle.label,
    })))
    .find((item) => item.id === courseId);

  if (!course) {
    notFound();
  }

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

  console.log("materials", data);
  console.log("error", error);

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
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">{course.cycleLabel}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{course.name}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Material académico compartido para este curso. Accede a archivos, guías y casos prácticos.
            </p>
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
            No hay materiales compartidos para este curso todavía.
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
