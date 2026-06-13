import { NextResponse } from "next/server";
import {
  buildTutorCacheKey,
  type TutorCacheScope,
} from "@/lib/guided-study/tutor-cache";
import { resolveTutorCacheScope } from "@/lib/guided-study/tutor-cache-server";
import { loadServerTutorChat } from "@/lib/guided-study/tutor-chat-server";
import { verifyMaterialAccess } from "@/lib/materials/verify-access";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

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

    const scope: TutorCacheScope = chapterId
      ? resolveTutorCacheScope({ pageNumber: pageNumber || 1, chapterId })
      : resolveTutorCacheScope({ pageNumber: pageNumber || 1 });

    if (buildTutorCacheKey(scope, examOnly) !== cacheKey) {
      return NextResponse.json({ error: "cacheKey no coincide con el alcance." }, { status: 400 });
    }

    const messages = await loadServerTutorChat(
      user.id,
      materialId,
      scope,
      examOnly,
      fingerprint,
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[guided-study/tutor-chat GET]", error);
    return NextResponse.json({ error: "No se pudo cargar el chat." }, { status: 500 });
  }
}
