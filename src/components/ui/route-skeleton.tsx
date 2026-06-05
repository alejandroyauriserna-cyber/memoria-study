export function RouteSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-4 px-4 py-8 sm:px-6">
      <div className="h-8 w-48 rounded-lg bg-[rgba(0,255,213,0.08)]" />
      <div className="h-32 rounded-2xl bg-[rgba(0,255,213,0.06)]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-[rgba(0,255,213,0.05)]" />
        ))}
      </div>
    </div>
  );
}
