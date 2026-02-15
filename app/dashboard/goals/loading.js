export default function GoalsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-border rounded-lg" />
          <div className="h-4 w-56 bg-border rounded-lg mt-2" />
        </div>
        <div className="h-10 w-28 bg-border rounded-xl" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl p-4"
          >
            <div className="h-3 w-16 bg-border rounded mb-2" />
            <div className="h-7 w-12 bg-border rounded" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-border rounded-lg" />
        <div className="h-8 w-24 bg-border rounded-lg" />
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-2xl p-5 space-y-3"
          >
            <div className="h-5 w-40 bg-border rounded" />
            <div className="h-3 w-full bg-border rounded-full" />
            <div className="h-3 w-24 bg-border rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
