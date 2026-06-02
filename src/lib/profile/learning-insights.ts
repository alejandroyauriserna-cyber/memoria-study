import type { AggregatedLearningStats } from "@/lib/profile/aggregate-learning-stats";
import type { StudyPreferences } from "@/lib/profile/study-preferences-storage";

export type LearningProfileInsight = {
  studyStyle: string;
  strengths: string[];
  areasToImprove: string[];
  summary: string;
};

export type LearningAchievement = {
  id: string;
  label: string;
  description: string;
  emoji: string;
  earned: boolean;
  progress?: number;
};

export type LearningRecommendation = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  priority: "high" | "medium" | "low";
};

export function buildLearningProfile(
  stats: AggregatedLearningStats,
  preferences: StudyPreferences,
  topCourses: string[],
): LearningProfileInsight {
  const strengths: string[] = [];
  const areasToImprove: string[] = [];

  if (stats.conceptsStudied >= 10) {
    strengths.push("Exploración activa de conceptos en mapas y rutas de estudio");
  }
  if (stats.questionsCorrect >= 5 && stats.questionsAnswered > 0) {
    const rate = Math.round((stats.questionsCorrect / stats.questionsAnswered) * 100);
    if (rate >= 70) strengths.push(`Buen rendimiento en preguntas (${rate}% aciertos)`);
    else areasToImprove.push("Repasar preguntas falladas con flashcards");
  }
  if (stats.flashcardDecksActive >= 1) {
    strengths.push("Uso consistente de repetición espaciada");
  }
  if (stats.organizersCreated >= 3) {
    strengths.push("Generación frecuente de organizadores visuales");
  }
  if (topCourses.length >= 2) {
    strengths.push(`Interés distribuido en ${topCourses.slice(0, 2).join(" y ")}`);
  }

  if (stats.conceptsStudied < 5) {
    areasToImprove.push("Explorar más nodos del mapa conceptual");
  }
  if (stats.questionsAnswered < 3) {
    areasToImprove.push("Practicar con el módulo de examen IA");
  }
  if (!preferences.practicalCases) {
    areasToImprove.push("Incorporar casos prácticos al plan de estudio");
  }
  if (stats.averageMastery < 50 && stats.conceptsStudied > 0) {
    areasToImprove.push("Reforzar conceptos con bajo dominio antes de avanzar");
  }

  if (!strengths.length) {
    strengths.push("Estás comenzando tu ruta — buen momento para definir objetivos");
  }
  if (!areasToImprove.length) {
    areasToImprove.push("Mantener constancia semanal con repaso activo");
  }

  let studyStyle = "Explorador visual";
  if (preferences.flashcards && stats.flashcardDecksActive >= 2) {
    studyStyle = "Memorizador activo";
  } else if (preferences.exams && stats.questionsAnswered >= 10) {
    studyStyle = "Preparación de examen";
  } else if (preferences.conceptMaps && stats.conceptsStudied >= 8) {
    studyStyle = "Pensamiento en red";
  } else if (preferences.practicalCases) {
    studyStyle = "Aprendizaje aplicado";
  }

  const summary =
    stats.organizersCreated > 0 || stats.conceptsStudied > 0
      ? `Tu perfil sugiere un estilo «${studyStyle}» con ${stats.conceptsStudied} conceptos explorados y ${stats.organizersCreated} organizadores creados.`
      : "Completa tu primer organizador o ruta de estudio para generar un perfil personalizado.";

  return { studyStyle, strengths, areasToImprove, summary };
}

export function buildLearningAchievements(stats: AggregatedLearningStats): LearningAchievement[] {
  return [
    {
      id: "first-concept",
      label: "Primer concepto",
      description: "Exploraste tu primer concepto en un organizador.",
      emoji: "🎯",
      earned: stats.conceptsStudied >= 1,
      progress: Math.min(100, stats.conceptsStudied * 100),
    },
    {
      id: "concept-explorer",
      label: "Explorador",
      description: "Estudiaste 10 conceptos distintos.",
      emoji: "🧭",
      earned: stats.conceptsStudied >= 10,
      progress: Math.min(100, Math.round((stats.conceptsStudied / 10) * 100)),
    },
    {
      id: "first-organizer",
      label: "Organizador IA",
      description: "Creaste tu primer organizador visual.",
      emoji: "🗺️",
      earned: stats.organizersCreated >= 1,
    },
    {
      id: "organizer-pro",
      label: "Arquitecto del saber",
      description: "Generaste 5 organizadores con IA.",
      emoji: "🏛️",
      earned: stats.organizersCreated >= 5,
      progress: Math.min(100, Math.round((stats.organizersCreated / 5) * 100)),
    },
    {
      id: "quiz-starter",
      label: "En la cancha",
      description: "Respondiste 5 preguntas de repaso.",
      emoji: "⚖️",
      earned: stats.questionsAnswered >= 5,
      progress: Math.min(100, Math.round((stats.questionsAnswered / 5) * 100)),
    },
    {
      id: "quiz-master",
      label: "Dominio oral",
      description: "Acertaste 20 preguntas de examen.",
      emoji: "🏆",
      earned: stats.questionsCorrect >= 20,
      progress: Math.min(100, Math.round((stats.questionsCorrect / 20) * 100)),
    },
    {
      id: "flashcard-habit",
      label: "Ritmo Anki",
      description: "Practicaste con flashcards en 2 mazos.",
      emoji: "🃏",
      earned: stats.flashcardDecksActive >= 2,
    },
    {
      id: "study-marathon",
      label: "Maratón de estudio",
      description: "Acumulaste 5 horas de estudio activo.",
      emoji: "⏱️",
      earned: stats.studyMinutes >= 300,
      progress: Math.min(100, Math.round((stats.studyMinutes / 300) * 100)),
    },
    {
      id: "path-walker",
      label: "Ruta completa",
      description: "Completaste 5 nodos en rutas de estudio.",
      emoji: "🛤️",
      earned: stats.pathNodesCompleted >= 5,
      progress: Math.min(100, Math.round((stats.pathNodesCompleted / 5) * 100)),
    },
    {
      id: "mastery-50",
      label: "Mitad del camino",
      description: "Alcanzaste 50% de dominio promedio.",
      emoji: "📈",
      earned: stats.averageMastery >= 50,
      progress: stats.averageMastery,
    },
  ];
}

export function buildRecommendations(
  stats: AggregatedLearningStats,
  preferences: StudyPreferences,
  topCourses: string[],
): LearningRecommendation[] {
  const items: LearningRecommendation[] = [];

  if (stats.organizersCreated === 0) {
    items.push({
      id: "create-organizer",
      title: "Crea tu primer organizador",
      description: "Sube un PDF y genera un mapa conceptual con IA en minutos.",
      actionLabel: "Ir a organizadores",
      href: "/organizers",
      priority: "high",
    });
  }

  if (stats.conceptsStudied >= 3 && stats.questionsAnswered < 5 && preferences.exams) {
    items.push({
      id: "try-exam",
      title: "Pon a prueba lo aprendido",
      description: "El módulo de examen IA refuerza conceptos que ya exploraste.",
      actionLabel: "Abrir organizadores",
      href: "/organizers",
      priority: "high",
    });
  }

  if (stats.flashcardDecksActive === 0 && preferences.flashcards) {
    items.push({
      id: "flashcards",
      title: "Activa repetición espaciada",
      description: "Las flashcards convierten conceptos en memoria de largo plazo.",
      actionLabel: "Estudiar con flashcards",
      href: "/organizers",
      priority: "medium",
    });
  }

  if (topCourses[0]) {
    items.push({
      id: "top-course",
      title: `Profundiza en ${topCourses[0]}`,
      description: "Tu materia más estudiada — ideal para un repaso guiado esta semana.",
      actionLabel: "Ver biblioteca",
      href: "/library",
      priority: "medium",
    });
  }

  if (stats.averageMastery < 40 && stats.conceptsStudied > 5) {
    items.push({
      id: "review-weak",
      title: "Refuerzo de conceptos débiles",
      description: "Usa el modo estudio guiado en nodos con bajo dominio.",
      actionLabel: "Continuar estudio",
      href: "/organizers",
      priority: "high",
    });
  }

  if (preferences.conceptMaps && stats.pathNodesCompleted < 3) {
    items.push({
      id: "study-path",
      title: "Completa una ruta de estudio",
      description: "La ruta secuencial te guía concepto por concepto.",
      actionLabel: "Abrir organizador",
      href: "/organizers",
      priority: "low",
    });
  }

  return items.slice(0, 4);
}

export function computeStudyLevel(stats: AggregatedLearningStats) {
  const points =
    stats.conceptsStudied * 3 +
    stats.organizersCreated * 15 +
    stats.questionsCorrect * 2 +
    stats.pathNodesCompleted * 5 +
    Math.floor(stats.studyMinutes / 10);

  const levels = [
    { name: "Novato", threshold: 0 },
    { name: "Aprendiz", threshold: 30 },
    { name: "Estudiante activo", threshold: 80 },
    { name: "Analista jurídico", threshold: 150 },
    { name: "Estratega", threshold: 280 },
  ];

  const current = [...levels].reverse().find((l) => points >= l.threshold) ?? levels[0];
  const next = levels.find((l) => l.threshold > current.threshold);
  const progress = next
    ? Math.min(100, Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100))
    : 100;

  return { level: current.name, points, progress, nextLevel: next?.name ?? null };
}
