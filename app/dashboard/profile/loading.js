export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-border rounded-full" />
          <div>
            <div className="h-6 w-36 bg-border rounded-lg mb-2" />
            <div className="h-3 w-48 bg-border rounded" />
            <div className="flex gap-3 mt-2">
              <div className="h-3 w-16 bg-border rounded" />
              <div className="h-3 w-20 bg-border rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Sport tabs */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 bg-border rounded-full" />
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl p-4"
          >
            <div className="h-3 w-20 bg-border rounded mb-2" />
            <div className="h-7 w-12 bg-border rounded" />
          </div>
        ))}
      </div>

      {/* Stats table */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="h-4 w-28 bg-border rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-bg rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
