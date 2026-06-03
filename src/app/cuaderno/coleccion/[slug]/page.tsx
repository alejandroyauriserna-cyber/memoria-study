import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { CuadernoCollectionView } from "@/components/cuaderno/cuaderno-collection-view";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadCollectionsForUser } from "@/lib/cuaderno/collections-server";
import { recordToCuadernoClass } from "@/lib/cuaderno/mapper";
import type { SmartCollectionSlug } from "@/lib/cuaderno/smart-collections";
import { hasSupabaseEnv } from "@/lib/env";
import type { CuadernoClassRecord } from "@/types/cuaderno";

const VALID: SmartCollectionSlug[] = ["favoritos", "examenes", "resumenes"];

export default async function CuadernoCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!hasSupabaseEnv()) notFound();

  const { slug } = await params;
  if (!VALID.includes(slug as SmartCollectionSlug)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createAdminClient();
  const { data } = await admin.from("cuaderno_classes").select("*").eq("user_id", user.id);

  const classes = (data ?? []).map((row) => recordToCuadernoClass(row as CuadernoClassRecord));

  let initialSnapshot;
  try {
    initialSnapshot = await loadCollectionsForUser(user.id);
  } catch {
    initialSnapshot = undefined;
  }

  return (
    <AppShell>
      <CuadernoCollectionView
        slug={slug as SmartCollectionSlug}
        classes={classes}
        initialSnapshot={initialSnapshot}
      />
    </AppShell>
  );
}
