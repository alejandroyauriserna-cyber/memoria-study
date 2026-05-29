import Link from "next/link";
import { AppShell } from "@/components/ui/shell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center rounded-[32px] border border-border bg-card p-10 shadow-sm text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-4xl">📚</div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-accent">Origen no encontrado</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">El contenido no está disponible</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          Puede que el enlace esté roto o el recurso ya no exista. Explora la biblioteca o vuelve al panel para continuar estudiando.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90">
            Ir al panel
          </Link>
          <Link href="/library" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
            Explorar biblioteca
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
