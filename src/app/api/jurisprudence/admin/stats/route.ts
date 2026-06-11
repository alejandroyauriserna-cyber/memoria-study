import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";

export const runtime = "nodejs";

type StatusRow = { status: string | null };
type MateriaRow = { materia: string; count: number };

export async function GET() {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const admin = createAdminClient();

    const [
      statusRes,
      communityRes,
      reportsRes,
      weekRes,
      materiaRes,
    ] = await Promise.all([
      admin.from("jurisprudence_documents").select("status"),
      admin
        .from("jurisprudence_documents")
        .select("id", { count: "exact", head: true })
        .not("submitted_by", "is", null),
      admin
        .from("jurisprudence_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      admin
        .from("jurisprudence_documents")
        .select("id", { count: "exact", head: true })
        .not("submitted_by", "is", null)
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      admin.from("jurisprudence_documents").select("materia").eq("status", "published"),
    ]);

    const byStatus: Record<string, number> = {
      published: 0,
      pending: 0,
      rejected: 0,
    };

    for (const row of statusRes.data ?? []) {
      const key = (row as { status?: string }).status ?? "published";
      byStatus[key] = (byStatus[key] ?? 0) + 1;
    }

    const materiaCounts: Record<string, number> = {};
    for (const row of materiaRes.data ?? []) {
      const materia = (row as MateriaRow).materia;
      materiaCounts[materia] = (materiaCounts[materia] ?? 0) + 1;
    }

    const topMaterias = Object.entries(materiaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([materia, count]) => ({ materia, count }));

    return NextResponse.json({
      totals: {
        all: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
        published: byStatus.published ?? 0,
        pending: byStatus.pending ?? 0,
        rejected: byStatus.rejected ?? 0,
        community: communityRes.count ?? 0,
        openReports: reportsRes.count ?? 0,
        submissionsLast7Days: weekRes.count ?? 0,
      },
      topMaterias,
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al cargar estadísticas." },
      { status: 500 },
    );
  }
}
