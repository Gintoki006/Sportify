export default function StatsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-24 bg-surface rounded-lg" />
        <div className="h-4 w-64 bg-surface rounded-lg mt-2" />
      </div>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex gap-4 px-4 py-3 border-b border-border/50"
          >
            <div className="h-4 w-20 bg-bg rounded" />
            <div className="h-4 w-24 bg-bg rounded" />
            <div className="h-4 w-40 bg-bg rounded" />
            <div className="h-4 w-16 bg-bg rounded" />
            <div className="h-4 w-16 bg-bg rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
