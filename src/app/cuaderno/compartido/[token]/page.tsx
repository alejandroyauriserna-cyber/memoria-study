import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { CuadernoSharedPreview } from "@/components/cuaderno/cuaderno-shared-preview";
import { getCuadernoClassByShareToken, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { joinCuadernoByToken } from "@/lib/cuaderno/share-server";
import { hasSupabaseEnv } from "@/lib/env";

type PageProps = { params: Promise<{ token: string }> };

export default async function CuadernoCompartidoPage({ params }: PageProps) {
  const { token } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Enlace no disponible</h1>
        </section>
      </AppShell>
    );
  }

  const shared = await getCuadernoClassByShareToken(token);
  if (!shared) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Enlace no válido</h1>
          <p className="mt-2 text-muted-foreground">Este apunte ya no está compartido o el enlace expiró.</p>
          <Link href="/cuaderno" className="tron-btn-primary mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-semibold">
            Ir al cuaderno
          </Link>
        </section>
      </AppShell>
    );
  }

  const user = await requireCuadernoUser();

  if (user && shared.sharePermission === "edit") {
    try {
      const result = await joinCuadernoByToken(user.id, token);
      redirect(`/cuaderno/${result.classId}`);
    } catch {
      redirect(`/cuaderno/${shared.cuadernoClass.id}`);
    }
  }

  return (
    <AppShell>
      <CuadernoSharedPreview
        cuadernoClass={shared.cuadernoClass}
        sharePermission={shared.sharePermission}
        isLoggedIn={Boolean(user)}
        token={token}
      />
    </AppShell>
  );
}
