import { AppShell } from "@/components/ui/shell";
import { AuthForm } from "@/components/auth/auth-form";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

export default function AuthPage() {
  return (
    <AppShell>
      <section className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-6xl items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_480px]">
        <div>
          <p className="text-sm font-semibold text-accent">Registro · {UNT_DERECHO.career}</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight">
            Guarda tus mazos por año, ciclo y semana
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Al registrarte debes indicar en qué parte del plan de estudios de Derecho (UNT)
            guardarás tus flashcards: año de la carrera, ciclo, curso y semana.
          </p>
        </div>
        <AuthForm />
      </section>
    </AppShell>
  );
}
