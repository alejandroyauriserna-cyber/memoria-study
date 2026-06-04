import { AppShell } from "@/components/ui/shell";
import { LegalSourcesWorkspace } from "@/components/legal-sources/legal-sources-workspace";

export const dynamic = "force-dynamic";

export default function LegalSourcesPage() {
  return (
    <AppShell>
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <LegalSourcesWorkspace />
      </section>
    </AppShell>
  );
}
