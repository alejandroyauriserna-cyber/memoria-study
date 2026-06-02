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
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Organizadores</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Organizadores no disponibles</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Revisa la conexión de Supabase para acceder a tu biblioteca de organizadores.
          </p>
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
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Organizadores</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Inicia sesión para ver tus organizadores</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Crea organizadores desde tus materiales guardados para visualizarlos aquí.
          </p>
          <Link
            href="/auth"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90"
          >
            Iniciar sesión
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
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <OrganizersWorkspace
            initialOrganizers={organizers}
            highlightId={newOrganizerId}
            created={created === "1"}
          />

          {error ? (
            <p className="mt-6 text-sm text-red-500">
              Error cargando organizadores: {error.message ?? "Intenta de nuevo."}
            </p>
          ) : null}
        </section>
      </ToastProvider>
    </AppShell>
  );
}
