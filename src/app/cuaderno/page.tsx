import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { CuadernoWorkspace } from "@/components/cuaderno/cuaderno-workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { listCollaboratedClasses } from "@/lib/cuaderno/auth";
import { recordToCuadernoClass } from "@/lib/cuaderno/mapper";
import { hasSupabaseEnv } from "@/lib/env";
import { formatStudyHours } from "@/lib/profile/aggregate-learning-stats";
import { estimateStudyMinutesFromServer } from "@/lib/profile/estimate-study-minutes";
import { fetchServerLearningStats } from "@/lib/profile/server-learning-stats";
import type { CuadernoClassRecord } from "@/types/cuaderno";

export default async function CuadernoPage() {
  if (!hasSupabaseEnv()) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Cuaderno no disponible</h1>
        </section>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-semibold">Cuaderno Inteligente</h1>
          <p className="mt-2 text-muted-foreground">Inicia sesión para guardar apuntes y consultar el diccionario jurídico.</p>
          <Link href="/auth" className="tron-btn-primary mt-8 inline-flex h-12 items-center rounded-xl px-6 text-sm font-semibold">
            Entrar
          </Link>
        </section>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const [{ data: profileData }, { data }, learningStats, sharedWithMe] = await Promise.all([
    admin.from("user_profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
    admin
      .from("cuaderno_classes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    fetchServerLearningStats(user.id),
    listCollaboratedClasses(user.id).catch(() => []),
  ]);

  const classes = (data ?? []).map((row) => recordToCuadernoClass(row as CuadernoClassRecord));
  const profileName =
    profileData?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "Estudiante";
  const studyHoursLabel = formatStudyHours(estimateStudyMinutesFromServer(learningStats));

  return (
    <AppShell>
      <CuadernoWorkspace
        initialClasses={classes}
        initialSharedWithMe={sharedWithMe}
        profileName={profileName}
        studyHoursLabel={studyHoursLabel}
      />
    </AppShell>
  );
}
