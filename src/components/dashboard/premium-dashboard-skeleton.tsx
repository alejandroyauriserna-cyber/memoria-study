import "@/components/dashboard/premium-dashboard.css";

export function PremiumDashboardSkeleton() {
  return (
    <div className="premium-dash animate-pulse" aria-hidden>
      <div className="premium-dash__ambient" />
      <div className="premium-dash__header">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-[var(--pd-muted-line)]" />
          <div className="h-12 w-72 max-w-full rounded-xl bg-[var(--pd-muted-line)]" />
          <div className="h-4 w-56 max-w-full rounded bg-[var(--pd-muted-line)]" />
        </div>
        <div className="h-8 w-64 max-w-full rounded-full bg-[var(--pd-muted-line)]" />
      </div>

      <div className="premium-dash__bento">
        <div className="premium-dash__glass premium-dash__hero min-h-[340px]" />
        <div className="premium-dash__glass premium-dash__cuaderno min-h-[340px]" />
        <div className="premium-dash__glass premium-dash__insight min-h-[148px]" />
        <div className="premium-dash__glass premium-dash__recent min-h-[148px]" />
        <div className="premium-dash__nav-strip">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-24 rounded bg-[var(--pd-muted-line)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
