"use client";

import { Eye, EyeOff, LogIn, Mail, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { CycleSelector } from "@/components/auth/cycle-selector";
import { authPageUrl } from "@/lib/auth/redirect-urls";
import { createClient } from "@/lib/supabase/browser";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

type AuthMode = "signin" | "signup" | "recovery";

type CurrentCycle = {
  cycleNumber: number;
  cycleLabel: string;
};

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

export function AuthForm() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as AuthMode | null) ?? "signin";
  const redirectTo = safeRedirectPath(searchParams.get("next"));

  const [mode, setMode] = useState<AuthMode>(
    initialMode === "recovery" ? "recovery" : initialMode === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [currentCycle, setCurrentCycle] = useState<CurrentCycle>({
    cycleNumber: UNT_DERECHO.years[0].cycles[0].number,
    cycleLabel: UNT_DERECHO.years[0].cycles[0].label,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "recovery") {
      setMode("recovery");
    }
  }, [searchParams]);

  const actionLabel = useMemo(() => {
    if (mode === "signup") return "Registrarse";
    if (mode === "recovery") return "Enviar enlace";
    return "Ingresar";
  }, [mode]);

  const authProgress = useLoadingProgress(status === "loading", "auth");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();

      if (mode === "recovery") {
        if (!email.trim()) {
          throw new Error("Ingresa el correo de tu cuenta.");
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authPageUrl("reset-password"),
        });

        if (error) throw error;

        setStatus("sent");
        setMessage(
          "Te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja y la carpeta de spam.",
        );
        return;
      }

      if (mode === "signup") {
        if (!fullName.trim() || !password.trim()) {
          throw new Error("Completa nombre, correo y contraseña.");
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: authPageUrl(),
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
          "Revisa tu correo para confirmar la cuenta. Luego ingresa con tu correo y contraseña.",
        );
        return;
      }

      if (!password.trim()) {
        throw new Error("Ingresa tu contraseña para acceder a tu cuenta.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.session) {
        window.location.href = redirectTo;
        return;
      }

      throw new Error("No se pudo iniciar sesión. Intenta de nuevo.");
    } catch (caught) {
      setStatus("error");
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Configura las variables de Supabase en .env.local para habilitar el acceso.",
      );
    }
  }

  return (
    <div className="space-y-5">
      {mode !== "recovery" ? (
        <div className="auth-tabs">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setMessage("");
              setStatus("idle");
            }}
            className={`auth-tab${mode === "signin" ? " is-active" : ""}`}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
              setStatus("idle");
            }}
            className={`auth-tab${mode === "signup" ? " is-active" : ""}`}
          >
            Registrarse
          </button>
        </div>
      ) : (
        <div className="auth-banner">
          <p className="auth-banner-title">Recuperar contraseña</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Te enviaremos un enlace al correo de tu cuenta.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "signup" ? (
          <div className="auth-field-block space-y-4">
            <label className="block">
              <span className="auth-label">Nombre completo</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Tu nombre completo"
                className="auth-input"
                required
              />
            </label>
            <CycleSelector value={currentCycle} onChange={setCurrentCycle} />
            <p className="text-[11px] text-muted-foreground">
              Año, curso y semana los configuras después en tu perfil o al generar mazos.
            </p>
          </div>
        ) : null}

        <div className="auth-field-block space-y-4">
          <label className="block">
            <span className="auth-label">Correo</span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu.correo@ejemplo.com"
              className="auth-input"
              required
            />
          </label>

          {mode === "signin" ? (
            <label className="auth-input-wrap block">
              <span className="auth-label">Contraseña</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                className="auth-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute bottom-2.5 right-3 text-muted-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
          ) : null}

          {mode === "signup" ? (
            <label className="auth-input-wrap block">
              <span className="auth-label">Contraseña</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Al menos 8 caracteres"
                className="auth-input"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute bottom-2.5 right-3 text-muted-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
          ) : null}

          <Button className="w-full" disabled={status === "loading"}>
            {status !== "loading" ? (
              mode === "recovery" ? (
                <Mail size={16} />
              ) : mode === "signup" ? (
                <UserPlus size={16} />
              ) : (
                <LogIn size={16} />
              )
            ) : null}
            {status === "loading" ? `${actionLabel}… ${authProgress.percent}%` : actionLabel}
          </Button>

          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => {
                setMode("recovery");
                setMessage("");
                setStatus("idle");
              }}
              className="auth-link w-full text-center"
            >
              ¿Olvidaste tu contraseña?
            </button>
          ) : null}

          {mode === "recovery" ? (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setMessage("");
                setStatus("idle");
              }}
              className="auth-link w-full text-center text-muted-foreground"
            >
              Volver a ingresar
            </button>
          ) : null}

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
            <p className={`text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}>
              {message}
            </p>
          ) : null}
        </div>
      </form>

      {mode === "signin" ? (
        <p className="auth-footnote">
          Tu ciclo, curso y semana ya están en tu perfil. Solo necesitas correo y contraseña.
        </p>
      ) : null}
    </div>
  );
}
