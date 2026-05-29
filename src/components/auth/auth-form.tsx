"use client";

import { Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AcademicNavigator } from "@/components/study/academic-navigator";
import { CycleSelector } from "@/components/auth/cycle-selector";
import { saveAcademicSelection } from "@/lib/academic/storage";
import { createClient } from "@/lib/supabase/browser";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import type { AcademicSelection } from "@/types/academic";

type CurrentCycle = {
  cycleNumber: number;
  cycleLabel: string;
};

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [academic, setAcademic] = useState<AcademicSelection | null>(null);
  const [currentCycle, setCurrentCycle] = useState<CurrentCycle>({
    cycleNumber: UNT_DERECHO.years[0].cycles[0].number,
    cycleLabel: UNT_DERECHO.years[0].cycles[0].label,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const actionLabel = useMemo(
    () => (mode === "signup" ? "Registrarse" : "Ingresar"),
    [mode],
  );

  const handleAcademicChange = useCallback((selection: AcademicSelection) => {
    setAcademic(selection);
    saveAcademicSelection(selection);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();

      if (mode === "signup") {
        if (!fullName.trim() || !password.trim()) {
          throw new Error("Completa nombre, correo, contraseña y ciclo actual.");
        }

        const callbackUrl = `${window.location.origin}/auth/callback`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: {
              full_name: fullName.trim(),
              current_cycle_number: currentCycle.cycleNumber,
              current_cycle_label: currentCycle.cycleLabel,
            },
          },
        });

        if (error) throw error;

        setStatus("sent");
        setMessage(
          "Revisa tu correo. Completa el registro y luego accede con tu contraseña o enlace mágico.",
        );
        return;
      }

      if (!academic) {
        throw new Error(
          "Debes elegir año, ciclo, curso y semana donde guardarás tus flashcards.",
        );
      }

      const callbackUrl = `${window.location.origin}/auth/callback`;
      const result = password
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: callbackUrl,
              data: {
                academic_context: academic,
              },
            },
          });

      if (result.error) throw result.error;

      if (result.data?.session) {
        window.location.href = "/dashboard";
        return;
      }

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
    <div className="space-y-5">
      <div className="flex gap-2 rounded-full border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "signin" ? "bg-foreground text-background" : "text-muted-foreground"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "signup" ? "bg-foreground text-background" : "text-muted-foreground"
          }`}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "signup" ? (
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">Nombre completo</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Tu nombre completo"
                className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                required
              />
            </label>
            <label className="block relative">
              <span className="text-sm font-semibold">Contraseña</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Al menos 8 caracteres"
                className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 pr-11 text-sm outline-none focus:border-accent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-3 grid place-items-center text-muted-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            <CycleSelector value={currentCycle} onChange={setCurrentCycle} />
          </div>
        ) : (
          <AcademicNavigator value={academic} onChange={handleAcademicChange} />
        )}

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
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

          {mode === "signin" && (
            <label className="block relative">
              <span className="text-sm font-semibold">Contraseña (opcional)</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresa si ya tienes contraseña"
                className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 pr-11 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-3 grid place-items-center text-muted-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
          )}

          <Button className="w-full" disabled={status === "loading"}>
            {status === "loading" ? <Loader2 className="animate-spin" size={16} /> : mode === "signup" ? <UserPlus size={16} /> : <LogIn size={16} />}
            {mode === "signup" ? "Registrarse" : password ? "Ingresar" : "Enviar enlace mágico"}
          </Button>

          {message ? (
            <p className={`mt-3 text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}>
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
