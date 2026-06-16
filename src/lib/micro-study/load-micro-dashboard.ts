import { buildAcademicProgress } from "@/lib/micro-study/academic-progress";
import { buildMicroSessionPack, dayKey } from "@/lib/micro-study/build-micro-session";
import { pickDailyConceptFromUserMaterials } from "@/lib/micro-study/pick-daily-concept";
import { pickDailySentenciaForUser } from "@/lib/micro-study/pick-daily-sentencia";
import {
  computeActivityScore,
  resolveProfessionalStage,
} from "@/lib/micro-study/professional-route";
import type { MicroActivityMetrics, MicroStudyDashboardProps } from "@/types/micro-study";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Flashcard, QuizQuestion } from "@/types/study";

async function fetchMicroActivityMetrics(userId: string): Promise<MicroActivityMetrics> {
  const admin = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("micro_study_activity")
    .select("activity_type, activity_date")
    .eq("user_id", userId)
    .gte("activity_date", weekAgo);

  if (error) {
    if (error.code === "42P01") {
      return {
        activeDaysThisWeek: 0,
        conceptsReviewed: 0,
        sentenciasRead: 0,
        microSessionsCompleted: 0,
      };
    }
    throw error;
  }

  const rows = data ?? [];
  const activeDays = new Set(rows.map((r) => r.activity_date as string)).size;

  return {
    activeDaysThisWeek: activeDays,
    conceptsReviewed: rows.filter((r) => r.activity_type === "concept_reviewed").length,
    sentenciasRead: rows.filter((r) => r.activity_type === "sentencia_read").length,
    microSessionsCompleted: rows.filter((r) => r.activity_type === "micro_session_completed")
      .length,
  };
}

export async function loadMicroStudyDashboardProps(
  userId: string,
): Promise<MicroStudyDashboardProps> {
  const admin = createAdminClient();
  const today = dayKey();

  const [
    { data: guidedSessions },
    { data: materials },
    { data: decksData },
    { data: tutorCache },
    activityMetrics,
  ] = await Promise.all([
    admin
      .from("guided_study_sessions")
      .select("understood_pages, material_id, last_updated")
      .eq("user_id", userId),
    admin
      .from("materials")
      .select("id, course_name, title")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("decks")
      .select("id, title, flashcards, quiz, academic_context")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("guided_study_tutor_cache")
      .select("material_id, result")
      .eq("user_id", userId)
      .order("cached_at", { ascending: false })
      .limit(12),
    fetchMicroActivityMetrics(userId),
  ]);

  const materialRows = (materials ?? []).map((m) => ({
    id: m.id as string,
    course_name: (m.course_name as string) ?? "General",
    title: m.title as string,
  }));

  const courseNames = materialRows.map((m) => m.course_name).filter(Boolean);

  const [dailyConcept, dailySentencia] = await Promise.all([
    Promise.resolve(
      pickDailyConceptFromUserMaterials({
        userId,
        dateKey: today,
        tutorCacheRows: (tutorCache ?? []) as Parameters<
          typeof pickDailyConceptFromUserMaterials
        >[0]["tutorCacheRows"],
        materials: materialRows,
      }),
    ),
    pickDailySentenciaForUser({ userId, dateKey: today, courseNames }),
  ]);

  const sessions = guidedSessions ?? [];
  const academicProgress = buildAcademicProgress(sessions, materialRows);

  const activityScore = computeActivityScore({
    pagesUnderstood: sessions.reduce(
      (sum, s) => sum + ((s.understood_pages as number[] | null)?.length ?? 0),
      0,
    ),
    microSessionsCompleted: activityMetrics.microSessionsCompleted,
    conceptsReviewed: activityMetrics.conceptsReviewed,
    sentenciasRead: activityMetrics.sentenciasRead,
    studyStreakDays: activityMetrics.activeDaysThisWeek,
  });

  const { current: professionalStage, next: nextProfessionalStage } =
    resolveProfessionalStage(activityScore);

  return {
    dailyConcept,
    dailySentencia,
    academicProgress,
    professionalStage,
    nextProfessionalStage,
    activityScore,
    activityMetrics,
  };
}

export async function loadMicroSessionForUser(
  userId: string,
  focusTopic?: string | null,
  mode?: "default" | "daily-concept",
) {
  const admin = createAdminClient();
  const today = dayKey();

  const [{ data: decksData }, { data: tutorCache }, { data: sessions }, { data: materials }] =
    await Promise.all([
    admin
      .from("decks")
      .select("id, title, flashcards, quiz, academic_context")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("guided_study_tutor_cache")
      .select("material_id, result")
      .eq("user_id", userId)
      .order("cached_at", { ascending: false })
      .limit(12),
    admin
      .from("guided_study_sessions")
      .select("material_id, last_updated, materials(course_name)")
      .eq("user_id", userId)
      .order("last_updated", { ascending: false })
      .limit(1),
    admin
      .from("materials")
      .select("course_name, title")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const lastSession = sessions?.[0];
  const mat = lastSession?.materials as { course_name?: string } | { course_name?: string }[] | null;
  const courseFromSession = Array.isArray(mat) ? mat[0]?.course_name : mat?.course_name;

  const deckRows = (decksData ?? []).map((d) => {
    const academic = d.academic_context as { courseName?: string } | null;
    return {
      id: d.id as string,
      title: d.title as string,
      course_name: academic?.courseName,
      flashcards: (d.flashcards as Flashcard[]) ?? [],
      quiz: (d.quiz as QuizQuestion[]) ?? [],
    };
  });

  if (mode === "daily-concept") {
    const materialRows = (materials ?? []).map((m) => ({
      course_name: (m.course_name as string) ?? "Tu biblioteca",
    }));
    const daily = pickDailyConceptFromUserMaterials({
      userId,
      dateKey: today,
      tutorCacheRows: (tutorCache ?? []) as Parameters<
        typeof pickDailyConceptFromUserMaterials
      >[0]["tutorCacheRows"],
      materials: materialRows,
    });
    return {
      id: `daily-concept-${today}`,
      title: "Concepto del día",
      estimatedMinutes: 1,
      concepts: [
        {
          id: daily.id,
          concept: daily.title,
          explanation: daily.explanation,
          example: daily.example,
        },
      ],
      flashcards: [],
      quiz: null,
      sourceCourse: daily.courseName,
    };
  }

  return buildMicroSessionPack({
    userId,
    dateKey: today,
    tutorCacheRows: (tutorCache ?? []) as Parameters<
      typeof buildMicroSessionPack
    >[0]["tutorCacheRows"],
    deckRows,
    focusCourseName: focusTopic ?? courseFromSession ?? null,
  });
}
