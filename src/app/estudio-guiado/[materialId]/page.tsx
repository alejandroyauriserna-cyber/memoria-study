import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { GuidedStudyLoader } from "@/components/guided-study/guided-study-loader";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  return {
    title: "Estudio guiado",
    description: "Estudia con el tutor jurídico página por página.",
  };
}

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
      <section className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-2 py-2 sm:px-3 lg:px-4">
        <GuidedStudyLoader materialId={materialId} />
      </section>
    </AppShell>
  );
}
