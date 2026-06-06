import { buildAiSuggestions } from "@/lib/home/build-suggestions";
import { buildRecentContinueItems } from "@/lib/home/build-recent-items";
import type { MemoriaDashboardProps } from "@/lib/home/dashboard-types";
import { getCoursesForCycle } from "@/lib/academic/helpers";
import { normalizeAcademicForWrite } from "@/lib/academic/normalize-academic";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { recordToMaterial } from "@/lib/materials/mapper";
import { formatStudyHours } from "@/lib/profile/aggregate-learning-stats";
import { estimateStudyMinutesFromServer } from "@/lib/profile/estimate-study-minutes";
import { isNewUser } from "@/lib/profile/is-new-user";
import { resolveUserCycle } from "@/lib/profile/resolve-user-cycle";
import { fetchServerLearningStats } from "@/lib/profile/server-learning-stats";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import type { MaterialRecord } from "@/types/material";
import type { OrganizerRecord } from "@/types/organizer";

export async function loadMemoriaDashboardProps(user: User): Promise<MemoriaDashboardProps> {
  const admin = createAdminClient();
  const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: profileData },
    { count: materialsCount },
    { count: weeklyMaterialsCount },
    { data: organizersData },
    { data: historyData },
    { data: recentMaterialsData },
    learningStats,
  ] = await Promise.all([
    admin
      .from("user_profiles")
      .select("full_name, current_cycle_label, current_cycle_number")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin.from("materials").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    admin
      .from("materials")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", weekAgoIso),
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
      .gte("created_at", weekAgoIso)
      .order("created_at", { ascending: false })
      .limit(5),
    fetchServerLearningStats(user.id),
  ]);

  const profileName = profileData?.full_name ?? user.user_metadata?.full_name ?? "Estudiante";
  const { cycleLabel: currentCycle, cycleNumber: currentCycleNumber } = resolveUserCycle(
    profileData,
    user.user_metadata,
  );

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

  const { data: topMaterialsData } = await admin
    .from("materials")
    .select("id, title, description, material_type, course_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const userMaterials = (topMaterialsData ?? [])
    .map((record) => recordToMaterial(record as MaterialRecord))
    .filter((mat) =>
      normalizeAcademicForWrite({
        courseId: mat.courseId,
        courseName: mat.courseName,
        cycleNumber: mat.cycleNumber,
        cycleLabel: mat.cycleLabel,
      }),
    );

  const recentItems = buildRecentContinueItems({
    studyHistory,
    userMaterials,
    organizers: (organizersData ?? []) as OrganizerRecord[],
  });

  const suggestionMaterials = (recentMaterialsData ?? []).map((m) => ({
    id: m.id as string,
    title: m.title as string,
    description: (m.description as string) ?? "",
    materialType: (m.material_type as string) ?? "pdf",
    courseName: (m as { course_name?: string }).course_name ?? currentCycle ?? UNT_DERECHO.career,
  }));

  return {
    profileName,
    currentCycle,
    currentCycleNumber,
    career: UNT_DERECHO.career,
    activeCoursesCount: currentCycleNumber ? getCoursesForCycle(currentCycleNumber).length : 0,
    materialsThisWeek: weeklyMaterialsCount ?? 0,
    studyHoursLabel: formatStudyHours(estimateStudyMinutesFromServer(learningStats)),
    totalShared: materialsCount ?? 0,
    totalOrganizers: learningStats.organizersCreated,
    studyStreakDays: learningStats.studyStreakDays,
    pagesUnderstood: learningStats.pagesUnderstood,
    showOnboarding: isNewUser(learningStats),
    recentItems,
    suggestions: buildAiSuggestions(suggestionMaterials),
  };
}
