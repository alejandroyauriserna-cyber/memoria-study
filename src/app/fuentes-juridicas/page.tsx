import { AppShell } from "@/components/ui/shell";
import { LegalSourcesWorkspace } from "@/components/legal-sources/legal-sources-workspace";

export const dynamic = "force-dynamic";

export default function LegalSourcesPage() {
  return (
    <AppShell>
      <div className="ms-home fuentes-page mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <LegalSourcesWorkspace />
      </div>
    </AppShell>
  );
}
