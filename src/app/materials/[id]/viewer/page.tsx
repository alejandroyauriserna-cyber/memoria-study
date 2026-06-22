import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { MaterialDocumentViewer } from "@/components/materials/material-document-viewer";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function MaterialViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasSupabaseEnv()) {
    redirect("/library");
  }

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/materials/${id}/viewer`);
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <MaterialDocumentViewer materialId={id} />
      </section>
    </AppShell>
  );
}
