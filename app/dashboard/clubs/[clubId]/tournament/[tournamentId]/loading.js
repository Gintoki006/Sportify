export default function TournamentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="h-3 w-24 bg-border rounded mb-3" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-border rounded-lg" />
          <div className="h-7 w-48 bg-border rounded-lg" />
          <div className="h-5 w-16 bg-border rounded-full" />
        </div>
        <div className="h-3 w-40 bg-border rounded mt-2" />
      </div>

      {/* Bracket */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="h-4 w-16 bg-border rounded mb-6" />
        <div className="flex gap-6">
          {[1, 2, 3].map((col) => (
            <div
              key={col}
              className="flex flex-col gap-4"
              style={{ minWidth: 220 }}
            >
              <div className="h-5 w-24 mx-auto bg-border rounded-full" />
              {Array.from({ length: Math.max(1, 4 - col) }).map((_, i) => (
                <div key={i} className="h-20 bg-bg rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
