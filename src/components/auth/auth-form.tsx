"use client";

import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
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
  const authProgress = useLoadingProgress(status === "loading", "auth");

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

  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(7,19,26,0.6)] px-3 text-sm text-[#F5F7FA] outline-none focus:border-[rgba(0,255,213,0.45)] focus:shadow-[0_0_24px_rgba(0,255,213,0.12)]";

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.5)] p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "signin"
              ? "bg-gradient-to-r from-[#00FFD5] to-[#00BFFF] text-[#07131A] shadow-[0_0_16px_rgba(0,255,213,0.3)]"
              : "text-muted-foreground hover:text-[#00FFD5]"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "signup"
              ? "bg-gradient-to-r from-[#00FFD5] to-[#00BFFF] text-[#07131A] shadow-[0_0_16px_rgba(0,255,213,0.3)]"
              : "text-muted-foreground hover:text-[#00FFD5]"
          }`}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "signup" ? (
          <div className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.4)] p-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#F5F7FA]">Nombre completo</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Tu nombre completo"
                className={inputClass}
                required
              />
            </label>
            <label className="block relative">
              <span className="text-sm font-semibold text-[#F5F7FA]">Contraseña</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Al menos 8 caracteres"
                className={`${inputClass} pr-11`}
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

        <div className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.4)] p-5 space-y-4">
          <label className="text-sm font-semibold text-[#F5F7FA]" htmlFor="email">
            Correo institucional o personal
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu.correo@ejemplo.com"
            className={inputClass}
            required
          />

          {mode === "signin" && (
            <label className="block relative">
              <span className="text-sm font-semibold text-[#F5F7FA]">Contraseña (opcional)</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresa si ya tienes contraseña"
                className={`${inputClass} pr-11`}
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
            {status !== "loading" ? (mode === "signup" ? <UserPlus size={16} /> : <LogIn size={16} />) : null}
            {status === "loading"
              ? `${actionLabel}… ${authProgress.percent}%`
              : mode === "signup"
                ? "Registrarse"
                : password
                  ? "Ingresar"
                  : "Enviar enlace mágico"}
          </Button>

          {status === "loading" ? (
            <LoadingState
              active
              preset="auth"
              percent={authProgress.percent}
              message={authProgress.message}
              stageLabel={authProgress.stageLabel}
              className="mt-3"
            />
          ) : null}

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
