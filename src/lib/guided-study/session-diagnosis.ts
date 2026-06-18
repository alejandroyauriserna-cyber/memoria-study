import type { GuidedStudySession, SessionDiagnosis } from "@/types/guided-legal-study";

export function computeSessionDiagnosis(
  session: GuidedStudySession | null,
): SessionDiagnosis | null {
  const activities = session?.learningActivities ?? [];
  if (activities.length < 2) return null;

  const strengthMap = new Map<string, number>();
  const weaknessMap = new Map<string, number>();
  const forgetRisk: string[] = [];

  for (const act of activities) {
    const concept = act.concept?.trim();
    if (!concept) continue;

    if (act.score >= 75) {
      strengthMap.set(concept, (strengthMap.get(concept) ?? 0) + 1);
    } else if (act.score < 60) {
      weaknessMap.set(concept, (weaknessMap.get(concept) ?? 0) + 1);
      if (act.gaps?.length) {
        forgetRisk.push(...act.gaps.slice(0, 2));
      } else {
        forgetRisk.push(concept);
      }
    }

    act.strengths?.forEach((s) => {
      if (s.trim()) strengthMap.set(s.trim(), (strengthMap.get(s.trim()) ?? 0) + 1);
    });
    act.gaps?.forEach((g) => {
      if (g.trim()) {
        weaknessMap.set(g.trim(), (weaknessMap.get(g.trim()) ?? 0) + 1);
        forgetRisk.push(g.trim());
      }
    });
  }

  const strengths = [...strengthMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c]) => c);

  const weaknesses = [...weaknessMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c]) => c);

  const uniqueForget = [...new Set(forgetRisk)].slice(0, 4);

  const avg =
    activities.reduce((s, a) => s + a.score, 0) / Math.max(1, activities.length);

  let summary: string;
  if (avg >= 80) {
    summary = "Sesión sólida: demuestras dominio en varios conceptos. Refuerza los puntos débiles antes del examen.";
  } else if (avg >= 60) {
    summary = "Progreso real, pero hay lagunas que conviene cerrar con repaso activo y casos.";
  } else {
    summary = "La sesión reveló conceptos que necesitan más práctica. Prioriza repaso guiado antes de avanzar.";
  }

  if (!strengths.length && !weaknesses.length) return null;

  return {
    strengths,
    weaknesses,
    forgetRisk: uniqueForget,
    summary,
  };
}
