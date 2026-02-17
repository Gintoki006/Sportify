'use client';

import Link from 'next/link';

const SPORT_META = {
  FOOTBALL: { emoji: '⚽', label: 'Football', color: 'bg-green-500' },
  CRICKET: { emoji: '🏏', label: 'Cricket', color: 'bg-amber-500' },
  BASKETBALL: { emoji: '🏀', label: 'Basketball', color: 'bg-red-500' },
  BADMINTON: { emoji: '🏸', label: 'Badminton', color: 'bg-cyan-500' },
  TENNIS: { emoji: '🎾', label: 'Tennis', color: 'bg-lime-500' },
  VOLLEYBALL: { emoji: '🏐', label: 'Volleyball', color: 'bg-yellow-500' },
};

function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentMatchResults({ matches }) {
  if (!matches || matches.length === 0) {
    return null; // Don't show section if no completed matches
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Recent Match Results
        </h3>
        <Link
          href="/dashboard/matches?status=completed"
          className="text-xs font-medium text-accent hover:underline"
        >
          View all →
        </Link>
      </div>
      <div className="space-y-3">
        {matches.map((match) => {
          const meta = SPORT_META[match.sportType] || {
            emoji: '🏅',
            label: match.sportType,
            color: 'bg-gray-500',
          };
          const aWon = match.scoreA > match.scoreB;

          return (
            <Link
              key={match.id}
              href={`/dashboard/matches/${match.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg transition-colors group"
            >
              {/* Sport badge */}
              <div
                className={`w-9 h-9 shrink-0 rounded-lg ${meta.color} flex items-center justify-center shadow-sm`}
              >
                <span className="text-base">{meta.emoji}</span>
              </div>

              {/* Match info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm">
                  <span
                    className={`font-semibold truncate ${aWon ? 'text-primary' : 'text-muted'}`}
                  >
                    {match.teamA}
                  </span>
                  <span className="text-muted text-xs">vs</span>
                  <span
                    className={`font-semibold truncate ${!aWon ? 'text-primary' : 'text-muted'}`}
                  >
                    {match.teamB}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-primary tabular-nums">
                    {match.scoreA} — {match.scoreB}
                  </span>
                  {match.statsSynced && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">
                      Stats synced ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Date */}
              <span className="text-xs text-muted shrink-0">
                {formatRelativeDate(match.date || match.createdAt)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
