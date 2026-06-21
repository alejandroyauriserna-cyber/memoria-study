const USERNAME_TOKEN = /^[a-zA-Z0-9._-]{5,}$/;

function looksLikeUsernameOrPasswordToken(token: string): boolean {
  if (!token || token.includes("@")) return false;
  if (!USERNAME_TOKEN.test(token)) return false;
  return /\d/.test(token);
}

/** Quita sufijos tipo usuario/contraseña pegados al registrarse. */
export function sanitizeProfileDisplayName(raw: string | null | undefined): string {
  const trimmed = raw?.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Estudiante";

  const words = trimmed.split(" ").filter(Boolean);
  while (words.length > 1 && looksLikeUsernameOrPasswordToken(words[words.length - 1]!)) {
    words.pop();
  }

  const cleaned = words.join(" ").trim();
  return cleaned || "Estudiante";
}

export function formatProfileShortName(
  raw: string | null | undefined,
  maxWords = 2,
): string {
  return sanitizeProfileDisplayName(raw).split(/\s+/).slice(0, maxWords).join(" ");
}

export function formatProfileFirstName(raw: string | null | undefined): string {
  return sanitizeProfileDisplayName(raw).split(/\s+/)[0] ?? "Estudiante";
}

/** Nombre para ranking: primer nombre + inicial del apellido (p. ej. "María G."). */
export function formatRankingDisplayName(raw: string | null | undefined): string {
  const parts = sanitizeProfileDisplayName(raw).split(/\s+/).filter(Boolean);
  if (!parts.length) return "Estudiante";
  if (parts.length === 1) return parts[0]!;
  const lastInitial = parts[parts.length - 1]![0]?.toUpperCase() ?? "";
  return lastInitial ? `${parts[0]} ${lastInitial}.` : parts[0]!;
}

export function validateSignupFullName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 3) return "Escribe tu nombre y apellidos.";
  if (trimmed.length > 80) return "El nombre no puede superar 80 caracteres.";

  const words = trimmed.split(/\s+/).filter(Boolean);
  const last = words[words.length - 1];
  if (last && looksLikeUsernameOrPasswordToken(last)) {
    return "Usa solo nombre y apellidos, sin usuario ni contraseña.";
  }

  return null;
}
