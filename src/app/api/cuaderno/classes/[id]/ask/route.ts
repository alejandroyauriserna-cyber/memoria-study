import { NextResponse } from "next/server";
import { askCuadernoAssistant } from "@/lib/ai/cuaderno-notes-assistant";
import { getCuadernoClassForUser, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { buildCuadernoStudyContext, loadCuadernoPdfContext } from "@/lib/cuaderno/context";
import type { CuadernoAskAction } from "@/types/cuaderno";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_ACTIONS = new Set<CuadernoAskAction>([
  "explain",
  "summarize",
  "examples",
  "relate",
  "exam_questions",
  "flashcards",
  "key_concepts",
]);

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const cuadernoClass = await getCuadernoClassForUser(id, user.id);
    if (!cuadernoClass) {
      return NextResponse.json({ error: "Clase no encontrada." }, { status: 404 });
    }

    const body = (await request.json()) as {
      action?: CuadernoAskAction;
      prompt?: string;
    };

    const action = body.action && VALID_ACTIONS.has(body.action) ? body.action : "explain";

    const pdfText = await loadCuadernoPdfContext(cuadernoClass.materialId);
    const studyContext = buildCuadernoStudyContext(cuadernoClass, pdfText);

    const answer = await askCuadernoAssistant({
      action,
      studyContext,
      courseName: cuadernoClass.courseName,
      customPrompt: body.prompt,
    });

    return NextResponse.json({ answer, action });
  } catch (caught) {
    console.error("[cuaderno/ask]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al consultar IA." },
      { status: 500 },
    );
  }
}
