/** Mensajes claros en español para errores comunes de Supabase Auth. */
export function humanizeAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("pkce") ||
    normalized.includes("code verifier") ||
    normalized.includes("both auth code and code verifier")
  ) {
    return "El enlace de confirmación debe abrirse en el mismo navegador donde te registraste. Copia el enlace del correo, pégalo en Chrome o Edge (donde creaste la cuenta) o solicita un correo nuevo abajo.";
  }

  if (normalized.includes("expired") || normalized.includes("expir")) {
    return "El enlace expiró. Solicita un correo de confirmación nuevo.";
  }

  if (normalized.includes("already been used") || normalized.includes("already confirmed")) {
    return "Este enlace ya fue usado. Si ya confirmaste tu cuenta, ingresa con tu correo y contraseña.";
  }

  if (normalized.includes("invalid") && normalized.includes("link")) {
    return "Enlace inválido o incompleto. Abre el enlace directamente desde el correo o solicita uno nuevo.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada y spam.";
  }

  return message;
}

export function isPkceVerifierError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("pkce") ||
    normalized.includes("code verifier") ||
    normalized.includes("both auth code and code verifier")
  );
}
