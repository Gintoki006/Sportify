'use client';

/**
 * Skeleton loading placeholders for dashboard sections.
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded bg-border" />
        <div className="w-20 h-3 rounded bg-border" />
      </div>
      <div className="w-14 h-8 rounded bg-border" />
    </div>
  );
}

export function GoalRingSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
      <div className="w-28 h-3 rounded bg-border mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-3">
            <div className="w-20 h-20 rounded-full bg-border" />
            <div className="w-16 h-3 rounded bg-border" />
            <div className="w-12 h-2 rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
      <div className="w-28 h-3 rounded bg-border mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <div className="w-9 h-9 rounded-lg bg-border shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="w-24 h-3 rounded bg-border" />
              <div className="w-40 h-2.5 rounded bg-border" />
            </div>
            <div className="w-14 h-2.5 rounded bg-border shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-24 h-3 rounded bg-border" />
        <div className="flex gap-2">
          <div className="w-20 h-6 rounded-full bg-border" />
          <div className="w-20 h-6 rounded-full bg-border" />
        </div>
      </div>
      <div className="h-64 sm:h-72 flex items-end gap-2 pt-8">
        {[40, 65, 30, 80, 55, 70, 45, 90, 60, 50].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-border rounded-t-md"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting skeleton */}
      <div className="space-y-2 animate-pulse">
        <div className="w-64 h-8 rounded bg-border" />
        <div className="w-48 h-4 rounded bg-border" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-2">
          <GoalRingSkeleton />
        </div>
      </div>

      <ActivityFeedSkeleton />
    </div>
  );
}
