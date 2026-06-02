import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export default async function ProfilePage() {
  if (!hasSupabaseEnv()) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const admin = createAdminClient();
  const [{ data: profileData }, { data: materialsData }] = await Promise.all([
    admin
      .from("user_profiles")
      .select("full_name, current_cycle_number, current_cycle_label, email")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("materials")
      .select("downloads,likes")
      .eq("user_id", user.id),
  ]);

  const profile = profileData ?? null;
  const materials = (materialsData ?? []) as Array<{ downloads: number; likes: number }>;
  const totalShared = materials.length;
  const totalDownloads = materials.reduce((sum, item) => sum + (item.downloads ?? 0), 0);
  const totalLikes = materials.reduce((sum, item) => sum + (item.likes ?? 0), 0);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="tron-panel rounded-2xl p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Perfil · IA</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#F5F7FA]">Tu resumen de estudio</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Actualiza tu información, sigue tu progreso y visualiza el impacto de tus materiales compartidos.
              </p>
            </div>
            <div className="tron-stat rounded-xl px-5 py-4 text-sm font-semibold text-[#00FFD5]">
              {profile?.current_cycle_label ?? user.user_metadata?.current_cycle_label ?? "Ciclo V"}
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Usuario</p>
                <p className="mt-4 text-2xl font-bold text-[#F5F7FA]">{profile?.full_name ?? user.user_metadata?.full_name ?? "Estudiante UNT"}</p>
                <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Ciclo actual</p>
                <p className="mt-4 text-2xl font-bold text-[#F5F7FA]">
                  {profile?.current_cycle_label ?? user.user_metadata?.current_cycle_label ?? "No definido"}
                </p>
                {profile?.current_cycle_number ? (
                  <p className="mt-2 text-sm text-muted-foreground">Ciclo {profile.current_cycle_number}</p>
                ) : null}
              </div>

              <div className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Progreso del estudiante</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Compartidos", value: totalShared },
                    { label: "Descargas", value: totalDownloads },
                    { label: "Likes", value: totalLikes },
                  ].map((stat) => (
                    <div key={stat.label} className="tron-capsule rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-[#F5F7FA]">{stat.value}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Nivel académico</p>
              <div className="mt-6 rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(16,39,48,0.5)] p-6">
                <p className="text-lg font-bold text-[#F5F7FA]">Estudiante</p>
                <p className="mt-3 text-sm text-muted-foreground">Sigue construyendo tu red de conocimiento y gana más progreso.</p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
                  <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-[#00FFD5] to-[#00BFFF] shadow-[0_0_12px_rgba(0,255,213,0.4)]" />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">60% hacia el siguiente nivel</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tron-panel mt-10 rounded-2xl p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Actualiza tu perfil</p>
          <ProfileForm
            fullName={profile?.full_name ?? undefined}
            currentCycle={
              profile?.current_cycle_number && profile?.current_cycle_label
                ? {
                    cycleNumber: profile.current_cycle_number,
                    cycleLabel: profile.current_cycle_label,
                  }
                : null
            }
          />
        </div>
      </section>
    </AppShell>
  );
}
