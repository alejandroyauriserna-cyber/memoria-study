import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildServerSourceFingerprint,
  loadServerTutorCache,
  resolveTutorCacheScope,
  saveServerTutorCache,
} from "@/lib/guided-study/tutor-cache-server";
import { buildTutorCacheKey, hasTutorCacheContent } from "@/lib/guided-study/tutor-cache";
import { verifyMaterialAccess } from "@/lib/materials/verify-access";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { TutorResponse } from "@/types/guided-legal-study";

const putSchema = z.object({
  materialId: z.string().uuid(),
  cacheKey: z.string().min(1),
  fingerprint: z.string(),
  examOnly: z.boolean(),
  pageNumber: z.number().int().positive().optional(),
  chapterId: z.string().optional(),
  result: z.object({
    analysis: z.unknown().optional(),
    customReply: z.string().optional(),
    activeSources: z.array(z.unknown()).optional(),
  }),
});

export async function GET(request: Request) {
  try {
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

    const params = new URL(request.url).searchParams;
    const materialId = params.get("materialId");
    const cacheKey = params.get("cacheKey");
    const fingerprint = params.get("fingerprint") ?? "";
    const examOnly = params.get("examOnly") === "1";
    const pageNumber = Number(params.get("pageNumber") ?? "0");
    const chapterId = params.get("chapterId") ?? undefined;

    if (!materialId || !cacheKey) {
      return NextResponse.json({ error: "Faltan materialId o cacheKey." }, { status: 400 });
    }

    const access = await verifyMaterialAccess(materialId, user.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const scope = chapterId
      ? resolveTutorCacheScope({ pageNumber: pageNumber || 1, chapterId })
      : resolveTutorCacheScope({ pageNumber: pageNumber || 1 });

    if (buildTutorCacheKey(scope, examOnly) !== cacheKey) {
      return NextResponse.json({ error: "cacheKey no coincide con el alcance." }, { status: 400 });
    }

    const cached = await loadServerTutorCache(
      user.id,
      materialId,
      scope,
      examOnly,
      fingerprint,
    );

    return NextResponse.json({ cached });
  } catch (error) {
    console.error("[guided-study/tutor-cache GET]", error);
    return NextResponse.json({ error: "No se pudo cargar la explicación guardada." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
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

    const body = putSchema.parse(await request.json());
    const access = await verifyMaterialAccess(body.materialId, user.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const scope = body.chapterId
      ? resolveTutorCacheScope({ pageNumber: body.pageNumber ?? 1, chapterId: body.chapterId })
      : resolveTutorCacheScope({ pageNumber: body.pageNumber ?? 1 });

    if (buildTutorCacheKey(scope, body.examOnly) !== body.cacheKey) {
      return NextResponse.json({ error: "cacheKey no coincide con el alcance." }, { status: 400 });
    }

    const result = body.result as Pick<TutorResponse, "analysis" | "customReply" | "activeSources">;
    if (!hasTutorCacheContent(result)) {
      return NextResponse.json({ error: "Resultado vacío." }, { status: 400 });
    }

    await saveServerTutorCache(
      user.id,
      body.materialId,
      scope,
      body.examOnly,
      body.fingerprint,
      result,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[guided-study/tutor-cache PUT]", error);
    return NextResponse.json({ error: "No se pudo guardar la explicación." }, { status: 500 });
  }
}
