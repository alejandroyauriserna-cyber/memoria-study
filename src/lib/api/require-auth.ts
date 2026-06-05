import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import type { User } from "@supabase/supabase-js";

export type AuthContext = {
  user: User;
  rateLimitKey: string;
};

export async function requireAuth(
  request: Request,
  options?: { rateLimit?: { limit: number; windowMs: number } },
): Promise<AuthContext | NextResponse> {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const rateLimit = options?.rateLimit ?? { limit: 30, windowMs: 60_000 };
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rateLimitKey = `user:${user.id}:${forwarded ?? "local"}`;
  const rl = checkRateLimit(rateLimitKey, rateLimit.limit, rateLimit.windowMs);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
      { status: 429, headers: rateLimitHeaders(rl, rateLimit.limit) },
    );
  }

  return { user, rateLimitKey };
}
