import type { AiSuggestion } from "@/lib/home/dashboard-types";

type MaterialHint = {
  id: string;
  title: string;
  description: string;
  materialType: string;
  courseName: string;
};

export function buildAiSuggestions(materials: MaterialHint[]): AiSuggestion[] {
  if (materials.length === 0) {
    return [
      {
        id: "onboard-pdf",
        context: "Comienza subiendo un PDF o apunte de tu curso actual",
        sourceTitle: "Tu biblioteca jurídica",
        actions: [
          { id: "upload", label: "Subir PDF", href: "/upload-material" },
          { id: "library", label: "Explorar biblioteca", href: "/library" },
          { id: "organizer", label: "Crear organizador visual", href: "/organizers" },
        ],
      },
    ];
  }

  const latest = materials[0];
  const topic = latest.title.trim() || latest.courseName;
  const isCase =
    latest.materialType === "caso" ||
    /caso|demanda|sentencia|jurisprudencia/i.test(`${latest.title} ${latest.description}`);

  const actions = isCase
    ? [
        { id: "case", label: "Analizar el caso", href: `/materials/${latest.id}` },
        { id: "juris", label: "Buscar jurisprudencia relacionada", href: `/library?course=${encodeURIComponent(latest.courseName)}` },
        { id: "exam", label: "Generar preguntas de examen", href: "/upload-material" },
        { id: "map", label: "Crear mapa conceptual", href: "/organizers" },
      ]
    : [
        { id: "summary", label: "Generar resumen", href: `/materials/${latest.id}` },
        { id: "map", label: "Crear mapa conceptual", href: "/organizers" },
        { id: "flash", label: "Crear flashcards", href: "/upload-material" },
        { id: "exam", label: "Generar preguntas de examen", href: "/upload-material" },
      ];

  return [
    {
      id: `suggest-${latest.id}`,
      context: isCase
        ? "Detectamos material orientado a análisis de caso"
        : "Basado en tu último documento jurídico",
      sourceTitle: topic,
      actions,
    },
  ];
}
