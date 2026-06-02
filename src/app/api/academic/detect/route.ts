import { NextResponse } from "next/server";
import { detectCourseFromText } from "@/lib/academic/detect-course";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };

    if (typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "Se requiere texto del PDF para detectar el curso." }, { status: 400 });
    }

    const detection = detectCourseFromText(body.text);

    if (!detection) {
      return NextResponse.json(
        { error: "No se pudo inferir el curso académico." },
        { status: 422 },
      );
    }

    return NextResponse.json({ detection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al detectar curso.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
