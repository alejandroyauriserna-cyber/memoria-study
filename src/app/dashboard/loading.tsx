import { AppShell } from "@/components/ui/shell";
import { RouteSkeleton } from "@/components/ui/route-skeleton";

export default function DashboardLoading() {
  return (
    <AppShell>
      <RouteSkeleton rows={6} />
    </AppShell>
  );
}
