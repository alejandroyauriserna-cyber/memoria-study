import { NextResponse } from "next/server";
import { generateCuadernoDictionaryEntry } from "@/lib/ai/cuaderno-dictionary";
import { getCuadernoClassForUser, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { buildCuadernoStudyContext, loadCuadernoPdfContext } from "@/lib/cuaderno/context";

export const runtime = "nodejs";
export const maxDuration = 120;

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

    const body = (await request.json()) as { term?: string };
    const term = body.term?.trim();
    if (!term) {
      return NextResponse.json({ error: "Indica el término a consultar." }, { status: 400 });
    }

    const pdfText = await loadCuadernoPdfContext(cuadernoClass.materialId);
    const studyContext = buildCuadernoStudyContext(cuadernoClass, pdfText);

    const entry = await generateCuadernoDictionaryEntry({
      term,
      studyContext,
      courseName: cuadernoClass.courseName,
    });

    return NextResponse.json({ entry });
  } catch (caught) {
    console.error("[cuaderno/dictionary]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error en el diccionario." },
      { status: 500 },
    );
  }
}
