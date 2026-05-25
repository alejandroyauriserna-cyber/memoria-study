import Link from "next/link";
import { AppShell } from "@/components/ui/shell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Deck unavailable</h1>
        <p className="mt-3 text-muted-foreground">
          This deck is private, missing, or Supabase has not been configured.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background"
        >
          Open dashboard
        </Link>
      </section>
    </AppShell>
  );
}
