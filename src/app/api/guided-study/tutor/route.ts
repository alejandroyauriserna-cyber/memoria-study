import { NextResponse } from "next/server";
import { askLegalStudyTutor, findChapterForPage } from "@/lib/guided-study/legal-tutor";
import { getChapterText, getPageText } from "@/lib/guided-study/extract-pages";
import { loadMaterialForGuidedStudy } from "@/lib/guided-study/load-material";
import { enrichSourceSettings } from "@/lib/legal-sources/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { DocumentStudyIndex, GuidedStudyTutorAction } from "@/types/guided-legal-study";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_ACTIONS = new Set<GuidedStudyTutorAction>([
  "analyze_page",
  "exam_essentials",
  "exam_mode",
  "explain_page",
  "explain_chapter",
  "examples",
  "peru_law",
  "detect_concepts",
  "exam_questions",
  "verify_comprehension",
  "simpler",
  "first_cycle",
  "another_example",
  "real_case",
  "jurisprudence",
  "civil_code",
  "custom",
]);

export async function POST(request: Request) {
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

    const body = (await request.json()) as {
      materialId?: string;
      pageNumber?: number;
      action?: GuidedStudyTutorAction;
      customPrompt?: string;
      index?: DocumentStudyIndex;
      examOnly?: boolean;
      sourceSettings?: import("@/types/legal-sources").LegalSourcesSettings;
      chapterId?: string;
    };

    if (!body.materialId || !body.pageNumber) {
      return NextResponse.json(
        { error: "Faltan materialId o pageNumber." },
        { status: 400 },
      );
    }

    let action =
      body.action && VALID_ACTIONS.has(body.action) ? body.action : "analyze_page";

    if (
      body.examOnly &&
      (action === "analyze_page" || action === "explain_page" || action === "explain_chapter")
    ) {
      action = "exam_essentials";
    }

    const material = await loadMaterialForGuidedStudy(body.materialId);
    const totalPages = material.pages.length;
    const pageNumber = Math.min(Math.max(1, body.pageNumber), totalPages);

    const chapterById =
      body.chapterId && body.index
        ? body.index.chapters.find((ch) => ch.id === body.chapterId)
        : undefined;
    const chapter = chapterById ?? (body.index ? findChapterForPage(body.index, pageNumber) : undefined);

    const chapterMode = Boolean(chapterById) || action === "explain_chapter";
    const pageText = chapterById
      ? getChapterText(material.pages, chapterById.startPage, chapterById.endPage)
      : getPageText(material.pages, pageNumber);

    if (chapterMode && action === "analyze_page") {
      action = "explain_chapter";
    }

    const sourceSettings = await enrichSourceSettings(user.id, body.sourceSettings);

    const response = await askLegalStudyTutor({
      action,
      customPrompt: body.customPrompt,
      pageNumber,
      totalPages,
      pageText,
      documentTitle: material.title,
      courseName: material.courseName,
      chapterTitle: chapter?.title,
      chapterOverview: chapter?.learningOverview,
      chapterMode,
      sourceSettings,
      userId: user.id,
    });

    return NextResponse.json({
      action,
      pageNumber,
      chapterTitle: chapter?.title,
      chapterId: chapterById?.id,
      chapterMode,
      pageText,
      ...response,
    });
  } catch (caught) {
    console.error("[guided-study/tutor]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error del tutor jurídico." },
      { status: 500 },
    );
  }
}
