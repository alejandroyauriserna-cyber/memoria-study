import { AppShell } from "@/components/ui/shell";
import { RouteSkeleton } from "@/components/ui/route-skeleton";

export default function GuidedStudyLoading() {
  return (
    <AppShell>
      <RouteSkeleton rows={3} />
    </AppShell>
  );
}
