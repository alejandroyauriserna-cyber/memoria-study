import { NextResponse } from "next/server";
import { generateVisualPremiumPrompt } from "@/lib/ai/generate-visual-premium-prompt";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";
import type { VisualPromptMode } from "@/lib/organizers/visual-prompt-types";
import { VISUAL_PROMPT_MODES } from "@/lib/organizers/visual-prompt-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 120;

type RouteContext = { params: Promise<{ id: string }> };

const VALID_MODES = new Set(VISUAL_PROMPT_MODES.map((m) => m.id));

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const body = (await request.json().catch(() => ({}))) as { mode?: VisualPromptMode };
    const mode = body.mode && VALID_MODES.has(body.mode) ? body.mode : "infographic";

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
      return NextResponse.json({ error: "No tienes permiso para generar el prompt visual." }, { status: 403 });
    }

    const content = parseOrganizerContent(organizer.content);
    const visualPremiumPrompt = await generateVisualPremiumPrompt(content, mode);

    const mergedContent = {
      ...content,
      visualPremiumPrompt,
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
      visualPremiumPrompt,
    });
  } catch (caught) {
    console.error("[organizers/visual-prompt]", caught);

    return NextResponse.json(
      { error: "Ocurrió un error al generar el prompt visual. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
