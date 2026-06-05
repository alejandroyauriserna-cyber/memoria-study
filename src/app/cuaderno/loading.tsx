import { AppShell } from "@/components/ui/shell";
import { RouteSkeleton } from "@/components/ui/route-skeleton";

export default function CuadernoLoading() {
  return (
    <AppShell>
      <RouteSkeleton rows={5} />
    </AppShell>
  );
}
