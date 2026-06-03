import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordToCuadernoClass } from "@/lib/cuaderno/mapper";
import type { CuadernoClass, CuadernoClassRecord } from "@/types/cuaderno";

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
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cuaderno_classes")
    .select("*")
    .eq("id", classId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return recordToCuadernoClass(data as CuadernoClassRecord);
}
