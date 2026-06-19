import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Heart, User } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { MaterialDetailActions } from "@/components/materials/material-detail-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMaterialBadges } from "@/lib/materials/badges";
import { recordToMaterial } from "@/lib/materials/mapper";
import { resolveUserEmail } from "@/lib/auth/user-email";
import { isJurisprudenceModerator } from "@/lib/jurisprudence/unt-access";
import type { MaterialRecord } from "@/types/material";

export const dynamic = "force-dynamic";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: materialId } = await params;
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await admin
    .schema("public")
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .single();

  if (error || !data) {
    notFound();
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: recentViews }, { data: favorite }] = await Promise.all([
    admin
      .schema("public")
      .from("material_views")
      .select("id", { count: "exact", head: true })
      .eq("material_id", materialId)
      .gte("viewed_at", sevenDaysAgo),
    user
      ? admin
          .schema("public")
          .from("favorites")
          .select("id")
          .eq("material_id", materialId)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const material = {
    ...recordToMaterial(data as MaterialRecord),
    isFavorite: Boolean(favorite),
  };
  const badges = getMaterialBadges(material, recentViews ?? 0);
  const email = user ? resolveUserEmail(user) : null;
  const isModerator = email ? await isJurisprudenceModerator(email) : false;

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Detalle del material</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#F5F7FA]">{material.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Información completa del material compartido en la red colaborativa.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/library" className="tron-btn-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
              Volver a Biblioteca
            </Link>
            <Link href={`/library/${material.courseId}`} className="tron-btn-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
              Ver curso
            </Link>
          </div>
        </div>

        <div className="tron-panel rounded-2xl p-8">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">{material.courseName}</p>
              <p className="mt-3 text-sm text-muted-foreground">{material.cycleLabel}</p>
              {badges.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-[rgba(0,255,213,0.25)] bg-[rgba(0,255,213,0.08)] px-3 py-1 text-xs font-semibold text-[#00FFD5]">
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-6 text-lg font-bold text-[#F5F7FA]">Descripción</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{material.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="tron-stat rounded-xl p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Autor</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-[#F5F7FA]">
                    <User size={16} className="text-[#00FFD5]" /> {material.authorName}
                  </p>
                </div>
                <div className="tron-stat rounded-xl p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Creado</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-[#F5F7FA]">
                    <CalendarDays size={16} className="text-[#00FFD5]" /> {new Date(material.createdAt ?? "").toLocaleDateString("es-PE")}
                  </p>
                </div>
              </div>
            </div>

            <aside className="space-y-4 rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.5)] p-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Vistas", value: material.views },
                  { label: "Likes", value: material.likes, icon: Heart },
                  { label: "Bajas", value: material.downloads },
                ].map((stat) => (
                  <div key={stat.label} className="tron-stat rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 inline-flex items-center justify-center gap-1 text-xl font-bold text-[#F5F7FA]">
                      {stat.icon ? <stat.icon size={16} className="text-[#FF8A00]" /> : null}
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <MaterialDetailActions
                materialId={material.id ?? materialId}
                fileName={material.fileName}
                fileUrl={material.fileUrl}
                initialFavorite={material.isFavorite}
                initialLikes={material.likes}
                initialViews={material.views}
                isModerator={isModerator}
              />
            </aside>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
