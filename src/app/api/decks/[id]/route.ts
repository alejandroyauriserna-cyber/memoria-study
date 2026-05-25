import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordToDeck } from "@/lib/decks/mapper";
import { hasSupabaseEnv } from "@/lib/env";
import type { DeckRecord } from "@/types/study";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const { id } = await params;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("decks")
      .select()
      .eq("id", id)
      .eq("is_public", true)
      .single();

    if (error) throw error;
    return NextResponse.json({ deck: recordToDeck(data as DeckRecord) });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Deck not found." },
      { status: 404 },
    );
  }
}
