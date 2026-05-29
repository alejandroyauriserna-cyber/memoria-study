import Link from "next/link";
import { BookOpen, BookMarked, ChevronRight, Sparkles, User, Users } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { ProfileSync } from "@/components/dashboard/profile-sync";
import { UploadGenerator } from "@/components/study/upload-generator";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export default async function DashboardPage() {
  let profileName = "Estudiante";
  let currentCycle = "Ciclo V";
  let totalShared = 0;
  let totalDownloads = 0;
  let totalLikes = 0;
  let totalOrganizers = 0;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const admin = createAdminClient();
      const [{ data: profileData }, { data: materialsData }, { data: organizersData }] = await Promise.all([
        admin
          .from("user_profiles")
          .select("full_name, current_cycle_label")
          .eq("user_id", user.id)
          .maybeSingle(),
        admin.from("materials").select("downloads, likes").eq("user_id", user.id),
        admin.from("organizers").select("id").eq("user_id", user.id),
      ]);

      profileName = profileData?.full_name ?? user.user_metadata?.full_name ?? "Estudiante";
      currentCycle = profileData?.current_cycle_label ?? "Ciclo V";
      totalShared = (materialsData ?? []).length;
      totalDownloads = (materialsData ?? []).reduce((sum, item) => sum + (item.downloads ?? 0), 0);
      totalLikes = (materialsData ?? []).reduce((sum, item) => sum + (item.likes ?? 0), 0);
      totalOrganizers = (organizersData ?? []).length;
    }
  }

  const levelProgress = Math.min(100, 20 + totalShared * 12);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="glass-card rounded-[32px] p-10 md:p-12">
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-border bg-accent-soft p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Bienvenida personalizada</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">Hola {profileName} 👋</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  Bienvenido a tu centro de estudio para Derecho UNT. Aquí encuentras tu progreso, favoritos y organizadores en un solo lugar.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-card p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Carrera</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{UNT_DERECHO.career}</p>
                  </div>
                  <div className="rounded-3xl bg-card p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Ciclo actual</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{currentCycle}</p>
                  </div>
                  <div className="rounded-3xl bg-card p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Nivel académico</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">Estudiante</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm font-semibold text-accent">Materiales subidos</p>
                  <p className="mt-3 text-4xl font-semibold text-foreground">{totalShared}</p>
                </div>
                <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm font-semibold text-accent">Organizadores creados</p>
                  <p className="mt-3 text-4xl font-semibold text-foreground">{totalOrganizers}</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-accent">Progreso de nivel</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">Estudiante</p>
                  </div>
                  <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Novato</div>
                </div>
                <div className="mt-6 rounded-full bg-muted p-1">
                  <div className="h-3 rounded-full bg-accent" style={{ width: `${levelProgress}%` }} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{levelProgress}% hacia el siguiente nivel</p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass-card rounded-[32px] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Actividad reciente</p>
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <div className="rounded-3xl border border-border bg-muted p-4">
                  <p className="font-semibold text-foreground">Tu último material fue compartido recientemente.</p>
                  <p className="mt-2">Sigue creando para consolidar tu biblioteca académica.</p>
                </div>
                <div className="rounded-3xl border border-border bg-muted p-4">
                  <p className="font-semibold text-foreground">Crea tu primer organizador visual.</p>
                  <p className="mt-2">Los mapas conceptuales ayudan a recordar conceptos clave de Derecho.</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Gamificación</p>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">Niveles y logros</h2>
                </div>
                <Sparkles className="h-10 w-10 text-accent" />
              </div>
              <div className="mt-8 space-y-4">
                {[
                  "Novato",
                  "Estudiante",
                  "Investigador",
                  "Colaborador",
                  "Mentor",
                  "Experto",
                ].map((level) => (
                  <div key={level} className="flex items-center justify-between rounded-3xl border border-border bg-muted px-4 py-3 text-sm">
                    <span>{level}</span>
                    <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">{level === "Estudiante" ? "Actual" : ""}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/favorites" className="inline-flex h-14 items-center justify-center rounded-3xl bg-foreground px-4 text-sm font-semibold text-background transition hover:-translate-y-0.5 hover:bg-foreground/90">
              Ver Favoritos
            </Link>
          </aside>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Descargas recibidas</p>
            <p className="mt-4 text-3xl font-semibold text-foreground">{totalDownloads}</p>
          </div>
          <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Likes recibidos</p>
            <p className="mt-4 text-3xl font-semibold text-foreground">{totalLikes}</p>
          </div>
          <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Días estudiados</p>
            <p className="mt-4 text-3xl font-semibold text-foreground">18</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <ProfileSync />
        <div className="mt-10">
          <UploadGenerator />
        </div>
      </section>
    </AppShell>
  );
}
