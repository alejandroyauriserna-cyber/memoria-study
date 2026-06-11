import { NextResponse } from "next/server";
import { mergeInteractiveDiagramLayout } from "@/lib/organizers/visual-ai-diagram/merge-interactive-layout";
import { isVisualAiFormatId } from "@/lib/organizers/visual-ai-formats";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";
import type { InteractiveDiagramLayoutState } from "@/lib/organizers/visual-ai-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const formatId = body.format;
    const interactiveLayout = body.interactiveLayout as InteractiveDiagramLayoutState | undefined;

    if (!isVisualAiFormatId(formatId) || !interactiveLayout?.positions) {
      return NextResponse.json({ error: "Layout inválido." }, { status: 400 });
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
      return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
    }

    const content = parseOrganizerContent(organizer.content);
    const merged = mergeInteractiveDiagramLayout(content, formatId, {
      ...interactiveLayout,
      updatedAt: new Date().toISOString(),
    });

    const { data: updated, error: updateError } = await admin
      .from("organizers")
      .update({ content: merged, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ organizer: updated, interactiveLayout: merged.visualAiOutputs?.[formatId]?.interactiveLayout });
  } catch (error) {
    console.error("[organizers/visual-ai/layout]", error);
    return NextResponse.json({ error: "No se pudo guardar el layout." }, { status: 500 });
  }
}
