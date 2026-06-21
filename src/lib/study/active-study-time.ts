/** Sin actividad durante 3 min → deja de contar. */
export const ACTIVE_STUDY_IDLE_MS = 3 * 60 * 1000;

/** Intervalo de guardado mientras la sesión está activa. */
export const ACTIVE_STUDY_TICK_MS = 15 * 1000;

/** Tope por intervalo para evitar saltos si el reloj del sistema cambia. */
export const ACTIVE_STUDY_MAX_CREDIT_MS = 5 * 60 * 1000;

export type ActiveStudyTimeFields = {
  activeStudyMs?: number;
  lastActivityAt?: number;
  lastTickAt?: number;
};

export function normalizeActiveStudyFields(
  state: ActiveStudyTimeFields & { startedAt?: number },
  now = Date.now(),
): Required<ActiveStudyTimeFields> & { startedAt: number } {
  const startedAt = state.startedAt ?? now;
  return {
    startedAt,
    activeStudyMs: Math.max(0, state.activeStudyMs ?? 0),
    lastActivityAt: state.lastActivityAt ?? startedAt,
    lastTickAt: state.lastTickAt ?? now,
  };
}

export function isStudySessionIdle(
  state: Pick<ActiveStudyTimeFields, "lastActivityAt">,
  now = Date.now(),
): boolean {
  const lastActivityAt = state.lastActivityAt ?? 0;
  return now - lastActivityAt > ACTIVE_STUDY_IDLE_MS;
}

export function creditActiveStudyMs<T extends ActiveStudyTimeFields>(
  state: T,
  now = Date.now(),
): T & Required<ActiveStudyTimeFields> {
  const normalized = normalizeActiveStudyFields(state, now);

  if (isStudySessionIdle(normalized, now)) {
    return { ...state, ...normalized, lastTickAt: now };
  }

  const elapsed = now - normalized.lastTickAt;
  if (elapsed <= 0) {
    return { ...state, ...normalized };
  }

  const credited = Math.min(elapsed, ACTIVE_STUDY_MAX_CREDIT_MS);
  return {
    ...state,
    ...normalized,
    activeStudyMs: normalized.activeStudyMs + credited,
    lastTickAt: now,
  };
}

export function readingMinutesFromActiveMs(activeStudyMs: number): number {
  if (activeStudyMs <= 0) return 0;
  return Math.max(1, Math.round(activeStudyMs / 60_000));
}

export function readingMinutesFromAnalyticsState(state: {
  activeStudyMs?: number;
}): number {
  if (typeof state.activeStudyMs !== "number") {
    return 0;
  }

  return readingMinutesFromActiveMs(state.activeStudyMs);
}
