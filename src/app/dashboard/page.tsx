import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
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
          <DashboardHero
            profileName={profileName}
            currentCycle={currentCycle}
            career={UNT_DERECHO.career}
            totalShared={totalShared}
            totalOrganizers={totalOrganizers}
            totalDownloads={totalDownloads}
            totalLikes={totalLikes}
            levelProgress={levelProgress}
          />

          <aside className="space-y-6">
            <div className="tron-panel rounded-2xl p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Actividad reciente</p>
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <div className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] p-4">
                  <p className="font-semibold text-[#F5F7FA]">Tu último material fue compartido recientemente.</p>
                  <p className="mt-2">Sigue creando para consolidar tu red de conocimiento.</p>
                </div>
                <div className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] p-4">
                  <p className="font-semibold text-[#F5F7FA]">Crea tu primer organizador visual.</p>
                  <p className="mt-2">Los mapas holográficos ayudan a memorizar conceptos clave.</p>
                </div>
              </div>
            </div>

            <div className="tron-panel rounded-2xl p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Gamificación</p>
                  <h2 className="mt-3 text-2xl font-bold text-[#F5F7FA]">Niveles y logros</h2>
                </div>
                <Sparkles className="h-10 w-10 text-[#00FFD5]" />
              </div>
              <div className="mt-8 space-y-3">
                {["Novato", "Estudiante", "Investigador", "Colaborador", "Mentor", "Experto"].map((level) => (
                  <div
                    key={level}
                    className="flex items-center justify-between rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.4)] px-4 py-3 text-sm"
                  >
                    <span className="text-[#F5F7FA]">{level}</span>
                    {level === "Estudiante" ? (
                      <span className="rounded-full border border-[rgba(0,255,213,0.3)] bg-[rgba(0,255,213,0.1)] px-3 py-1 text-xs font-semibold text-[#00FFD5]">
                        Actual
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/favorites"
              className="tron-btn-primary inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
            >
              Ver Favoritos
              <ChevronRight size={16} />
            </Link>
          </aside>
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
