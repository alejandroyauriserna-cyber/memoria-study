import { NextResponse } from "next/server";
import { extensionForMime, generateConceptImage } from "@/lib/ai/gemini-concept-image";
import {
  generateVisualMindMap,
  MAX_VISUAL_MIND_MAP_IMAGES,
} from "@/lib/ai/generate-visual-mind-map";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";
import type { VisualMindMap } from "@/lib/organizers/visual-mind-map-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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
      .select("id,user_id,content")
      .eq("id", id)
      .maybeSingle();

    if (organizerError) throw organizerError;

    if (!organizer) {
      return NextResponse.json({ error: "Organizador no encontrado." }, { status: 404 });
    }

    if (organizer.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para generar el mapa visual." }, { status: 403 });
    }

    const content = parseOrganizerContent(organizer.content);
    let visualMindMap = await generateVisualMindMap(content);

    await ensureBucket(admin);

    let imagesGenerated = 0;
    const updatedNodes = [];

    for (const node of visualMindMap.nodes) {
      if (imagesGenerated >= MAX_VISUAL_MIND_MAP_IMAGES) {
        updatedNodes.push(node);
        continue;
      }

      const prompt = node.imagePrompt ?? `Educational legal concept: ${node.label}`;
      const { buffer, mimeType, source } = await generateConceptImage(prompt, node.label);

      if (source === "gemini") {
        imagesGenerated += 1;
      }

      const ext = extensionForMime(mimeType);
      const storagePath = `organizer-visual-maps/${id}/${node.id}.${ext}`;

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: mimeType, upsert: true });

      if (uploadError) {
        console.error("[visual-map] upload failed:", uploadError);
        updatedNodes.push({ ...node, imageUrl: null });
        continue;
      }

      const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
      updatedNodes.push({ ...node, imageUrl: urlData.publicUrl });
    }

    visualMindMap = { ...visualMindMap, nodes: updatedNodes };

    const mergedContent = {
      ...content,
      visualMindMap,
    };

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
      visualMindMap: visualMindMap as VisualMindMap,
      imagesGenerated,
    });
  } catch (caught) {
    console.error("[organizers/visual-map]", caught);

    return NextResponse.json(
      { error: "Ocurrió un error al generar el mapa visual. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
