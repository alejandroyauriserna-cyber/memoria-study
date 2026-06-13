import {
  buildTutorCacheKey,
  type TutorCacheScope,
} from "@/lib/guided-study/tutor-cache";
import { hashTutorQuestion } from "@/lib/guided-study/tutor-chat-hash";
import type { TutorChatMessage } from "@/types/guided-legal-study";

const CHAT_PREFIX = "memoria-tutor-chat:";

type ChatStore = Record<string, TutorChatMessage[]>;

function scopeStorageKey(scope: TutorCacheScope, examOnly: boolean, fingerprint: string) {
  return `${buildTutorCacheKey(scope, examOnly)}:${fingerprint}`;
}

function loadStore(materialId: string): ChatStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${CHAT_PREFIX}${materialId}`);
    if (!raw) return {};
    return JSON.parse(raw) as ChatStore;
  } catch {
    return {};
  }
}

function saveStore(materialId: string, store: ChatStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${CHAT_PREFIX}${materialId}`, JSON.stringify(store));
}

export function loadLocalTutorChat(
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
): TutorChatMessage[] {
  const store = loadStore(materialId);
  return store[scopeStorageKey(scope, examOnly, fingerprint)] ?? [];
}

export function saveLocalTutorChat(
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
  messages: TutorChatMessage[],
) {
  const store = loadStore(materialId);
  store[scopeStorageKey(scope, examOnly, fingerprint)] = messages;
  saveStore(materialId, store);
}

export function findLocalChatAnswer(
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
  question: string,
): string | null {
  const messages = loadLocalTutorChat(materialId, scope, examOnly, fingerprint);
  const hash = hashTutorQuestion(question);
  const match = [...messages].reverse().find((msg) => msg.questionHash === hash);
  return match?.answer ?? null;
}

export function appendLocalTutorChatMessage(
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
  message: TutorChatMessage,
): TutorChatMessage[] {
  const existing = loadLocalTutorChat(materialId, scope, examOnly, fingerprint);
  const next = [...existing.filter((item) => item.id !== message.id), message].slice(-50);
  saveLocalTutorChat(materialId, scope, examOnly, fingerprint, next);
  return next;
}

export function createClientTutorChatMessage(
  question: string,
  answer: string,
  fromCache = false,
): TutorChatMessage {
  return {
    id: crypto.randomUUID(),
    question: question.trim(),
    answer: answer.trim(),
    questionHash: hashTutorQuestion(question),
    createdAt: new Date().toISOString(),
    fromCache,
  };
}
