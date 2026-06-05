import "@/components/dashboard/premium-dashboard.css";

export function PremiumDashboardSkeleton() {
  return (
    <div className="dash-home ms-home animate-pulse" aria-hidden>
      <div className="dash-home__head">
        <div className="space-y-3">
          <div className="h-7 w-40 rounded-full bg-[rgba(0,255,213,0.08)]" />
          <div className="h-10 w-64 max-w-full rounded-lg bg-[rgba(255,255,255,0.06)]" />
        </div>
        <div className="h-4 w-48 rounded bg-[rgba(255,255,255,0.04)]" />
      </div>
      <div className="dash-home__hero min-h-[180px]" />
      <div className="dash-home__bento">
        <div className="dash-home__glass dash-home__cuaderno min-h-[200px]" />
        <div className="dash-home__glass dash-home__library min-h-[120px]" />
        <div className="dash-home__glass dash-home__insight min-h-[120px]" />
        <div className="dash-home__glass dash-home__recent min-h-[160px]" />
      </div>
    </div>
  );
}
