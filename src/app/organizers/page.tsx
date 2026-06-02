import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { ToastProvider } from "@/components/ui/toast";
import { OrganizersWorkspace } from "@/components/organizers/organizers-workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { OrganizerRecord } from "@/types/organizer";

export default async function OrganizersPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; created?: string }>;
}) {
  const { new: newOrganizerId, created } = await searchParams;

  if (!hasSupabaseEnv()) {
    return (
      <AppShell>
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Organizadores no disponibles</h1>
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
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Inicia sesión</h1>
          <Link
            href="/auth"
            className="tron-btn-primary mt-8 inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold"
          >
            Entrar
          </Link>
        </section>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const organizers = (data ?? []) as OrganizerRecord[];

  return (
    <AppShell>
      <ToastProvider>
        <div className="organizers-studio min-h-0 flex-1">
          <section className="ms-page mx-auto max-w-[1400px] px-3 py-6 sm:px-5 sm:py-8">
            <OrganizersWorkspace
              initialOrganizers={organizers}
              highlightId={newOrganizerId}
              created={created === "1"}
            />

            {error ? (
              <p className="mt-4 text-sm text-red-500">{error.message}</p>
            ) : null}
          </section>
        </div>
      </ToastProvider>
    </AppShell>
  );
}
