import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";

export function profileAvatarStoragePath(userId: string, ext = "png") {
  return `${userId}/avatar.${ext}`;
}

export function extensionForAvatarMime(mime: string) {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "png";
}

export function publicProfileAvatarUrl(storagePath: string) {
  const base = env.supabaseUrl?.replace(/\/$/, "");
  if (!base) throw new Error("Supabase URL no configurada.");
  return `${base}/storage/v1/object/public/${PROFILE_AVATAR_BUCKET}/${storagePath}`;
}

export async function uploadProfileAvatarBuffer(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ storagePath: string; publicUrl: string }> {
  const admin = createAdminClient();
  const ext = extensionForAvatarMime(contentType);
  const storagePath = profileAvatarStoragePath(userId, ext);

  const { error } = await admin.storage.from(PROFILE_AVATAR_BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);

  return {
    storagePath,
    publicUrl: `${publicProfileAvatarUrl(storagePath)}?v=${Date.now()}`,
  };
}

export async function removeProfileAvatar(userId: string) {
  const admin = createAdminClient();
  const paths = ["png", "jpg", "webp"].map((ext) => profileAvatarStoragePath(userId, ext));
  await admin.storage.from(PROFILE_AVATAR_BUCKET).remove(paths);
}

export function buildProfileAvatarPrompt(userPrompt: string) {
  const subject = userPrompt.replace(/[<>&"']/g, "").trim().slice(0, 180);
  return `Create ONE fun profile avatar portrait for a university law student app (MemoriaStudy).
Style: vibrant, friendly, modern digital illustration, slightly playful but respectful.
Subject: ${subject}
Requirements: single centered character or mascot, shoulders-up or bust portrait, circular-crop friendly composition, clean background (soft gradient or simple color, not transparent), no text, no watermark, no collage, no NSFW, high quality, expressive face.`;
}
