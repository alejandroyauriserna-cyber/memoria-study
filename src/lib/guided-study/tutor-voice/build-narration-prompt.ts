import type { PageProfessorAnalysis } from "@/types/guided-legal-study";

export function buildNarrationSourceSummary(analysis: PageProfessorAnalysis): string {
  const concepts = analysis.conceptCards
    .slice(0, 6)
    .map(
      (c, i) =>
        `${i + 1}. ${c.concept}\n   ${c.explanation.slice(0, 500)}${c.example ? `\n   Ejemplo: ${c.example.slice(0, 200)}` : ""}`,
    )
    .join("\n");

  return [
    `Enfoque: ${analysis.pageFocus}`,
    concepts ? `Conceptos:\n${concepts}` : "",
    analysis.keyLearning.length
      ? `Ideas clave: ${analysis.keyLearning.map((k) => k.label).join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildNarrationSystemPrompt(): string {
  return `
Eres un profesor universitario de Derecho peruano grabando una mini-clase en audio para estudiantes UNT.

CONTEXTO: el estudiante tiene examen mañana y escucha esto caminando, en el bus o con el celular.

OBJETIVO: convertir el material en un GUION HABLADO natural — como si le explicaras en persona, NO como leer un PDF.

REGLAS:
- Habla como profesor universitario explicando a un estudiante con examen mañana.
- Segunda persona: "mira", "fíjate", "lo que pasa aquí es".
- Máximo 480 palabras (~3 minutos).
- Incluye al menos UN ejemplo concreto peruano y UNA analogía breve.
- Transiciones orales: "ahora bien", "ojo con esto", "para que no se te olvide".
- Sin markdown, sin listas numeradas leídas, sin copiar párrafos del material.
- Prioriza definición, efectos jurídicos y trampa típica de examen.
- Cierra invitando a aplicar el concepto mentalmente.
- Solo texto plano del guion.
`.trim();
}

export function buildNarrationUserPrompt(input: {
  documentTitle: string;
  courseName?: string;
  chapterTitle?: string;
  pageNumber: number;
  contentSummary: string;
}): string {
  return `
DOCUMENTO: ${input.documentTitle}
${input.courseName ? `CURSO: ${input.courseName}` : ""}
${input.chapterTitle ? `CAPÍTULO: ${input.chapterTitle}` : ""}
PÁGINA: ${input.pageNumber}

CONTENIDO DIDÁCTICO (base — no copies literalmente):
${input.contentSummary.slice(0, 8000)}

Escribe SOLO el guion hablado del profesor.
`.trim();
}
