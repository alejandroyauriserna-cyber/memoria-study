import { createAdminClient } from "@/lib/supabase/admin";

export const STICKER_BUCKET = "cuaderno-stickers";
const SIGNED_URL_TTL_SEC = 60 * 60 * 24; // 24 h

/** Ruta en bucket privado: {userId}/{stickerId}.png */
export function stickerStoragePath(userId: string, stickerId: string) {
  return `${userId}/${stickerId}.png`;
}

export function parseStoragePath(imageUrl: string): string | null {
  if (!imageUrl) return null;
  if (!imageUrl.includes("://")) return imageUrl;
  const m = imageUrl.match(/cuaderno-stickers\/(.+)$/);
  return m?.[1] ?? null;
}

export async function uploadStickerBuffer(
  userId: string,
  stickerId: string,
  buffer: Buffer,
  contentType = "image/png",
): Promise<{ storagePath: string }> {
  const admin = createAdminClient();
  const storagePath = stickerStoragePath(userId, stickerId);
  const { error } = await admin.storage.from(STICKER_BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return { storagePath };
}

export async function signedStickerUrl(storagePath: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(STICKER_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "No se pudo firmar URL");
  return data.signedUrl;
}

export async function removeStickerFiles(paths: string[]) {
  if (!paths.length) return;
  const admin = createAdminClient();
  await admin.storage.from(STICKER_BUCKET).remove(paths);
}

export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Data URL inválida");
  return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
}
