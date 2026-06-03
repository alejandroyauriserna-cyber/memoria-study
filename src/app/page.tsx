import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Scale } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { LegalAiHero } from "@/components/home/legal-ai-hero";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

export default async function Home() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <AppShell>
      <div className="ms-home mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
            {UNT_DERECHO.university} · {UNT_DERECHO.career}
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
            Inicia sesión para acceder a tu panel personalizado, biblioteca jurídica y organizadores con IA.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth"
              className="tron-btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold"
            >
              Entrar <ArrowRight size={16} />
            </Link>
            <Link
              href="/library"
              className="tron-btn-secondary inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold"
            >
              Explorar biblioteca
            </Link>
          </div>
        </section>

        <LegalAiHero />

        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Scale size={14} className="text-[#00FFD5]/70" />
          Vista previa del asistente · requiere cuenta para guardar tu progreso
        </p>
      </div>
    </AppShell>
  );
}
