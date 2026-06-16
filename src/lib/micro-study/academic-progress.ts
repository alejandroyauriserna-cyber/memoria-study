import type { AcademicProgressItem } from "@/types/micro-study";

type SessionRow = {
  understood_pages: number[] | null;
  material_id: string;
};

type MaterialRow = {
  id: string;
  course_name: string;
  title: string;
};

const FALLBACK_TOPICS: AcademicProgressItem[] = [
  { topic: "Acto Jurídico", courseName: "Derecho Civil II", progress: 0 },
  { topic: "Contratos", courseName: "Derecho de Contratos", progress: 0 },
  { topic: "Obligaciones", courseName: "Derecho de Obligaciones", progress: 0 },
  { topic: "Derechos Reales", courseName: "Derecho de Derechos Reales", progress: 0 },
];

function topicFromCourse(courseName: string): string {
  const lower = courseName.toLowerCase();
  if (lower.includes("acto jurídico") || lower.includes("civil ii")) return "Acto Jurídico";
  if (lower.includes("contrato")) return "Contratos";
  if (lower.includes("obligacion")) return "Obligaciones";
  if (lower.includes("derechos reales") || lower.includes("real")) return "Derechos Reales";
  if (lower.includes("constitucional")) return "Constitucional";
  if (lower.includes("penal")) return "Penal";
  if (lower.includes("procesal")) return "Procesal";
  const words = courseName.split(/[:\-—]/)[0]?.trim() ?? courseName;
  return words.length > 32 ? words.slice(0, 32) : words;
}

export function buildAcademicProgress(
  sessions: SessionRow[],
  materials: MaterialRow[],
): AcademicProgressItem[] {
  const materialMap = new Map(materials.map((m) => [m.id, m]));
  const topicStats = new Map<string, { courseName: string; pages: number; sessions: number }>();

  for (const session of sessions) {
    const mat = materialMap.get(session.material_id);
    if (!mat) continue;
    const topic = topicFromCourse(mat.course_name);
    const prev = topicStats.get(topic) ?? {
      courseName: mat.course_name,
      pages: 0,
      sessions: 0,
    };
    topicStats.set(topic, {
      courseName: prev.courseName,
      pages: prev.pages + (session.understood_pages?.length ?? 0),
      sessions: prev.sessions + 1,
    });
  }

  if (!topicStats.size) {
    return FALLBACK_TOPICS;
  }

  const maxPages = Math.max(
    1,
    ...[...topicStats.values()].map((s) => s.pages),
  );

  return [...topicStats.entries()]
    .map(([topic, stats]) => ({
      topic,
      courseName: stats.courseName,
      progress: Math.min(100, Math.round((stats.pages / maxPages) * 100)),
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);
}
