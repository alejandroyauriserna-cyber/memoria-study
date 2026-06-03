import { AppShell } from "@/components/ui/shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { buildAiSuggestions } from "@/lib/home/build-suggestions";
import { buildRecentContinueItems } from "@/lib/home/build-recent-items";
import { parseCycleNumberFromLabel } from "@/lib/home/greeting";
import { getCoursesForCycle } from "@/lib/academic/helpers";
import { normalizeAcademicForWrite } from "@/lib/academic/normalize-academic";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { recordToMaterial } from "@/lib/materials/mapper";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { MaterialRecord } from "@/types/material";
import type { OrganizerRecord } from "@/types/organizer";

function countMaterialsThisWeek(rows: Array<{ created_at?: string }>): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return rows.filter((row) => {
    if (!row.created_at) return false;
    return new Date(row.created_at).getTime() >= weekAgo;
  }).length;
}

function estimateStudyHours(historyCount: number, organizersCount: number): number {
  return Math.min(48, Math.round(historyCount * 0.45 + organizersCount * 0.75 + 2));
}

export default async function DashboardPage() {
  let profileName = "Estudiante";
  let currentCycle = "Ciclo V";
  let currentCycleNumber = 5;
  let totalShared = 0;
  let totalOrganizers = 0;
  let materialsThisWeek = 0;
  let studyHoursEstimate = 2;
  let activeCoursesCount = getCoursesForCycle(5).length;
  const recentItems: ReturnType<typeof buildRecentContinueItems> = [];
  let suggestions = buildAiSuggestions([]);

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const admin = createAdminClient();
      const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { data: profileData },
        { data: materialsData },
        { data: organizersData },
        { data: historyData },
        { data: recentMaterialsData },
      ] = await Promise.all([
        admin
          .from("user_profiles")
          .select("full_name, current_cycle_label, current_cycle_number")
          .eq("user_id", user.id)
          .maybeSingle(),
        admin.from("materials").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        admin
          .from("organizers")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(8),
        admin
          .from("material_study_history")
          .select("opened_at, materials(*)")
          .eq("user_id", user.id)
          .order("opened_at", { ascending: false })
          .limit(8),
        admin
          .from("materials")
          .select("id, title, description, material_type, course_name, created_at")
          .eq("user_id", user.id)
          .gte("created_at", weekAgoIso),
      ]);

      profileName = profileData?.full_name ?? user.user_metadata?.full_name ?? "Estudiante";
      currentCycle = profileData?.current_cycle_label ?? "Ciclo V";
      currentCycleNumber =
        profileData?.current_cycle_number ?? parseCycleNumberFromLabel(currentCycle);
      activeCoursesCount = getCoursesForCycle(currentCycleNumber).length;

      const materials = (materialsData ?? []) as Array<{
        id: string;
        title: string;
        description: string;
        material_type: string;
        created_at?: string;
      }>;

      totalShared = materials.length;
      materialsThisWeek = countMaterialsThisWeek(materials);
      totalOrganizers = (organizersData ?? []).length;
      studyHoursEstimate = estimateStudyHours((historyData ?? []).length, totalOrganizers);

      const studyHistory = (historyData ?? [])
        .map((item) => {
          const materialsRow = item.materials as MaterialRecord | MaterialRecord[] | null;
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
        .filter((m): m is NonNullable<typeof m> => m !== null);

      const userMaterials = (materialsData ?? [])
        .map((record) => recordToMaterial(record as MaterialRecord))
        .filter((mat) =>
          normalizeAcademicForWrite({
            courseId: mat.courseId,
            courseName: mat.courseName,
            cycleNumber: mat.cycleNumber,
            cycleLabel: mat.cycleLabel,
          }),
        );

      recentItems.push(
        ...buildRecentContinueItems({
          studyHistory,
          userMaterials,
          organizers: (organizersData ?? []) as OrganizerRecord[],
        }),
      );

      const suggestionMaterials = [
        ...(recentMaterialsData ?? []),
        ...materials.slice(0, 1),
      ].map((m) => ({
        id: m.id as string,
        title: m.title as string,
        description: (m.description as string) ?? "",
        materialType: (m.material_type as string) ?? "pdf",
        courseName: (m as { course_name?: string }).course_name ?? currentCycle,
      }));

      suggestions = buildAiSuggestions(suggestionMaterials);
    }
  }

  return (
    <AppShell>
      <DashboardHome
        profileName={profileName}
        currentCycle={currentCycle}
        currentCycleNumber={currentCycleNumber}
        career={UNT_DERECHO.career}
        activeCoursesCount={activeCoursesCount}
        materialsThisWeek={materialsThisWeek}
        studyHoursEstimate={studyHoursEstimate}
        totalShared={totalShared}
        totalOrganizers={totalOrganizers}
        recentItems={recentItems}
        suggestions={suggestions}
      />
    </AppShell>
  );
}
