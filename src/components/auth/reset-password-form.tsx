"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { createClient } from "@/lib/supabase/browser";

async function waitForSession(maxAttempts = 8): Promise<boolean> {
  const supabase = createClient();
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return true;
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }
  return false;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "loading" | "done" | "error">(
    "checking",
  );
  const [message, setMessage] = useState("");
  const progress = useLoadingProgress(status === "loading", "auth");

  useEffect(() => {
    async function establishRecoverySession() {
      try {
        const hasSession = await waitForSession();
        if (!hasSession) {
          setStatus("error");
          setMessage(
            "El enlace no es válido o expiró. Solicita uno nuevo desde Ingresar → ¿Olvidaste tu contraseña?",
          );
          return;
        }
        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudo validar el enlace de recuperación.",
        );
      }
    }

    void establishRecoverySession();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setStatus("loading");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus("done");
      setMessage("Contraseña actualizada. Redirigiendo…");
      window.setTimeout(() => router.replace("/"), 1200);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la contraseña.");
    }
  }

  if (status === "checking") {
    return <p className="text-sm text-muted-foreground">Validando enlace de recuperación…</p>;
  }

  if (status === "error" && !password) {
    return (
      <div className="space-y-4">
        <p className="auth-error !mb-0">{message}</p>
        <a href="/auth?mode=recovery" className="auth-link inline-flex text-sm">
          Solicitar nuevo enlace
        </a>
      </div>
    );
  }

  if (status === "done") {
    return <p className="text-sm text-accent">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Elige una contraseña nueva para tu cuenta.</p>
      <label className="auth-input-wrap block">
        <span className="auth-label">Nueva contraseña</span>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          minLength={8}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute bottom-2.5 right-3 text-muted-foreground"
          aria-label="Mostrar contraseña"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </label>
      <label className="block">
        <span className="auth-label">Confirmar contraseña</span>
        <input
          type={showPassword ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="auth-input"
          minLength={8}
          required
        />
      </label>
      <Button className="w-full" disabled={status === "loading"}>
        <KeyRound size={16} />
        {status === "loading" ? `Guardando… ${progress.percent}%` : "Guardar contraseña"}
      </Button>
      {status === "loading" ? (
        <LoadingState active preset="auth" percent={progress.percent} className="mt-2" />
      ) : null}
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-500" : "text-accent"}`}>{message}</p>
      ) : null}
    </form>
  );
}
