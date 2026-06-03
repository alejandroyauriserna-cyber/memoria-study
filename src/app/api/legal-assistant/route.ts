import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SYSTEM_PROMPT_UNT_DERECHO, UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    if (!env.geminiApiKey) {
      return NextResponse.json(
        { error: "El asistente jurídico no está configurado." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return NextResponse.json({ error: "Escribe una pregunta jurídica." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(env.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: env.geminiModel });

    const result = await model.generateContent(`
${SYSTEM_PROMPT_UNT_DERECHO}

Audiencia: ${UNT_DERECHO_AUDIENCE}

Modo: consulta académica general (sin PDF adjunto).
- Responde con rigor universitario peruano.
- Estructura la respuesta con claridad (concepto, fundamento, aplicación práctica si aplica).
- Si la pregunta requiere un documento específico, indícalo y sugiere subir el PDF.

PREGUNTA:
${question}
`);

    const response = await result.response;
    return NextResponse.json({ answer: response.text() });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo generar la respuesta jurídica." },
      { status: 500 },
    );
  }
}
