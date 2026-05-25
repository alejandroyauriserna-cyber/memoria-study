import { notFound } from "next/navigation";
import { AppShell } from "@/components/ui/shell";
import { StudyHub } from "@/components/study/study-hub";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordToDeck } from "@/lib/decks/mapper";
import { hasSupabaseEnv } from "@/lib/env";
import type { DeckRecord } from "@/types/study";

export default async function PublicDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasSupabaseEnv()) {
    notFound();
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("decks")
    .select()
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!data) {
    notFound();
  }

  const deck = recordToDeck(data as DeckRecord);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-accent">{deck.sourceName}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{deck.title}</h1>
          {deck.academic ? (
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {deck.academic.yearLabel} · {deck.academic.cycleLabel} ·{" "}
              {deck.academic.courseName} · {deck.academic.weekTitle}
            </p>
          ) : null}
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {deck.summary}
          </p>
        </div>
        <StudyHub deck={deck} />
      </section>
    </AppShell>
  );
}
