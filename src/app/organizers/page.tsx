import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { OrganizerRecord } from "@/types/organizer";

function formatOrganizerContent(content: unknown) {
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(content ?? "");
  }
}

export default async function OrganizersPage() {
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
          <Link href="/auth" className="mt-8 inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90">
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
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Organizadores</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">Tus organizadores visuales</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Aquí encontrarás tus mapas conceptuales, cuadros sinópticos y otros recursos visuales.
              </p>
            </div>
            <Link href="/library" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-muted px-6 text-sm font-semibold text-foreground hover:bg-card">
              Buscar materiales
            </Link>
          </div>
        </div>

        {organizers.length ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {organizers.map((organizer) => (
              <article key={organizer.id} className="rounded-[32px] border border-border bg-background p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">{String(organizer.organizer_type ?? "organizador").replace(/-/g, " ")}</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{organizer.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{organizer.description}</p>
                  </div>
                  <div className="rounded-3xl bg-muted px-4 py-3 text-right text-sm text-muted-foreground">
                    <p>{organizer.cycle_label}</p>
                    <p className="mt-1">{new Date(organizer.created_at).toLocaleDateString("es-PE")}</p>
                  </div>
                </div>
                <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-muted px-4 py-4 text-sm">
                  <pre className="whitespace-pre-wrap break-words text-sm leading-6">
                    {formatOrganizerContent(organizer.content)}
                  </pre>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[32px] border border-dashed border-border bg-muted p-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-3xl">✨</div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-accent">Todavía no tienes organizadores visuales</p>
            <h2 className="mt-4 text-3xl font-semibold text-foreground">Crea tu primer organizador</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Utiliza el botón de IA en un material guardado para generar un organizador visual y comenzar a estudiar con más claridad.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/library" className="inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90">
                Buscar materiales
              </Link>
              <Link href="/upload-material" className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground hover:bg-muted">
                Subir material
              </Link>
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-6 text-sm text-red-500">Error cargando organizadores: {error.message ?? "Intenta de nuevo."}</p>
        ) : null}
      </section>
    </AppShell>
  );
}
