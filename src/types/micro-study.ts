export type DailyConcept = {
  id: string;
  title: string;
  definition: string;
  example: string;
  explanation: string;
  courseName: string;
  estimatedMinutes: number;
};

export type DailySentencia = {
  id: string;
  title: string;
  materia: string;
  tema: string;
  summary: string;
  organo: string;
  year: number;
  estimatedMinutes: number;
  searchTopic: string;
  searchHref: string;
};

export type AcademicProgressItem = {
  topic: string;
  courseName: string;
  progress: number;
};

export type ProfessionalStageId =
  | "estudiante"
  | "practicante"
  | "asistente"
  | "abogado-junior"
  | "abogado-senior"
  | "jurista";

export type ProfessionalStage = {
  id: ProfessionalStageId;
  label: string;
  emoji: string;
  minActivityScore: number;
};

export type ProfessorReminder = {
  daysSinceLastStudy: number;
  topic: string;
  courseName: string;
  sessionMinutes: number;
} | null;

export type MicroActivityMetrics = {
  activeDaysThisWeek: number;
  conceptsReviewed: number;
  sentenciasRead: number;
  microSessionsCompleted: number;
};

export type MicroStudyDashboardProps = {
  dailyConcept: DailyConcept;
  dailySentencia: DailySentencia;
  academicProgress: AcademicProgressItem[];
  professionalStage: ProfessionalStage;
  nextProfessionalStage: ProfessionalStage | null;
  activityScore: number;
  activityMetrics: MicroActivityMetrics;
};

export type MicroSessionConcept = {
  id: string;
  concept: string;
  explanation: string;
  example?: string;
};

export type MicroSessionFlashcard = {
  id: string;
  front: string;
  back: string;
};

export type MicroSessionQuiz = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type MicroSessionSentencia = {
  id: string;
  title: string;
  materia: string;
  summary: string;
  keyPoint: string;
};

export type MicroSessionPack = {
  id: string;
  title: string;
  estimatedMinutes: number;
  concepts: MicroSessionConcept[];
  flashcards: MicroSessionFlashcard[];
  quiz: MicroSessionQuiz | null;
  sourceCourse: string | null;
};

export type MicroActivityType =
  | "micro_session_completed"
  | "concept_reviewed"
  | "sentencia_read"
  | "daily_active";
