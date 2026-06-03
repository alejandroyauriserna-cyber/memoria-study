import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { CuadernoClassEditor } from "@/components/cuaderno/cuaderno-class-editor";
import { getCuadernoClassForUser, requireCuadernoUser } from "@/lib/cuaderno/auth";
import { hasSupabaseEnv } from "@/lib/env";

type PageProps = { params: Promise<{ classId: string }> };

export default async function CuadernoClassPage({ params }: PageProps) {
  const { classId } = await params;

  if (!hasSupabaseEnv()) notFound();

  const user = await requireCuadernoUser();
  if (!user) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Link href="/auth" className="tron-btn-primary inline-flex rounded-xl px-6 py-3 text-sm font-semibold">
            Iniciar sesión
          </Link>
        </section>
      </AppShell>
    );
  }

  const cuadernoClass = await getCuadernoClassForUser(classId, user.id);
  if (!cuadernoClass) notFound();

  return (
    <AppShell>
      <CuadernoClassEditor initialClass={cuadernoClass} />
    </AppShell>
  );
}
