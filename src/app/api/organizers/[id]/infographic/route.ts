import { NextResponse } from "next/server";
import {
  extensionForInfographicMime,
  generateAcademicInfographicImage,
} from "@/lib/ai/gemini-infographic-image";
import {
  buildAcademicInfographicPrompt,
  extractInfographicTopics,
} from "@/lib/ai/build-academic-infographic-prompt";
import type { AcademicInfographic } from "@/lib/organizers/academic-infographic-types";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePremiumFeature } from "@/lib/billing/require-premium-api";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

const BUCKET = "shared-materials";

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const bucketInfo = await admin.storage.getBucket(BUCKET);
  if (!bucketInfo.data) {
    await admin.storage.createBucket(BUCKET, { public: true });
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const premiumBlock = requirePremiumFeature("gemini-infographic");
    if (premiumBlock) return premiumBlock;

    const { id } = await context.params;

    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: organizer, error: organizerError } = await admin
      .from("organizers")
      .select("id,user_id,content,title")
      .eq("id", id)
      .maybeSingle();

    if (organizerError) throw organizerError;

    if (!organizer) {
      return NextResponse.json({ error: "Organizador no encontrado." }, { status: 404 });
    }

    if (organizer.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para generar la infografía." }, { status: 403 });
    }

    const content = parseOrganizerContent(organizer.content);
    const { centralTopic, subtopics } = extractInfographicTopics(content);
    const prompt = buildAcademicInfographicPrompt(centralTopic, subtopics, content);

    const { buffer, mimeType, source, warning, model } = await generateAcademicInfographicImage(
      prompt,
      centralTopic,
      subtopics,
    );

    await ensureBucket(admin);

    const ext = extensionForInfographicMime(mimeType);
    const storagePath = `organizer-infographics/${id}/infographic.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      console.error("[infographic] upload failed:", uploadError);
      return NextResponse.json({ error: "No se pudo guardar la infografía." }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

    const academicInfographic: AcademicInfographic = {
      centralTopic,
      subtopics,
      imageUrl: urlData.publicUrl,
      prompt,
      generatedAt: new Date().toISOString(),
      source,
      warning,
      model,
    };

    const mergedContent = { ...content, academicInfographic };
    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await admin
      .from("organizers")
      .update({ content: mergedContent, updated_at: now })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      organizer: updated,
      academicInfographic,
      usedFallback: source === "fallback",
      warning,
    });
  } catch (caught) {
    console.error("[organizers/infographic]", caught);

    return NextResponse.json(
      { error: "Ocurrió un error al generar la infografía. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
