import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { env } from "@/lib/env";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request, { rateLimit: { limit: 40, windowMs: 60_000 } });
    if (auth instanceof NextResponse) return auth;

    if (!env.geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini no está configurado para el tutor." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const pdfText = body.pdfText;
    const question = body.question;

    if (!pdfText || !question) {
      return NextResponse.json(
        { error: "Faltan el texto del PDF o la pregunta." },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(env.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: env.geminiModel });

    const result = await model.generateContent(`
Eres tutor jurídico de la Universidad Nacional de Trujillo (UNT), carrera de Derecho.
Audiencia: ${UNT_DERECHO_AUDIENCE}

Responde SOLO con base en el contenido del PDF.
- Usa español jurídico peruano claro y riguroso.
- Cita artículos o conceptos solo si aparecen en el texto fuente.
- No inventes normas externas al documento.

CONTENIDO DEL PDF:
${pdfText}

PREGUNTA DEL ESTUDIANTE:
${question}
`);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ answer: text });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo consultar el PDF." },
      { status: 500 },
    );
  }
}
