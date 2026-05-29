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
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-accent">Perfil académico</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Datos y métricas</h1>
          <p className="mt-2 text-muted-foreground">
            Revisa tus datos, ciclo actual y el impacto de los materiales que compartes.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-semibold text-accent">Usuario</p>
              <p className="mt-4 text-lg font-semibold text-foreground">{profile?.full_name ?? user.user_metadata?.full_name ?? "Estudiante UNT"}</p>
              <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-semibold text-accent">Ciclo actual</p>
              <p className="mt-4 text-lg font-semibold text-foreground">
                {profile?.current_cycle_label ?? user.user_metadata?.current_cycle_label ?? "No definido"}
              </p>
              {profile?.current_cycle_number ? (
                <p className="mt-2 text-sm text-muted-foreground">Ciclo {profile.current_cycle_number}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-semibold text-accent">Estadísticas de material</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted p-4 text-center">
                  <p className="text-3xl font-semibold text-foreground">{totalShared}</p>
                  <p className="text-sm text-muted-foreground">Materiales compartidos</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted p-4 text-center">
                  <p className="text-3xl font-semibold text-foreground">{totalDownloads}</p>
                  <p className="text-sm text-muted-foreground">Descargas totales</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted p-4 text-center">
                  <p className="text-3xl font-semibold text-foreground">{totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Likes recibidos</p>
                </div>
              </div>
            </div>
          </div>

          <div>
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
        </div>
      </section>
    </AppShell>
  );
}
