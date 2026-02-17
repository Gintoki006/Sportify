'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SPORT_META = {
  FOOTBALL: { emoji: '⚽', label: 'Football', color: 'bg-green-500' },
  CRICKET: { emoji: '🏏', label: 'Cricket', color: 'bg-amber-500' },
  BASKETBALL: { emoji: '🏀', label: 'Basketball', color: 'bg-red-500' },
  BADMINTON: { emoji: '🏸', label: 'Badminton', color: 'bg-cyan-500' },
  TENNIS: { emoji: '🎾', label: 'Tennis', color: 'bg-lime-500' },
  VOLLEYBALL: { emoji: '🏐', label: 'Volleyball', color: 'bg-yellow-500' },
};

function formatDate(dateStr) {
  if (!dateStr) return 'No date set';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UpcomingMatches({ matches }) {
  const router = useRouter();
  const [respondingTo, setRespondingTo] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function handleInviteAction(matchId, inviteId, action) {
    setRespondingTo(inviteId);
    setActionError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/invites/${inviteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Failed to ${action} invite.`);
      }
    } catch {
      setActionError('Network error. Please try again.');
    }
    setRespondingTo(null);
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
          Upcoming Matches
        </h3>
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🏟️</div>
          <p className="text-muted text-sm">No upcoming matches.</p>
          <Link
            href="/dashboard/matches"
            className="inline-block mt-2 text-xs font-medium text-accent hover:underline"
          >
            Create a match →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Upcoming Matches
        </h3>
        <Link
          href="/dashboard/matches"
          className="text-xs font-medium text-accent hover:underline"
        >
          View all →
        </Link>
      </div>
      <div className="space-y-3">
        {actionError && (
          <p
            role="alert"
            className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg"
          >
            {actionError}
          </p>
        )}
        {matches.map((match) => {
          const meta = SPORT_META[match.sportType] || {
            emoji: '🏅',
            label: match.sportType,
            color: 'bg-gray-500',
          };
          const pendingInvites = match.pendingInvites || 0;
          const hasPendingInvite = match.userInviteStatus === 'PENDING';

          return (
            <div
              key={match.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg transition-colors"
            >
              <Link
                href={`/dashboard/matches/${match.id}`}
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                {/* Sport badge */}
                <div
                  className={`w-9 h-9 shrink-0 rounded-lg ${meta.color} flex items-center justify-center shadow-sm`}
                >
                  <span className="text-base">{meta.emoji}</span>
                </div>

                {/* Match info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate group-hover:text-accent transition-colors">
                    {match.teamA} vs {match.teamB}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted">
                      {formatDate(match.date)}
                    </span>
                    {hasPendingInvite && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                        Invited
                      </span>
                    )}
                    {!hasPendingInvite && pendingInvites > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                        {pendingInvites} pending
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Accept/Decline for pending invites */}
              {hasPendingInvite && match.userInviteId ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() =>
                      handleInviteAction(match.id, match.userInviteId, 'accept')
                    }
                    disabled={respondingTo === match.userInviteId}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 min-h-[36px]"
                    aria-label="Accept invite"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      handleInviteAction(
                        match.id,
                        match.userInviteId,
                        'decline',
                      )
                    }
                    disabled={respondingTo === match.userInviteId}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 min-h-[36px]"
                    aria-label="Decline invite"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <Link
                  href={`/dashboard/matches/${match.id}`}
                  aria-label={`View match: ${match.teamA} vs ${match.teamB}`}
                >
                  <svg
                    className="w-4 h-4 text-muted shrink-0 hover:text-accent transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
