import { AppShell } from "@/components/ui/shell";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: any }) {
  const resolvedParams = await params;

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify({ cycleNumber: resolvedParams?.cycleNumber })}
        </pre>
      </section>
    </AppShell>
  );
}
