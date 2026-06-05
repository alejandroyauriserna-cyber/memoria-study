import { redirect } from "next/navigation";

/** Compatibilidad con enlaces antiguos: todo pasa por /auth (URL ya permitida en Supabase). */
export default function ResetPasswordPage() {
  redirect("/auth?mode=reset-password");
}
