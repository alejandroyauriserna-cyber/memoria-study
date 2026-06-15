import { AppShell } from "@/components/ui/shell";
import { RouteSkeleton } from "@/components/ui/route-skeleton";

export default function CuadernoClassLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <RouteSkeleton rows={4} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Abriendo tu cuaderno inteligente…
        </p>
      </div>
    </AppShell>
  );
}
