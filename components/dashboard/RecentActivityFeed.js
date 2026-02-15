'use client';

const SPORT_META = {
  FOOTBALL: { emoji: '⚽', label: 'Football', color: 'bg-green-500' },
  CRICKET: { emoji: '🏏', label: 'Cricket', color: 'bg-amber-500' },
  BASKETBALL: { emoji: '🏀', label: 'Basketball', color: 'bg-red-500' },
  BADMINTON: { emoji: '🏸', label: 'Badminton', color: 'bg-cyan-500' },
  TENNIS: { emoji: '🎾', label: 'Tennis', color: 'bg-lime-500' },
  VOLLEYBALL: { emoji: '🏐', label: 'Volleyball', color: 'bg-yellow-500' },
};

function formatRelativeDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMetricSummary(metrics) {
  if (!metrics || typeof metrics !== 'object') return '';
  const entries = Object.entries(metrics);
  if (entries.length === 0) return '';

  return entries
    .slice(0, 3)
    .map(([key, val]) => `${key.replace(/_/g, ' ')}: ${val}`)
    .join(' · ');
}

export default function RecentActivityFeed({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-muted text-sm">No stat entries yet.</p>
          <p className="text-muted text-xs mt-1">
            Tap the + button to log your first performance!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Recent Activity
        </h3>
        <span className="text-xs text-muted">Last {entries.length} entries</span>
      </div>
      <div className="space-y-3">
        {entries.map((entry) => {
          const meta = SPORT_META[entry.sportType] || {
            emoji: '🏅',
            label: entry.sportType,
            color: 'bg-gray-500',
          };

          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-bg transition-colors"
            >
              {/* Sport badge */}
              <div
                className={`w-9 h-9 shrink-0 rounded-lg ${meta.color} flex items-center justify-center shadow-sm`}
              >
                <span className="text-base">{meta.emoji}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">
                    {meta.label}
                  </span>
                  {entry.source === 'TOURNAMENT' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                      Tournament
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5 truncate capitalize">
                  {formatMetricSummary(entry.metrics)}
                </p>
                {entry.opponent && (
                  <p className="text-xs text-muted mt-0.5">
                    vs {entry.opponent}
                  </p>
                )}
              </div>

              {/* Date */}
              <span className="text-xs text-muted shrink-0">
                {formatRelativeDate(entry.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
