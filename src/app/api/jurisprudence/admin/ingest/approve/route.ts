import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  publishIngestItem,
  type IngestItemRow,
} from "@/lib/jurisprudence/process-ingest-item";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  batchId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).optional(),
  approveAll: z.boolean().optional(),
  publish: z.boolean().optional().default(true),
  onlyReady: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const body = bodySchema.parse(await request.json());
    const admin = createAdminClient();

    let query = admin
      .from("jurisprudence_ingest_items")
      .select("*")
      .eq("batch_id", body.batchId);

    if (body.itemIds?.length) {
      query = query.in("id", body.itemIds);
    } else if (body.approveAll) {
      query = query.in("status", body.onlyReady ? ["ready"] : ["ready", "low_confidence"]);
    } else {
      return NextResponse.json({ error: "Indica itemIds o approveAll." }, { status: 400 });
    }

    const { data: items } = await query;
    const rows = (items ?? []) as IngestItemRow[];

    const approved: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const item of rows) {
      if (item.status === "duplicate" || item.status === "published") {
        failed.push({ id: item.id, error: `Estado: ${item.status}` });
        continue;
      }
      const result = await publishIngestItem(admin, item, auth.user.id, body.publish);
      if ("error" in result) {
        failed.push({ id: item.id, error: result.error });
      } else {
        approved.push(result.documentId);
      }
    }

    const { count: publishedCount } = await admin
      .from("jurisprudence_ingest_items")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", body.batchId)
      .eq("status", "published");

    await admin
      .from("jurisprudence_ingest_batches")
      .update({ published_count: publishedCount ?? 0, status: "review" })
      .eq("id", body.batchId);

    return NextResponse.json({
      approved: approved.length,
      failed: failed.length,
      documentIds: approved,
      errors: failed,
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al aprobar." },
      { status: 500 },
    );
  }
}
