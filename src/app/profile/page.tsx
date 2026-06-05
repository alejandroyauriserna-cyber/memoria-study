import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { LearningHub } from "@/components/profile/learning-hub";
import { fetchServerLearningStats } from "@/lib/profile/server-learning-stats";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type {
  ProfileStudySettings,
  ProfileTheme,
} from "@/lib/profile/study-preferences-storage";

function aggregateCourseCounts(
  rows: Array<{ materials: { course_name: string } | null }>,
): Array<{ courseName: string; count: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = row.materials?.course_name;
    if (!name) continue;
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([courseName, count]) => ({ courseName, count }))
    .sort((a, b) => b.count - a.count);
}

export default async function ProfilePage() {
  if (!hasSupabaseEnv()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const admin = createAdminClient();
  const [serverStats, { data: profileData }, { count: organizersCount }, { data: studyHistory }] =
    await Promise.all([
      fetchServerLearningStats(user.id),
      admin
        .from("user_profiles")
        .select("full_name, current_cycle_number, current_cycle_label, academic_context")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("organizers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      admin
        .from("material_study_history")
        .select("material_id, materials(course_name)")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false })
        .limit(50),
    ]);

  const profile = profileData ?? null;
  const fullName =
    profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "Estudiante UNT";
  const currentCycleLabel =
    profile?.current_cycle_label ??
    (user.user_metadata?.current_cycle_label as string | undefined) ??
    "Ciclo V";
  const currentCycleNumber =
    profile?.current_cycle_number ??
    (user.user_metadata?.current_cycle_number as number | undefined) ??
    null;

  const topCourses = aggregateCourseCounts(
    (studyHistory ?? []).map((row) => {
      const materials = row.materials as { course_name: string } | { course_name: string }[] | null;
      const material = Array.isArray(materials) ? materials[0] ?? null : materials;
      return { materials: material };
    }),
  );

  const academicContext = (profile?.academic_context ?? {}) as Record<string, unknown>;

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <LearningHub
          email={user.email}
          fullName={fullName}
          currentCycleLabel={currentCycleLabel}
          currentCycleNumber={currentCycleNumber}
          organizersCount={organizersCount ?? 0}
          serverStats={serverStats}
          topCourses={topCourses}
          initialSettings={{
            goals: Array.isArray(academicContext.goals) ? academicContext.goals : undefined,
            preferences:
              academicContext.studyPreferences &&
              typeof academicContext.studyPreferences === "object"
                ? (academicContext.studyPreferences as ProfileStudySettings["preferences"])
                : undefined,
            theme:
              typeof academicContext.theme === "string"
                ? (academicContext.theme as ProfileTheme)
                : undefined,
          }}
        />
      </section>
    </AppShell>
  );
}
