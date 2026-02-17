export default function MatchDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 bg-surface rounded" />

      {/* Match header card */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 rounded-full bg-muted/20" />
          <div className="h-6 w-20 rounded-full bg-muted/20" />
        </div>

        {/* Score area */}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="h-5 w-28 bg-muted/20 rounded" />
            <div className="h-10 w-16 bg-muted/20 rounded" />
          </div>
          <div className="h-6 w-8 bg-muted/20 rounded" />
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="h-5 w-28 bg-muted/20 rounded" />
            <div className="h-10 w-16 bg-muted/20 rounded" />
          </div>
        </div>

        {/* Info bar */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="h-3 w-36 bg-muted/20 rounded" />
          <div className="h-3 w-28 bg-muted/20 rounded" />
        </div>
      </div>

      {/* Invites section skeleton */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-4 w-28 bg-muted/20 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-muted/20" />
            <div className="h-4 w-32 bg-muted/20 rounded" />
            <div className="ml-auto h-5 w-16 rounded-full bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
