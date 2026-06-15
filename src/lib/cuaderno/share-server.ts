import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { CuadernoCollaborator, CuadernoSharePermission } from "@/types/cuaderno";

export function buildCuadernoShareUrl(shareToken: string) {
  return `${env.appUrl.replace(/\/$/, "")}/cuaderno/compartido/${shareToken}`;
}

export async function enableCuadernoShare(
  classId: string,
  ownerId: string,
  permission: CuadernoSharePermission,
): Promise<{ shareToken: string; shareUrl: string }> {
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("cuaderno_classes")
    .select("id, user_id, share_token")
    .eq("id", classId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing || existing.user_id !== ownerId) {
    throw new Error("Clase no encontrada.");
  }

  const shareToken =
    (existing.share_token as string | null) ?? randomBytes(16).toString("hex");

  const { error: updateError } = await admin
    .from("cuaderno_classes")
    .update({
      share_token: shareToken,
      is_shared: true,
      share_permission: permission,
    })
    .eq("id", classId);

  if (updateError) throw updateError;

  return { shareToken, shareUrl: buildCuadernoShareUrl(shareToken) };
}

export async function disableCuadernoShare(classId: string, ownerId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("cuaderno_classes")
    .update({ is_shared: false })
    .eq("id", classId)
    .eq("user_id", ownerId);

  if (error) throw error;
}

export async function joinCuadernoByToken(userId: string, token: string) {
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("cuaderno_classes")
    .select("id, user_id, share_permission, is_shared")
    .eq("share_token", token)
    .eq("is_shared", true)
    .maybeSingle();

  if (error) throw error;
  if (!row) throw new Error("Enlace no válido o expirado.");

  if (row.user_id === userId) {
    return { classId: row.id as string, alreadyMember: true };
  }

  const role = row.share_permission === "edit" ? "editor" : "viewer";

  const { error: upsertError } = await admin.from("cuaderno_class_collaborators").upsert(
    {
      class_id: row.id,
      user_id: userId,
      role,
      invited_by: row.user_id,
    },
    { onConflict: "class_id,user_id" },
  );

  if (upsertError) throw upsertError;

  return { classId: row.id as string, alreadyMember: false, role };
}

export async function listCollaboratorsForClass(
  classId: string,
  ownerId: string,
): Promise<CuadernoCollaborator[]> {
  const admin = createAdminClient();

  const { data: ownerCheck } = await admin
    .from("cuaderno_classes")
    .select("user_id")
    .eq("id", classId)
    .maybeSingle();

  if (!ownerCheck || ownerCheck.user_id !== ownerId) {
    throw new Error("Sin permiso.");
  }

  const { data: rows, error } = await admin
    .from("cuaderno_class_collaborators")
    .select("class_id, user_id, role, invited_by, joined_at")
    .eq("class_id", classId);

  if (error) throw error;
  if (!rows?.length) return [];

  const userIds = rows.map((r) => r.user_id as string);
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("user_id, full_name")
    .in("user_id", userIds);

  const nameByUser = new Map(
    (profiles ?? []).map((p) => [p.user_id as string, p.full_name as string | null]),
  );

  return rows.map((row) => ({
    classId: row.class_id as string,
    userId: row.user_id as string,
    role: row.role as CuadernoCollaborator["role"],
    invitedBy: row.invited_by as string | null,
    joinedAt: row.joined_at as string,
    displayName: nameByUser.get(row.user_id as string) ?? null,
  }));
}
