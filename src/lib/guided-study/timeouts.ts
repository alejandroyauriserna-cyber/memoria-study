/** Tiempo máximo que el navegador espera respuestas del estudio guiado (6 min). */
export const GUIDED_STUDY_CLIENT_TIMEOUT_MS = 360_000;

/** Duración máxima de rutas API en Vercel (alineado con /api/generate y PDF). */
export const GUIDED_STUDY_API_MAX_DURATION = 300;

/** Tiempo por llamada a proveedor IA en tutor/análisis (2 min). */
export const GUIDED_STUDY_AI_PROVIDER_TIMEOUT_MS = 120_000;

/** Clase magistral narrada — guiones largos (~5–8 min). */
export const GUIDED_STUDY_NARRATION_MAGISTRAL_TIMEOUT_MS = 240_000;

export function guidedStudyClientTimeoutSeconds() {
  return Math.round(GUIDED_STUDY_CLIENT_TIMEOUT_MS / 1000);
}
