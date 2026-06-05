import { AppShell } from "@/components/ui/shell";
import { RouteSkeleton } from "@/components/ui/route-skeleton";

export default function OrganizersLoading() {
  return (
    <AppShell>
      <RouteSkeleton rows={8} />
    </AppShell>
  );
}
