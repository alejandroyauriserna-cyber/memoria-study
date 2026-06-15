import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordToCuadernoClass } from "@/lib/cuaderno/mapper";
import type {
  CuadernoClass,
  CuadernoClassAccess,
  CuadernoClassRecord,
  CuadernoCollaboratorRecord,
  CuadernoSharePermission,
} from "@/types/cuaderno";

export async function requireCuadernoUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCuadernoClassForUser(
  classId: string,
  userId: string,
): Promise<CuadernoClass | null> {
  const access = await getCuadernoClassWithAccess(classId, userId);
  return access?.cuadernoClass ?? null;
}

export async function getCuadernoClassWithAccess(
  classId: string,
  userId: string,
): Promise<CuadernoClassAccess | null> {
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("cuaderno_classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const record = row as CuadernoClassRecord;
  const cuadernoClass = recordToCuadernoClass(record);

  if (record.user_id === userId) {
    return { cuadernoClass, role: "owner", canEdit: true };
  }

  const { data: collab, error: collabError } = await admin
    .from("cuaderno_class_collaborators")
    .select("*")
    .eq("class_id", classId)
    .eq("user_id", userId)
    .maybeSingle();

  if (collabError) throw collabError;
  if (!collab) return null;

  const collaborator = collab as CuadernoCollaboratorRecord;
  const role = collaborator.role === "editor" ? "editor" : "viewer";

  let ownerName: string | null = null;
  const { data: ownerProfile } = await admin
    .from("user_profiles")
    .select("full_name")
    .eq("user_id", record.user_id)
    .maybeSingle();
  ownerName = ownerProfile?.full_name ?? null;

  return {
    cuadernoClass,
    role,
    canEdit: role === "editor",
    ownerName,
  };
}

export async function getCuadernoClassByShareToken(
  token: string,
): Promise<{ cuadernoClass: CuadernoClass; sharePermission: CuadernoSharePermission } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cuaderno_classes")
    .select("*")
    .eq("share_token", token)
    .eq("is_shared", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const record = data as CuadernoClassRecord;
  return {
    cuadernoClass: recordToCuadernoClass(record),
    sharePermission: record.share_permission ?? "view",
  };
}

export async function listCollaboratedClasses(userId: string): Promise<CuadernoClassAccess[]> {
  const admin = createAdminClient();

  const { data: collabRows, error: collabError } = await admin
    .from("cuaderno_class_collaborators")
    .select("class_id, role")
    .eq("user_id", userId);

  if (collabError) throw collabError;
  if (!collabRows?.length) return [];

  const classIds = collabRows.map((r) => r.class_id as string);
  const roleByClass = new Map(
    collabRows.map((r) => [r.class_id as string, r.role as string]),
  );

  const { data: classes, error } = await admin
    .from("cuaderno_classes")
    .select("*")
    .in("id", classIds);

  if (error) throw error;

  const ownerIds = [...new Set((classes ?? []).map((c) => c.user_id as string))];
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("user_id, full_name")
    .in("user_id", ownerIds);

  const nameByUser = new Map(
    (profiles ?? []).map((p) => [p.user_id as string, p.full_name as string | null]),
  );

  return (classes ?? []).map((row) => {
    const record = row as CuadernoClassRecord;
    const collabRole = roleByClass.get(record.id);
    const role = collabRole === "editor" ? "editor" : "viewer";
    return {
      cuadernoClass: recordToCuadernoClass(record),
      role,
      canEdit: role === "editor",
      ownerName: nameByUser.get(record.user_id) ?? null,
    };
  });
}
