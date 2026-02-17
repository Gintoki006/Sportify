export default function MatchesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-border rounded-lg" />
          <div className="h-4 w-64 bg-border rounded-lg mt-2" />
        </div>
        <div className="h-10 w-36 bg-border rounded-xl" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-border rounded-full" />
        ))}
      </div>

      {/* Match cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 bg-border rounded-full" />
              <div className="h-4 w-16 bg-border rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-5 w-28 bg-border rounded" />
                <div className="h-3 w-16 bg-border rounded" />
              </div>
              <div className="h-8 w-12 bg-border rounded" />
              <div className="space-y-1 text-right">
                <div className="h-5 w-28 bg-border rounded" />
                <div className="h-3 w-16 bg-border rounded" />
              </div>
            </div>
            <div className="h-3 w-32 bg-border rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
