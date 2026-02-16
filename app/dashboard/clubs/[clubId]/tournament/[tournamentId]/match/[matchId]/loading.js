export default function CricketMatchLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="h-4 w-32 bg-border/50 rounded mb-3" />
        <div className="h-8 w-64 bg-border/50 rounded mb-2" />
        <div className="flex gap-4 mt-3">
          <div className="h-12 w-40 bg-border/50 rounded-xl" />
          <div className="h-12 w-12 bg-border/50 rounded-xl" />
          <div className="h-12 w-40 bg-border/50 rounded-xl" />
        </div>
      </div>

      {/* Scorecard skeleton */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="h-6 w-48 bg-border/50 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-border/30 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
