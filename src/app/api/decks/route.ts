import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deckToInsert, recordToDeck } from "@/lib/decks/mapper";
import { studyDeckSchema } from "@/lib/ai/schema";
import { hasSupabaseEnv } from "@/lib/env";
import type { DeckRecord } from "@/types/study";

const requestSchema = z.object({
  deck: studyDeckSchema.extend({
    isPublic: z.boolean().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json(
        { error: "Supabase is not configured. Copy .env.example to .env.local first." },
        { status: 503 },
      );
    }

    const body = requestSchema.parse(await request.json());
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("decks")
      .insert(deckToInsert(body.deck, user?.id ?? null))
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ deck: recordToDeck(data as DeckRecord) }, { status: 201 });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Unable to save deck." },
      { status: 500 },
    );
  }
}
