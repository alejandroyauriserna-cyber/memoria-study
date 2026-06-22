import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/require-auth";
import {
  getUserAiCredentialsStatus,
  removeUserAiCredential,
  saveUserGeminiKey,
  saveUserHfToken,
} from "@/lib/ai/user-ai-credentials";

const geminiSchema = z.object({
  provider: z.literal("gemini"),
  apiKey: z.string().trim().min(20).max(500),
});

const hfSchema = z.object({
  provider: z.literal("hf"),
  apiKey: z.string().trim().min(20).max(500),
});

const saveSchema = z.discriminatedUnion("provider", [geminiSchema, hfSchema]);

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const status = await getUserAiCredentialsStatus(auth.user.id);
    return NextResponse.json(status);
  } catch (caught) {
    console.error("[profile/ai-credentials GET]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo cargar tus claves IA." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request, { rateLimit: { limit: 10, windowMs: 60 * 60 * 1000 } });
    if (auth instanceof NextResponse) return auth;

    const body = saveSchema.parse(await request.json());
    const status =
      body.provider === "gemini"
        ? await saveUserGeminiKey(auth.user.id, body.apiKey)
        : await saveUserHfToken(auth.user.id, body.apiKey);

    return NextResponse.json({ ok: true, ...status });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos de conexión inválidos." }, { status: 400 });
    }

    console.error("[profile/ai-credentials POST]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo conectar tu IA." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const provider = z.enum(["gemini", "hf"]).parse(searchParams.get("provider"));
    const status = await removeUserAiCredential(auth.user.id, provider);

    return NextResponse.json({ ok: true, ...status });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json({ error: "Proveedor inválido." }, { status: 400 });
    }

    console.error("[profile/ai-credentials DELETE]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo quitar la clave." },
      { status: 500 },
    );
  }
}
