import Link from "next/link";
import { AppShell } from "@/components/ui/shell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <div className="tron-panel w-full rounded-2xl p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(0,255,213,0.1)] text-4xl shadow-[0_0_32px_rgba(0,255,213,0.2)]">
            📚
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Origen no encontrado</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#F5F7FA]">El contenido no está disponible</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Puede que el enlace esté roto o el recurso ya no exista. Explora la biblioteca o vuelve al panel para continuar estudiando.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="tron-btn-primary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
              Ir al panel
            </Link>
            <Link href="/library" className="tron-btn-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
              Explorar biblioteca
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
