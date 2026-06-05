import { AppShell } from "@/components/ui/shell";
import { PremiumDashboardSkeleton } from "@/components/dashboard/premium-dashboard-skeleton";

export default function DashboardLoading() {
  return (
    <AppShell>
      <PremiumDashboardSkeleton />
    </AppShell>
  );
}
