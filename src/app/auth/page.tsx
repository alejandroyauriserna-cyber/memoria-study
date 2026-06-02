import { AppShell } from "@/components/ui/shell";
import { AuthForm } from "@/components/auth/auth-form";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

export default function AuthPage() {
  return (
    <AppShell>
      <section className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-6xl items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_480px]">
        <div className="tron-panel rounded-2xl p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Acceso · {UNT_DERECHO.career}</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#F5F7FA]">
            Entra a tu red de conocimiento
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Regístrate e indica dónde guardarás tus flashcards: año, ciclo, curso y semana del plan de estudios UNT.
          </p>
        </div>
        <div className="tron-panel rounded-2xl p-8">
          <AuthForm />
        </div>
      </section>
    </AppShell>
  );
}
