import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";

export function profileAvatarStoragePath(userId: string, ext = "png") {
  return `${userId}/avatar.${ext}`;
}

export function extensionForAvatarMime(mime: string) {
  if (mime.includes("svg")) return "svg";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "png";
}

function mapAvatarUploadError(message: string): string {
  if (/bucket not found/i.test(message)) {
    return "Falta configurar el almacén de avatares en Supabase. Ejecuta la migración 20260624_profile_avatars.sql en el SQL Editor de tu proyecto.";
  }
  return message;
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
  if (error) throw new Error(mapAvatarUploadError(error.message));

  return {
    storagePath,
    publicUrl: `${publicProfileAvatarUrl(storagePath)}?v=${Date.now()}`,
  };
}

export async function removeProfileAvatar(userId: string) {
  const admin = createAdminClient();
  const paths = ["png", "jpg", "webp", "svg"].map((ext) => profileAvatarStoragePath(userId, ext));
  await admin.storage.from(PROFILE_AVATAR_BUCKET).remove(paths);
}
