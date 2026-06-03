import { NextResponse } from "next/server";
import { generateCuadernoDictionaryEntry } from "@/lib/ai/cuaderno-dictionary";
import { requireCuadernoUser } from "@/lib/cuaderno/auth";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const body = (await request.json()) as { term?: string; courseName?: string };
    const term = body.term?.trim();
    if (!term) {
      return NextResponse.json({ error: "Indica el término a consultar." }, { status: 400 });
    }

    const entry = await generateCuadernoDictionaryEntry({
      term,
      studyContext: "Consulta desde el Diccionario Jurídico del Cuaderno IA (sin apunte abierto).",
      courseName: body.courseName?.trim() || "Derecho UNT",
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
