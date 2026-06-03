import { NextResponse } from "next/server";
import { generateStudyDeck } from "@/lib/ai/generate-study-deck";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import { getCuadernoClassForUser, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { buildCuadernoStudyContext, loadCuadernoPdfContext } from "@/lib/cuaderno/context";
import type { AcademicSelection } from "@/types/academic";

export const runtime = "nodejs";
export const maxDuration = 300;

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

    if (!cuadernoClass.notes.trim()) {
      return NextResponse.json({ error: "Escribe apuntes antes de generar material." }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as { mode?: "deck" | "exam" };

    const pdfText = await loadCuadernoPdfContext(cuadernoClass.materialId);
    const studyContext = buildCuadernoStudyContext(cuadernoClass, pdfText);

    const academic: AcademicSelection = {
      yearNumber: 1,
      yearLabel: "Año académico",
      cycleNumber: cuadernoClass.cycleNumber,
      cycleLabel: cuadernoClass.cycleLabel,
      courseId: cuadernoClass.courseId,
      courseName: cuadernoClass.courseName,
      weekNumber: cuadernoClass.classNumber ?? 1,
      weekTitle: cuadernoClass.title,
    };

    const counts =
      body.mode === "exam"
        ? { flashcards: 4, quiz: 12, fillBlanks: 6, definitionCards: 4, matchingPairs: 4 }
        : { flashcards: 10, quiz: 6, fillBlanks: 4, definitionCards: 6, matchingPairs: 4 };

    const deck = await generateStudyDeck({
      sourceName: `Cuaderno: ${cuadernoClass.title}`,
      text: studyContext,
      audience: UNT_DERECHO_AUDIENCE,
      academic,
      counts,
    });

    return NextResponse.json({ deck, academic });
  } catch (caught) {
    console.error("[cuaderno/generate-deck]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al generar material de estudio." },
      { status: 500 },
    );
  }
}
