import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { GuidedLegalStudyWorkspace } from "@/components/guided-study/guided-legal-study-workspace";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function GuidedStudyPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { materialId } = await params;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/auth?next=/estudio-guiado/${materialId}`);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-[1600px] px-2 py-2 sm:px-3 lg:px-4">
        <GuidedLegalStudyWorkspace materialId={materialId} />
      </section>
    </AppShell>
  );
}
