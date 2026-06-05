import { Suspense } from "react";
import { AppShell } from "@/components/ui/shell";
import { AuthEntry } from "@/components/auth/auth-entry";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

function AuthFormFallback() {
  return <p className="text-sm text-muted-foreground">Cargando acceso…</p>;
}

export default function AuthPage() {
  return (
    <AppShell>
      <section className="auth-page mx-auto grid max-w-6xl items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_480px]">
        <div className="auth-hero p-8 md:p-10">
          <p className="auth-kicker">Acceso · {UNT_DERECHO.career}</p>
          <h1 className="auth-title">Entra a tu red de conocimiento</h1>
          <p className="auth-lead">
            Ingresa con tu correo y contraseña. Tu ciclo y preferencias académicas ya viven en tu
            perfil — no necesitas elegirlas cada vez que accedes.
          </p>
        </div>
        <div className="auth-card p-6 sm:p-8">
          <Suspense fallback={<AuthFormFallback />}>
            <AuthEntry />
          </Suspense>
        </div>
      </section>
    </AppShell>
  );
}
