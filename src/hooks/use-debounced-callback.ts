"use client";

import { useCallback, useEffect, useRef } from "react";

/** Ejecuta `fn` tras `delayMs` sin recrear el callback en cada render. */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number,
): T & { flush: () => void; cancel: () => void } {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    argsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (!argsRef.current) return;
    const args = argsRef.current;
    cancel();
    fnRef.current(...args);
  }, [cancel]);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        argsRef.current = null;
        fnRef.current(...args);
      }, delayMs);
    },
    [delayMs, cancel],
  ) as T & { flush: () => void; cancel: () => void };

  debounced.flush = flush;
  debounced.cancel = cancel;

  useEffect(() => () => cancel(), [cancel]);

  return debounced;
}
