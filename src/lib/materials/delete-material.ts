import type { SupabaseClient } from "@supabase/supabase-js";

export const MATERIALS_STORAGE_BUCKET = "shared-materials";

export function materialStoragePathFromFileUrl(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    const marker = `/storage/v1/object/public/${MATERIALS_STORAGE_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export async function deleteMaterialById(
  admin: SupabaseClient,
  materialId: string,
): Promise<{ found: boolean }> {
  const { data: material, error: selectError } = await admin
    .from("materials")
    .select("id,file_url")
    .eq("id", materialId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!material) return { found: false };

  const storagePath = materialStoragePathFromFileUrl(material.file_url);
  if (storagePath) {
    const { error: storageError } = await admin.storage
      .from(MATERIALS_STORAGE_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      console.warn("[materials/delete] storage remove failed:", storageError.message);
    }
  }

  const { error: deleteError } = await admin.from("materials").delete().eq("id", materialId);
  if (deleteError) throw deleteError;

  return { found: true };
}
