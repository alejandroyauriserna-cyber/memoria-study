import type { User } from "@supabase/supabase-js";

export function isEmailConfirmed(user: User): boolean {
  const meta = user.user_metadata as { email_verified?: boolean } | undefined;
  if (meta?.email_verified === true) return true;
  if ("email_confirmed_at" in user && user.email_confirmed_at) return true;
  if ("confirmed_at" in user && user.confirmed_at) return true;
  return false;
}

export function getEmailConfirmationMessage(): string {
  return "Confirma tu correo institucional antes de aportar sentencias. Revisa tu bandeja de entrada o solicita un nuevo enlace de verificación.";
}
