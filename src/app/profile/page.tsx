import { notFound } from "next/navigation";
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
    notFound();
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_profiles")
    .select("full_name, current_cycle_number, current_cycle_label")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = data ?? null;

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-accent">Perfil académico</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Datos personales y ciclo actual</h1>
          <p className="mt-2 text-muted-foreground">
            Actualiza tu nombre y el ciclo en el que estudias. Esto no limita tu acceso a materiales de otros ciclos.
          </p>
        </div>

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
      </section>
    </AppShell>
  );
}
