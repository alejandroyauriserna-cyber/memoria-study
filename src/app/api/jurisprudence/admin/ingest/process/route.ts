import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  processIngestItem,
  type IngestItemRow,
} from "@/lib/jurisprudence/process-ingest-item";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  batchId: z.string().uuid(),
  limit: z.number().int().min(1).max(10).optional().default(5),
});

export async function POST(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const body = bodySchema.parse(await request.json());
    const admin = createAdminClient();

    await admin
      .from("jurisprudence_ingest_batches")
      .update({ status: "processing" })
      .eq("id", body.batchId);

    const { data: queued } = await admin
      .from("jurisprudence_ingest_items")
      .select("*")
      .eq("batch_id", body.batchId)
      .in("status", ["queued", "failed"])
      .order("created_at", { ascending: true })
      .limit(body.limit);

    const items = (queued ?? []) as IngestItemRow[];
    const results: Array<{ id: string; status: string }> = [];

    for (const item of items) {
      const status = await processIngestItem(admin, item);
      results.push({ id: item.id, status });
    }

    const { data: allItems } = await admin
      .from("jurisprudence_ingest_items")
      .select("status")
      .eq("batch_id", body.batchId);

    const statuses = (allItems ?? []).map((r) => r.status as string);
    const processedCount = statuses.filter(
      (s) => !["queued", "extracting", "analyzing"].includes(s),
    ).length;
    const remainingCount = statuses.filter((s) => s === "queued" || s === "failed").length;

    await admin
      .from("jurisprudence_ingest_batches")
      .update({
        processed_count: processedCount,
        status: remainingCount > 0 ? "processing" : "review",
      })
      .eq("id", body.batchId);

    return NextResponse.json({
      processed: results.length,
      results,
      remaining: remainingCount,
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al procesar lote." },
      { status: 500 },
    );
  }
}
