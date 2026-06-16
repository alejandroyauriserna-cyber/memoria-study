import { Suspense } from "react";
import { AppShell } from "@/components/ui/shell";
import { MicroSessionWorkspace } from "@/components/micro-study/micro-session-workspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Micro Estudio",
  description: "Sesión de estudio jurídico en 5 minutos — MemoriaStudy",
};

function SessionFallback() {
  return (
    <div className="ms-session ms-session--loading">
      <p>Preparando tu sesión…</p>
    </div>
  );
}

export default function MicroEstudioPage() {
  return (
    <AppShell minimal>
      <Suspense fallback={<SessionFallback />}>
        <MicroSessionWorkspace />
      </Suspense>
    </AppShell>
  );
}
