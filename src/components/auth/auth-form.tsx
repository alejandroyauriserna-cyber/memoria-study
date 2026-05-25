"use client";

import { Loader2, LogIn } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { AcademicNavigator } from "@/components/study/academic-navigator";
import { saveAcademicSelection } from "@/lib/academic/storage";
import { createClient } from "@/lib/supabase/browser";
import type { AcademicSelection } from "@/types/academic";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [academic, setAcademic] = useState<AcademicSelection | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleAcademicChange = useCallback((selection: AcademicSelection) => {
    setAcademic(selection);
    saveAcademicSelection(selection);
  }, []);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (!academic) {
      setStatus("error");
      setMessage(
        "Debes elegir año, ciclo, curso y semana donde guardarás tus flashcards.",
      );
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            academic_context: academic,
          },
        },
      });

      if (error) throw error;

      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academic, email }),
      }).catch(() => undefined);

      setStatus("sent");
      setMessage(
        "Revisa tu correo. Al ingresar, tus mazos se guardarán en la ubicación académica elegida.",
      );
    } catch (caught) {
      setStatus("error");
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Configura las variables de Supabase en .env.local para habilitar el registro.",
      );
    }
  }

  return (
    <form onSubmit={signIn} className="space-y-5">
      <AcademicNavigator value={academic} onChange={handleAcademicChange} />

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <label className="text-sm font-semibold" htmlFor="email">
          Correo institucional o personal
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu.correo@ejemplo.com"
          className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
          required
        />
        <Button className="mt-4 w-full" disabled={status === "loading" || !academic}>
          {status === "loading" ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <LogIn size={16} />
          )}
          Enviar enlace mágico
        </Button>
        {message ? (
          <p
            className={`mt-3 text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
