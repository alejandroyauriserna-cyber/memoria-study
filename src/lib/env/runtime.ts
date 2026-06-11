/**
 * Variables de servidor leídas en runtime.
 * Usar esto en lugar de `env.*` cacheado al importar el módulo:
 * en Vercel/Next el valor del build puede quedar congelado si la var se añadió después.
 */
export function readServerEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}

export function readServerEnvList(name: string): string[] {
  const raw = readServerEnv(name);
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().replace(/^["']|["']$/g, "").toLowerCase())
    .filter(Boolean);
}
