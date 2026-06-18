import type { NarrationClassMode } from "@/types/tutor-voice";

export type LessonStartupPhase = "generating" | "preparing_audio" | "starting";

export function lessonStartupLabel(
  phase: LessonStartupPhase,
  classMode: NarrationClassMode,
): string {
  if (phase === "generating") {
    return "Generando la explicación con IA…";
  }
  if (phase === "preparing_audio") {
    return "Preparando la voz del profesor…";
  }
  return classMode === "practice"
    ? "Iniciando clase interactiva…"
    : "Iniciando narración…";
}

export function parseNarrationFetchError(status: number, payload: unknown): string {
  const body = payload as { error?: string } | null;
  const message = body?.error?.trim();

  if (status === 401) {
    return message || "Debes iniciar sesión para escuchar la clase.";
  }
  if (status === 503) {
    return message || "El servicio no está disponible. Intenta de nuevo en unos minutos.";
  }
  if (status >= 500) {
    return message || "No se pudo generar la clase. El servidor respondió con error.";
  }
  if (status === 413) {
    return "La página tiene demasiado contenido para narrar de una vez.";
  }
  if (status >= 400) {
    return message || "No se pudo preparar la clase. Revisa tu conexión e inténtalo otra vez.";
  }

  return message || "Error desconocido al cargar la clase.";
}

export function narrationPlaybackErrorMessage(code?: string): string {
  if (code === "not-allowed") {
    return "El navegador bloqueó el audio. Interactúa con la página y vuelve a pulsar Iniciar.";
  }
  if (code === "audio-busy") {
    return "Otro audio está usando el dispositivo. Ciérralo e inténtalo de nuevo.";
  }
  return "No se pudo reproducir la narración. Pulsa Reintentar o recarga la página.";
}
