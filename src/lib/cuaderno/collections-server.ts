import { createAdminClient } from "@/lib/supabase/admin";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";
import type { SavedAiItem, SmartCollectionSlug } from "@/lib/cuaderno/smart-collections";

export type CuadernoCollectionsSnapshot = {
  favoriteClassIds: string[];
  examItems: SavedAiItem[];
  summaryItems: SavedAiItem[];
};

export type CourseCoverRecord = {
  courseId: string;
  coverArt: CourseCoverArt;
  updatedAt: string;
};

function rowToAiItem(row: {
  id: string;
  class_id: string | null;
  course_name: string;
  class_title: string | null;
  title: string;
  content: string;
  created_at: string;
}): SavedAiItem {
  return {
    id: row.id,
    classId: row.class_id ?? undefined,
    courseName: row.course_name,
    classTitle: row.class_title ?? undefined,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function loadCollectionsForUser(userId: string): Promise<CuadernoCollectionsSnapshot> {
  const admin = createAdminClient();

  const [favoritesRes, itemsRes] = await Promise.all([
    admin.from("cuaderno_favorites").select("class_id").eq("user_id", userId),
    admin
      .from("cuaderno_ai_items")
      .select("id, kind, class_id, course_name, class_title, title, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(160),
  ]);

  if (favoritesRes.error) throw favoritesRes.error;
  if (itemsRes.error) throw itemsRes.error;

  const examItems: SavedAiItem[] = [];
  const summaryItems: SavedAiItem[] = [];

  for (const row of itemsRes.data ?? []) {
    const item = rowToAiItem(row);
    if (row.kind === "exam") examItems.push(item);
    else summaryItems.push(item);
  }

  return {
    favoriteClassIds: (favoritesRes.data ?? []).map((r) => r.class_id as string),
    examItems,
    summaryItems,
  };
}

export async function toggleFavoriteForUser(
  userId: string,
  classId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("cuaderno_favorites")
    .select("class_id")
    .eq("user_id", userId)
    .eq("class_id", classId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("cuaderno_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("class_id", classId);
    if (error) throw error;
    return false;
  }

  const { error } = await admin.from("cuaderno_favorites").insert({
    user_id: userId,
    class_id: classId,
  });
  if (error) throw error;
  return true;
}

export async function saveAiItemForUser(
  userId: string,
  kind: "exam" | "summary",
  item: Omit<SavedAiItem, "id" | "createdAt"> & { createdAt?: string },
): Promise<SavedAiItem> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cuaderno_ai_items")
    .insert({
      user_id: userId,
      kind,
      class_id: item.classId ?? null,
      course_name: item.courseName,
      class_title: item.classTitle ?? null,
      title: item.title,
      content: item.content,
      created_at: item.createdAt ?? new Date().toISOString(),
    })
    .select("id, class_id, course_name, class_title, title, content, created_at")
    .single();

  if (error) throw error;
  return rowToAiItem(data);
}

export async function migrateLocalCollections(
  userId: string,
  payload: {
    favoriteClassIds?: string[];
    examItems?: SavedAiItem[];
    summaryItems?: SavedAiItem[];
  },
): Promise<void> {
  const admin = createAdminClient();

  for (const classId of payload.favoriteClassIds ?? []) {
    const { error } = await admin.from("cuaderno_favorites").upsert(
      { user_id: userId, class_id: classId },
      { onConflict: "user_id,class_id", ignoreDuplicates: true },
    );
    if (error && !error.message.includes("duplicate")) throw error;
  }

  for (const item of payload.examItems ?? []) {
    await saveAiItemForUser(userId, "exam", item).catch(() => undefined);
  }
  for (const item of payload.summaryItems ?? []) {
    await saveAiItemForUser(userId, "summary", item).catch(() => undefined);
  }
}

export async function loadCourseCoversForUser(userId: string): Promise<CourseCoverRecord[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cuaderno_course_covers")
    .select("course_id, cover_art, updated_at")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    courseId: row.course_id as string,
    coverArt: row.cover_art as CourseCoverArt,
    updatedAt: row.updated_at as string,
  }));
}

export async function getCourseCoverForUser(
  userId: string,
  courseId: string,
): Promise<CourseCoverArt | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cuaderno_course_covers")
    .select("cover_art")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw error;
  return data?.cover_art ? (data.cover_art as CourseCoverArt) : null;
}

export async function saveCourseCoverForUser(
  userId: string,
  courseId: string,
  coverArt: CourseCoverArt,
  source: "ai" | "manual" = "ai",
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("cuaderno_course_covers").upsert(
    {
      user_id: userId,
      course_id: courseId,
      cover_art: coverArt,
      source,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" },
  );
  if (error) throw error;
}

export function countFromSnapshot(
  snapshot: CuadernoCollectionsSnapshot,
  slug: SmartCollectionSlug,
): number {
  if (slug === "favoritos") return snapshot.favoriteClassIds.length;
  if (slug === "examenes") return snapshot.examItems.length;
  return snapshot.summaryItems.length;
}
