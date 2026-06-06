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
  searchParams: Promise<{ new?: string; created?: string; share?: string }>;
}) {
  const { new: newOrganizerId, created, share } = await searchParams;

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

  const loginHref = share
    ? `/auth?next=${encodeURIComponent(`/organizers?share=${share}`)}`
    : "/auth";

  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Inicia sesión</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {share
              ? "Necesitas una cuenta para ver este organizador compartido."
              : "Entra para ver tus organizadores visuales."}
          </p>
          <Link
            href={loginHref}
            className="tron-btn-primary mt-8 inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold"
          >
            Entrar
          </Link>
        </section>
      </AppShell>
    );
  }

  const admin = createAdminClient();

  const [{ data, error }, { data: sharedData }] = await Promise.all([
    admin
      .from("organizers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    share
      ? admin
          .from("organizers")
          .select("*")
          .eq("share_token", share)
          .eq("is_shared", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const organizers = (data ?? []) as OrganizerRecord[];
  const sharedOrganizer = (sharedData as OrganizerRecord | null) ?? null;
  const shareInvalid = Boolean(share && !sharedOrganizer);

  return (
    <AppShell>
      <ToastProvider>
        <div className="organizers-studio flex min-h-[calc(100dvh-4.5rem)] flex-1 flex-col">
          {shareInvalid ? (
            <div className="organizer-glass mx-auto mb-4 mt-6 max-w-[1280px] rounded-2xl border border-red-500/20 px-5 py-4 text-sm text-red-400">
              El enlace de organizador no es válido o dejó de estar compartido.
            </div>
          ) : null}

          <OrganizersWorkspace
            initialOrganizers={organizers}
            highlightId={newOrganizerId}
            created={created === "1"}
            sharedOrganizer={sharedOrganizer}
          />

          {error ? (
            <p className="mx-auto mt-4 max-w-[1280px] px-3 text-sm text-red-500">{error.message}</p>
          ) : null}
        </div>
      </ToastProvider>
    </AppShell>
  );
}
