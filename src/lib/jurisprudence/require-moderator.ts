import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { isJurisprudenceModerator } from "@/lib/jurisprudence/unt-access";
import type { User } from "@supabase/supabase-js";

export async function requireJurisprudenceModerator(): Promise<
  { user: User } | NextResponse
> {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  if (!isJurisprudenceModerator(user.email)) {
    return NextResponse.json({ error: "No tienes permiso de administración." }, { status: 403 });
  }

  return { user };
}
