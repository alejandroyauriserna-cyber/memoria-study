import { getJurisprudenceRepository } from "@/lib/jurisprudence/repository";
import type { DailySentencia } from "@/types/micro-study";

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function materiaLabel(materia: string): string {
  const labels: Record<string, string> = {
    civil: "Civil",
    penal: "Penal",
    constitucional: "Constitucional",
    tributario: "Tributario",
    laboral: "Laboral",
    administrativo: "Administrativo",
    procesal: "Procesal",
  };
  return labels[materia] ?? materia;
}

/** Resumen breve estilo IA (extractivo) para lectura de 2 minutos */
export function buildSentenciaAiBrief(summary: string, title: string): string {
  const clean = summary.replace(/\s+/g, " ").trim();
  if (!clean) {
    return `Sentencia relevante sobre ${title}. Consulta el fundamento y el ratio decidendi en la lectura completa.`;
  }

  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 24);
  if (sentences.length === 1) return clean;

  const context = sentences[0]!;
  const holding = sentences.find((s, i) => i > 0 && s.length > 40) ?? sentences[1]!;
  const brief = `${context} ${holding}`.trim();

  return brief.length > 320 ? `${brief.slice(0, 317)}…` : brief;
}

function legalTopicFromCourses(courseNames: string[]): string {
  if (!courseNames.length) return "acto jurídico";

  const course = courseNames[0]!.toLowerCase();
  if (course.includes("contrato")) return "contratos";
  if (course.includes("obligacion")) return "obligaciones";
  if (course.includes("constitucional")) return "derechos fundamentales";
  if (course.includes("penal")) return "tipicidad penal";
  if (course.includes("procesal")) return "debido proceso";
  if (course.includes("acto jurídico") || course.includes("civil")) return "acto jurídico";
  if (course.includes("real")) return "derechos reales";

  const words = courseNames[0]!.split(/[:\-—]/)[0]?.trim();
  return words && words.length > 3 ? words : "responsabilidad civil";
}

export async function pickDailySentenciaForUser(input: {
  userId: string;
  dateKey: string;
  courseNames: string[];
}): Promise<DailySentencia & { searchTopic: string; searchHref: string }> {
  const seed = hashString(`${input.userId}:${input.dateKey}:daily-sentencia`);
  const searchTopic = legalTopicFromCourses(input.courseNames);

  const repo = getJurisprudenceRepository();
  const result = await repo.search({ query: searchTopic, limit: 24 });
  const pool = result.items.length ? result.items : (await repo.search({ limit: 24 })).items;

  const index = Math.abs(seed) % Math.max(1, pool.length);
  const doc = pool[index];

  if (!doc) {
    return {
      id: "fallback-sentencia",
      title: "Casación sobre interpretación contractual",
      materia: "Civil",
      tema: "Interpretación de contratos",
      summary:
        "El tribunal reafirma que las cláusulas ambiguas se interpretan contra quien las redactó, privilegiando la voluntad común de las partes.",
      organo: "Corte Suprema",
      year: 2023,
      estimatedMinutes: 2,
      searchTopic,
      searchHref: `/biblioteca-juridica?q=${encodeURIComponent(searchTopic)}`,
    };
  }

  const tema = doc.submateria?.trim() || searchTopic;

  return {
    id: doc.id,
    title: doc.title,
    materia: materiaLabel(doc.materia),
    tema,
    summary: buildSentenciaAiBrief(doc.summary, doc.title),
    organo: doc.organo,
    year: doc.year,
    estimatedMinutes: 2,
    searchTopic,
    searchHref: `/biblioteca-juridica?q=${encodeURIComponent(tema)}`,
  };
}
