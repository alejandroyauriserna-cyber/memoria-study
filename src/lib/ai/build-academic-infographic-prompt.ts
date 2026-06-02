import type { OrganizerContent } from "@/lib/organizers/parse-content";

export function extractInfographicTopics(content: OrganizerContent): {
  centralTopic: string;
  subtopics: string[];
} {
  const centralTopic =
    content.conceptMap?.title?.trim() ||
    content.hierarchy?.root?.trim() ||
    content.summary?.slice(0, 100)?.trim() ||
    "Tema jurídico";

  const fromConcepts = content.conceptMap?.nodes?.filter(Boolean) ?? [];
  const fromHierarchy = content.hierarchy?.branches?.filter(Boolean) ?? [];
  const fromKeyConcepts = content.reviewBundle?.keyConcepts?.filter(Boolean) ?? [];
  const fromCards = content.visualSummary?.conceptCards?.map((c) => c.title) ?? [];
  const fromAi = content.aiAnalysis?.conceptsDetected ?? [];

  const merged = [
    ...new Set([...fromConcepts, ...fromHierarchy, ...fromKeyConcepts, ...fromCards, ...fromAi]),
  ]
    .filter((label) => label.toLowerCase() !== centralTopic.toLowerCase())
    .slice(0, 8);

  return {
    centralTopic,
    subtopics:
      merged.length >= 3
        ? merged
        : ["Buena Fe", "Interpretación Sistemática", "Voluntad Expresada", "Calificación Jurídica"],
  };
}

export function buildAcademicInfographicPrompt(
  centralTopic: string,
  subtopics: string[],
  content: OrganizerContent,
): string {
  const summarySnippet = content.summary?.slice(0, 600) ?? "";
  const subtopicList = subtopics.map((s) => `- ${s}`).join("\n");

  return `Genera una infografía académica profesional sobre ${centralTopic} en el Derecho Peruano.

Tema central:
${centralTopic}

Subtemas (cada uno con icono e ilustración propia):
${subtopicList}

Contexto del material:
${summarySnippet}

Estilo visual:
Infografía educativa premium estilo Gemini / diseñador educativo moderno.
NO diagrama técnico. NO cajas de flowchart. NO grafo de nodos.
Composición artística tipo mapa mental visual ilustrado.

Diseño obligatorio:
- Tema central grande en el centro con icono ⚖️ o equivalente jurídico
- Subtemas distribuidos alrededor en disposición radial orgánica
- Cada subtema con mini ilustración personalizada (apretón de manos para Buena Fe, libro para Código Civil, palacio para Derecho Peruano, etc.)
- Iconografía temática jurídica
- Colores diferenciados por categoría: turquesa conceptos, azul normas, verde principios, naranja casos, morado ejemplos
- Conexiones visuales suaves curvas con glow sutil
- Jerarquía visual clara: centro dominante, subtemas medianos
- Tipografía legible en español
- Fondo oscuro elegante con gradientes suaves

Formato:
Horizontal 16:9 panorámico.
Alta resolución, nítida.
Legible para estudiantes universitarios de Derecho UNT.
Texto en español.

La imagen debe ser UNA sola infografía completa lista para estudiar solo mirándola.`;
}
