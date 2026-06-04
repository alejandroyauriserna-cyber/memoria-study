import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
      <section className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6">
        <Link
          href={`/materials/${materialId}`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#00FFD5]"
        >
          <ArrowLeft size={14} />
          Volver al material
        </Link>
        <GuidedLegalStudyWorkspace materialId={materialId} />
      </section>
    </AppShell>
  );
}
