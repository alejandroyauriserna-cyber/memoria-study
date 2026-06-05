import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

function redirectWithError(request: NextRequest, message: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/auth";
  url.search = "";
  url.searchParams.set("auth_error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return redirectWithError(request, "Supabase no está configurado.");
  }

  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const token = request.nextUrl.searchParams.get("token");
  const type = request.nextUrl.searchParams.get("type");
  const email = request.nextUrl.searchParams.get("email");

  if (!code && !tokenHash && !(token && type)) {
    return redirectWithError(request, "Enlace de acceso inválido o expirado.");
  }

  const successPath = type === "recovery" ? "/auth?mode=reset-password" : "/";
  const successUrl = new URL(successPath, request.url);
  let response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "recovery" | "signup" | "email" | "magiclink",
      });
      if (error) throw error;
    } else if (token && type) {
      const { error } = await supabase.auth.verifyOtp({
        token,
        type: type as "recovery" | "signup" | "email" | "magiclink",
        email: email ?? "",
      });
      if (error) throw error;
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo completar la autenticación.";
    return redirectWithError(request, message);
  }
}
