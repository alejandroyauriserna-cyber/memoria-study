/** Guion hablado generado para TTS — no es el texto literal del panel. */
export type TutorNarrationScript = {
  script: string;
  wordCount: number;
  estimatedDurationSec: number;
  generatedAt: string;
  style?: NarrationStyle;
};

export type NarrationStyle = "quick" | "normal" | "magistral";

export type NarrationMicroAction =
  | "example"
  | "simpler"
  | "casacion"
  | "exam"
  | "repeat_main";

/** Botón predefinido o pregunta libre del estudiante durante la clase. */
export type NarrationInterruptAction = NarrationMicroAction | "free";

export const NARRATION_MICRO_ACTION_LABELS: Record<
  NarrationMicroAction,
  { emoji: string; label: string }
> = {
  example: { emoji: "💡", label: "Dame un ejemplo" },
  simpler: { emoji: "📚", label: "Explícalo más fácil" },
  casacion: { emoji: "⚖️", label: "Relaciónalo con una casación" },
  exam: { emoji: "🎓", label: "¿Cómo respondería esto en un examen?" },
  repeat_main: { emoji: "🔄", label: "Repetir idea principal" },
};

export type TutorSpeechRate = 1 | 1.25 | 1.5;

export type TutorSpeechStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "error";

/** Fase 2 — conversación por voz (STT → Tutor → TTS). */
export type TutorVoiceSessionPhase =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export type TutorVoiceTurn = {
  id: string;
  role: "student" | "professor";
  text: string;
  createdAt: string;
};

export type TutorVoiceSessionState = {
  phase: TutorVoiceSessionPhase;
  turns: TutorVoiceTurn[];
  error?: string;
};
