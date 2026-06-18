/** Guion hablado generado para TTS — no es el texto literal del panel. */
export type TutorNarrationScript = {
  script: string;
  wordCount: number;
  estimatedDurationSec: number;
  generatedAt: string;
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
