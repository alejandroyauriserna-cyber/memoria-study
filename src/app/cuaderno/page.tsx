import Link from "next/link";
import { AppShell } from "@/components/ui/shell";
import { CuadernoWorkspace } from "@/components/cuaderno/cuaderno-workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordToCuadernoClass } from "@/lib/cuaderno/mapper";
import { hasSupabaseEnv } from "@/lib/env";
import type { CuadernoClassRecord } from "@/types/cuaderno";

export default async function CuadernoPage() {
  if (!hasSupabaseEnv()) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Cuaderno no disponible</h1>
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
        <section className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-semibold">Cuaderno Inteligente</h1>
          <p className="mt-2 text-muted-foreground">Inicia sesión para guardar apuntes y consultar el diccionario jurídico.</p>
          <Link href="/auth" className="tron-btn-primary mt-8 inline-flex h-12 items-center rounded-xl px-6 text-sm font-semibold">
            Entrar
          </Link>
        </section>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("cuaderno_classes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const classes = (data ?? []).map((row) => recordToCuadernoClass(row as CuadernoClassRecord));

  return (
    <AppShell>
      <CuadernoWorkspace initialClasses={classes} />
    </AppShell>
  );
}
