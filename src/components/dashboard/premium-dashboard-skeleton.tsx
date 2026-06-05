import "@/components/dashboard/premium-dashboard.css";

export function PremiumDashboardSkeleton() {
  return (
    <div className="home-app animate-pulse" aria-hidden>
      <div className="home-app__top">
        <div className="h-8 w-56 rounded-lg bg-[rgba(255,255,255,0.06)]" />
        <div className="h-4 w-32 rounded bg-[rgba(255,255,255,0.04)]" />
      </div>
      <div className="home-app__command min-h-[220px]">
        <div className="home-app__command-grid">
          <div className="home-app__command-main gap-4">
            <div className="h-3 w-28 rounded bg-[rgba(255,255,255,0.05)]" />
            <div className="h-7 w-64 max-w-full rounded bg-[rgba(255,255,255,0.07)]" />
            <div className="h-4 w-48 rounded bg-[rgba(255,255,255,0.04)]" />
            <div className="flex gap-2">
              <div className="h-10 w-24 rounded-lg bg-[rgba(255,255,255,0.06)]" />
              <div className="h-10 w-28 rounded-lg bg-[rgba(255,255,255,0.05)]" />
            </div>
          </div>
          <div className="home-app__stats-rail">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="home-app__stat">
                <div className="h-5 w-12 rounded bg-[rgba(255,255,255,0.06)]" />
                <div className="mt-1 h-3 w-20 rounded bg-[rgba(255,255,255,0.04)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="home-app__bento">
        <div className="home-app__panel min-h-[140px]" />
        <div className="home-app__panel min-h-[140px]" />
      </div>
    </div>
  );
}
