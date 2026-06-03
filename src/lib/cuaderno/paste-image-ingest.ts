import { createFloatingImage } from "@/lib/cuaderno/floating-image";
import {
  createStickerFromLibrary,
  type DecorationObject,
} from "@/lib/cuaderno/decoration-objects";
import type { UserStickerRecord } from "@/types/cuaderno-stickers";

export const STICKER_LIBRARY_ADDED_EVENT = "cuaderno-sticker-library-added";

export function pastedImageName(file?: File): string {
  const fromFile = file?.name?.replace(/\.[^.]+$/, "")?.trim();
  if (fromFile) return fromFile.slice(0, 80);
  const when = new Date().toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Pegado ${when}`.slice(0, 80);
}

export function notifyStickerLibraryUpdated(sticker: UserStickerRecord): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(STICKER_LIBRARY_ADDED_EVENT, { detail: sticker }),
  );
}

/** Sube la imagen a «Mis stickers» (Supabase). Devuelve null si no hay sesión o falla la red. */
export async function saveImageToUserLibrary(
  imageDataUrl: string,
  name: string,
): Promise<UserStickerRecord | null> {
  if (!imageDataUrl.startsWith("data:image/")) return null;
  try {
    const res = await fetch("/api/cuaderno/stickers/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageDataUrl,
        name: name.trim().slice(0, 80) || "Imagen pegada",
      }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    const sticker = data.sticker as UserStickerRecord | undefined;
    if (!sticker?.id) return null;
    notifyStickerLibraryUpdated(sticker);
    return sticker;
  } catch {
    return null;
  }
}

/**
 * Estilo Canva: primero guarda en biblioteca del usuario, luego devuelve decoración para la hoja.
 * Si no hay sesión, coloca imagen flotante local (data URL).
 */
export async function ingestPastedImageForCanvas(params: {
  dataUrl: string;
  name: string;
  at: { x: number; y: number };
}): Promise<{
  item: DecorationObject;
  savedToLibrary: boolean;
  sticker?: UserStickerRecord;
}> {
  const sticker = await saveImageToUserLibrary(params.dataUrl, params.name);
  if (sticker) {
    const item = createStickerFromLibrary(
      sticker.id,
      sticker.imageUrl,
      sticker.name,
      params.at,
    );
    return { item, savedToLibrary: true, sticker };
  }

  const item = createFloatingImage(params.dataUrl, params.at);
  return { item, savedToLibrary: false };
}
