export default function ClubsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-border rounded-lg" />
          <div className="h-4 w-64 bg-border rounded-lg mt-2" />
        </div>
        <div className="h-10 w-32 bg-border rounded-xl" />
      </div>

      {/* Join bar */}
      <div className="h-12 bg-border rounded-xl" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-2xl p-6 space-y-3"
          >
            <div className="h-5 w-32 bg-border rounded" />
            <div className="h-3 w-full bg-border rounded" />
            <div className="h-3 w-20 bg-border rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
