import { createAdminClient } from "@/lib/supabase/admin";

export type MaterialAccess = {
  allowed: boolean;
  reason?: string;
  isPublic?: boolean;
};

export async function verifyMaterialAccess(
  materialId: string,
  userId: string | null | undefined,
): Promise<MaterialAccess> {
  const admin = createAdminClient();
  const { data: material, error } = await admin
    .schema("public")
    .from("materials")
    .select("id,is_public,user_id")
    .eq("id", materialId)
    .maybeSingle();

  if (error) throw error;
  if (!material) {
    return { allowed: false, reason: "Material no encontrado." };
  }

  if (material.is_public) {
    return { allowed: true, isPublic: true };
  }

  if (userId && material.user_id === userId) {
    return { allowed: true, isPublic: false };
  }

  return {
    allowed: false,
    reason: "No tienes acceso a este material. Inicia sesión o solicita acceso.",
  };
}
