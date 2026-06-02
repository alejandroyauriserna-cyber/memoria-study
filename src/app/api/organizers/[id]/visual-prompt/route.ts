import { NextResponse } from "next/server";
import { extractRubricText } from "@/lib/ai/extract-rubric-text";
import { generateVisualPremiumPrompt } from "@/lib/ai/generate-visual-premium-prompt";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";
import type { VisualCreativityLevel, VisualPromptMode } from "@/lib/organizers/visual-prompt-types";
import { VISUAL_PROMPT_MODES } from "@/lib/organizers/visual-prompt-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 180;

type RouteContext = { params: Promise<{ id: string }> };

const VALID_MODES = new Set(VISUAL_PROMPT_MODES.map((m) => m.id));
const MAX_RUBRIC_BYTES = 12 * 1024 * 1024;

const VALID_CREATIVITY = new Set(["conservative", "balanced", "creative", "extreme"]);

function parseCreativity(value: FormDataEntryValue | null): VisualCreativityLevel {
  const level = typeof value === "string" ? value : "balanced";
  return VALID_CREATIVITY.has(level) ? (level as VisualCreativityLevel) : "balanced";
}

function parsePersonalization(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function parseMode(value: FormDataEntryValue | null): VisualPromptMode {
  const mode = typeof value === "string" ? value : "infographic";
  return VALID_MODES.has(mode as VisualPromptMode) ? (mode as VisualPromptMode) : "infographic";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let mode: VisualPromptMode = "infographic";
    let rubricText: string | null = null;
    let rubricFileName: string | undefined;
    let studentPersonalization: string | null = null;
    let creativityLevel: VisualCreativityLevel = "balanced";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      mode = parseMode(formData.get("mode"));
      studentPersonalization = parsePersonalization(formData.get("personalization"));
      creativityLevel = parseCreativity(formData.get("creativityLevel"));

      const rubricEntry = formData.get("rubric");
      if (rubricEntry instanceof File && rubricEntry.size > 0) {
        if (rubricEntry.size > MAX_RUBRIC_BYTES) {
          return NextResponse.json(
            { error: "La rúbrica supera el tamaño máximo de 12 MB." },
            { status: 400 },
          );
        }

        const buffer = Buffer.from(await rubricEntry.arrayBuffer());
        rubricFileName = rubricEntry.name;
        rubricText = await extractRubricText(buffer, rubricEntry.name, rubricEntry.type);
      }
    } else {
      const body = (await request.json().catch(() => ({}))) as {
        mode?: VisualPromptMode;
        rubricText?: string;
        rubricFileName?: string;
        personalization?: string;
        creativityLevel?: VisualCreativityLevel;
      };
      mode = body.mode && VALID_MODES.has(body.mode) ? body.mode : "infographic";
      rubricText = body.rubricText?.trim() || null;
      rubricFileName = body.rubricFileName;
      studentPersonalization = body.personalization?.trim() || null;
      creativityLevel =
        body.creativityLevel && VALID_CREATIVITY.has(body.creativityLevel)
          ? body.creativityLevel
          : "balanced";
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
      return NextResponse.json({ error: "No tienes permiso para generar el prompt visual." }, { status: 403 });
    }

    const content = parseOrganizerContent(organizer.content);
    const visualPremiumPrompt = await generateVisualPremiumPrompt(
      content,
      mode,
      rubricText,
      rubricFileName,
      studentPersonalization,
      creativityLevel,
    );

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
      rubricDetected: Boolean(rubricText),
    });
  } catch (caught) {
    console.error("[organizers/visual-prompt]", caught);

    const message =
      caught instanceof Error
        ? caught.message
        : "Ocurrió un error al generar el prompt visual. Inténtalo de nuevo.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
