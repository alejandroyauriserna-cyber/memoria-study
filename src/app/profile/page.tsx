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
        <div className="rounded-[32px] border border-border bg-card p-10 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Perfil académico</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">Tu resumen de estudio</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Actualiza tu información, sigue tu progreso y visualiza el impacto de tus materiales compartidos.
              </p>
            </div>
            <div className="rounded-3xl bg-muted px-5 py-4 text-sm font-semibold text-muted-foreground">
              {profile?.current_cycle_label ?? user.user_metadata?.current_cycle_label ?? "Ciclo V"}
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-border bg-muted p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Usuario</p>
                <p className="mt-4 text-2xl font-semibold text-foreground">{profile?.full_name ?? user.user_metadata?.full_name ?? "Estudiante UNT"}</p>
                <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="rounded-[28px] border border-border bg-muted p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Ciclo actual</p>
                <p className="mt-4 text-2xl font-semibold text-foreground">
                  {profile?.current_cycle_label ?? user.user_metadata?.current_cycle_label ?? "No definido"}
                </p>
                {profile?.current_cycle_number ? (
                  <p className="mt-2 text-sm text-muted-foreground">Ciclo {profile.current_cycle_number}</p>
                ) : null}
              </div>

              <div className="rounded-[28px] border border-border bg-muted p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Progreso del estudiante</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-card p-4 text-center">
                    <p className="text-3xl font-semibold text-foreground">{totalShared}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">Compartidos</p>
                  </div>
                  <div className="rounded-3xl bg-card p-4 text-center">
                    <p className="text-3xl font-semibold text-foreground">{totalDownloads}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">Descargas</p>
                  </div>
                  <div className="rounded-3xl bg-card p-4 text-center">
                    <p className="text-3xl font-semibold text-foreground">{totalLikes}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">Likes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-border bg-muted p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Nivel académico</p>
              <div className="mt-6 rounded-3xl bg-card p-6 shadow-sm">
                <p className="text-lg font-semibold text-foreground">Estudiante</p>
                <p className="mt-3 text-sm text-muted-foreground">Sigue construyendo tu biblioteca UNT y gana más progreso.</p>
                <div className="mt-6 rounded-full bg-muted p-1">
                  <div className="h-3 rounded-full bg-accent" style={{ width: "60%" }} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">60% hacia el siguiente nivel</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Actualiza tu perfil</p>
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
