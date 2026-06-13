import { randomUUID } from "crypto";
import {
  buildTutorCacheKey,
  type TutorCacheScope,
} from "@/lib/guided-study/tutor-cache";
import { hashTutorQuestion } from "@/lib/guided-study/tutor-chat-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TutorChatMessage } from "@/types/guided-legal-study";

const MAX_MESSAGES_PER_SCOPE = 50;

export { hashTutorQuestion };

function parseMessages(raw: unknown): TutorChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is TutorChatMessage =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as TutorChatMessage).id === "string" &&
      typeof (item as TutorChatMessage).question === "string" &&
      typeof (item as TutorChatMessage).answer === "string",
  );
}

export async function loadServerTutorChat(
  userId: string,
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
): Promise<TutorChatMessage[]> {
  const admin = createAdminClient();
  const cacheKey = buildTutorCacheKey(scope, examOnly);

  const { data, error } = await admin
    .from("guided_study_tutor_chat")
    .select("messages, source_fingerprint")
    .eq("user_id", userId)
    .eq("material_id", materialId)
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return [];
    throw error;
  }

  if (!data || data.source_fingerprint !== fingerprint) return [];
  return parseMessages(data.messages);
}

export async function findCachedChatAnswer(
  userId: string,
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
  question: string,
): Promise<string | null> {
  const messages = await loadServerTutorChat(
    userId,
    materialId,
    scope,
    examOnly,
    fingerprint,
  );
  const hash = hashTutorQuestion(question);
  const match = [...messages].reverse().find((msg) => msg.questionHash === hash);
  return match?.answer ?? null;
}

export async function appendServerTutorChatMessage(
  userId: string,
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
  message: TutorChatMessage,
): Promise<TutorChatMessage[]> {
  const admin = createAdminClient();
  const cacheKey = buildTutorCacheKey(scope, examOnly);
  const now = new Date().toISOString();

  const existing = await loadServerTutorChat(
    userId,
    materialId,
    scope,
    examOnly,
    fingerprint,
  );

  const withoutDuplicate = existing.filter((item) => item.id !== message.id);
  const next = [...withoutDuplicate, message].slice(-MAX_MESSAGES_PER_SCOPE);

  const { error } = await admin.from("guided_study_tutor_chat").upsert(
    {
      user_id: userId,
      material_id: materialId,
      cache_key: cacheKey,
      source_fingerprint: fingerprint,
      messages: next,
      updated_at: now,
    },
    { onConflict: "user_id,material_id,cache_key" },
  );

  if (error) {
    if (error.code === "42P01") return next;
    throw error;
  }

  return next;
}

export function createTutorChatMessage(
  question: string,
  answer: string,
  fromCache = false,
): TutorChatMessage {
  return {
    id: randomUUID(),
    question: question.trim(),
    answer: answer.trim(),
    questionHash: hashTutorQuestion(question),
    createdAt: new Date().toISOString(),
    fromCache,
  };
}
