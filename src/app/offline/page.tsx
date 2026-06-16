import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(0,255,213,0.1)] text-[var(--accent)]">
          <WifiOff size={28} />
        </span>
        <h1 className="text-xl font-semibold text-foreground">Sin conexión</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Puedes seguir consultando Inicio, Biblioteca y Organizadores si ya los visitaste antes.
          Tu progreso local se sincronizará al volver en línea.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Link
            href="/"
            className="tron-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold"
          >
            Ir al inicio
          </Link>
          <Link
            href="/library"
            className="tron-btn-secondary inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold"
          >
            Biblioteca
          </Link>
          <Link
            href="/organizers"
            className="tron-btn-secondary inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold"
          >
            Organizadores
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
