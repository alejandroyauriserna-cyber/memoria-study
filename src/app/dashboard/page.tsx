import { AppShell } from "@/components/ui/shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
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
  let totalFavorites = 0;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const admin = createAdminClient();
      const [{ data: profileData }, { data: materialsData }, { data: organizersData }, { count: favoritesCount }] =
        await Promise.all([
          admin
            .from("user_profiles")
            .select("full_name, current_cycle_label")
            .eq("user_id", user.id)
            .maybeSingle(),
          admin.from("materials").select("downloads, likes").eq("user_id", user.id),
          admin.from("organizers").select("id").eq("user_id", user.id),
          admin
            .from("favorites")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);

      profileName = profileData?.full_name ?? user.user_metadata?.full_name ?? "Estudiante";
      currentCycle = profileData?.current_cycle_label ?? "Ciclo V";
      totalShared = (materialsData ?? []).length;
      totalDownloads = (materialsData ?? []).reduce((sum, item) => sum + (item.downloads ?? 0), 0);
      totalLikes = (materialsData ?? []).reduce((sum, item) => sum + (item.likes ?? 0), 0);
      totalOrganizers = (organizersData ?? []).length;
      totalFavorites = favoritesCount ?? 0;
    }
  }

  const levelProgress = Math.min(100, 20 + totalShared * 12);

  return (
    <AppShell>
      <DashboardHome
        profileName={profileName}
        currentCycle={currentCycle}
        career={UNT_DERECHO.career}
        totalShared={totalShared}
        totalOrganizers={totalOrganizers}
        totalDownloads={totalDownloads}
        totalLikes={totalLikes}
        totalFavorites={totalFavorites}
        levelProgress={levelProgress}
      />
    </AppShell>
  );
}
