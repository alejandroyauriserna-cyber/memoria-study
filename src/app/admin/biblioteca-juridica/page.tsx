import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { JurisprudenceAdminWorkspace } from "@/components/jurisprudence/jurisprudence-admin-workspace";
import { resolveUserEmail } from "@/lib/auth/user-email";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { isJurisprudenceModerator } from "@/lib/jurisprudence/unt-access";

export const metadata = {
  title: "Admin · Biblioteca Jurídica",
  description: "Panel de moderación y estadísticas de la Biblioteca Jurídica MemoriaStudy.",
};

export const dynamic = "force-dynamic";

export default async function JurisprudenceAdminPage() {
  if (!hasSupabaseEnv()) {
    redirect("/biblioteca-juridica");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isJurisprudenceModerator(resolveUserEmail(user))) {
    redirect("/biblioteca-juridica");
  }

  return (
    <AppShell>
      <div className="ms-home bj-page-wrap mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <JurisprudenceAdminWorkspace />
      </div>
    </AppShell>
  );
}
