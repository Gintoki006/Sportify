export default function ClubDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="h-7 w-48 bg-border rounded-lg mb-3" />
        <div className="h-3 w-72 bg-border rounded mb-2" />
        <div className="flex gap-3">
          <div className="h-3 w-20 bg-border rounded" />
          <div className="h-3 w-24 bg-border rounded" />
        </div>
      </div>

      {/* Members */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="h-4 w-20 bg-border rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-bg"
            >
              <div className="w-9 h-9 bg-border rounded-full" />
              <div>
                <div className="h-4 w-24 bg-border rounded mb-1" />
                <div className="h-3 w-16 bg-border rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tournaments */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="h-4 w-28 bg-border rounded mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-bg rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
