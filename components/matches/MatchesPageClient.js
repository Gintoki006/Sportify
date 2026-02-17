'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateMatchModal from '@/components/matches/CreateMatchModal';

/* ───────── Sport metadata ───────── */
const SPORT_META = {
  FOOTBALL: {
    emoji: '⚽',
    label: 'Football',
    color: 'bg-green-500/15 text-green-400',
  },
  CRICKET: {
    emoji: '🏏',
    label: 'Cricket',
    color: 'bg-amber-500/15 text-amber-400',
  },
  BASKETBALL: {
    emoji: '🏀',
    label: 'Basketball',
    color: 'bg-orange-500/15 text-orange-400',
  },
  BADMINTON: {
    emoji: '🏸',
    label: 'Badminton',
    color: 'bg-cyan-500/15 text-cyan-400',
  },
  TENNIS: {
    emoji: '🎾',
    label: 'Tennis',
    color: 'bg-lime-500/15 text-lime-400',
  },
  VOLLEYBALL: {
    emoji: '🏐',
    label: 'Volleyball',
    color: 'bg-yellow-500/15 text-yellow-400',
  },
};

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

/* ───────── Helper: format cricket score ───────── */
function formatCricketScore(innings, teamName) {
  const inn = innings?.find((i) => i.battingTeamName === teamName);
  if (!inn) return null;
  const overs =
    Math.floor(inn.totalOvers) + '.' + Math.round((inn.totalOvers % 1) * 10);
  return `${inn.totalRuns}/${inn.totalWickets} (${overs})`;
}

/* ═══════════════════════════════════════════════════════
   Matches Page Client
   ═══════════════════════════════════════════════════════ */
export default function MatchesPageClient({ matches, currentUserId }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [sportFilter, setSportFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Derive available sports from the user's matches
  const availableSports = useMemo(() => {
    const sports = new Set(matches.map((m) => m.sportType).filter(Boolean));
    return [...sports].sort();
  }, [matches]);

  // Filtered matches
  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (sportFilter !== 'all' && m.sportType !== sportFilter) return false;
      if (statusFilter === 'upcoming' && m.completed) return false;
      if (statusFilter === 'completed' && !m.completed) return false;
      return true;
    });
  }, [matches, sportFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Matches</h1>
          <p className="text-muted text-sm mt-1">
            Create and manage standalone matches with anyone.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
        >
          <span className="text-lg">+</span> New Match
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Status filters */}
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            aria-pressed={statusFilter === f.key}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === f.key
                ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                : 'bg-surface border border-border text-muted hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Sport filters */}
        {availableSports.length > 1 && (
          <>
            <div className="w-px h-6 bg-border self-center mx-1" />
            <button
              onClick={() => setSportFilter('all')}
              aria-pressed={sportFilter === 'all'}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                sportFilter === 'all'
                  ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                  : 'bg-surface border border-border text-muted hover:text-primary'
              }`}
            >
              All Sports
            </button>
            {availableSports.map((sport) => {
              const meta = SPORT_META[sport];
              return (
                <button
                  key={sport}
                  onClick={() => setSportFilter(sport)}
                  aria-pressed={sportFilter === sport}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    sportFilter === sport
                      ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                      : 'bg-surface border border-border text-muted hover:text-primary'
                  }`}
                >
                  {meta?.emoji} {meta?.label || sport}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Match list */}
      {filtered.length === 0 ? (
        <div
          role="status"
          className="bg-surface border border-border rounded-2xl p-12 text-center"
        >
          <div className="text-5xl mb-4">🏟️</div>
          <h3 className="text-primary font-semibold text-lg mb-1">
            {matches.length === 0 ? 'No matches yet' : 'No matches found'}
          </h3>
          <p className="text-muted text-sm max-w-sm mx-auto">
            {matches.length === 0
              ? 'Create your first match to start playing!'
              : 'Try adjusting your filters.'}
          </p>
          {matches.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
            >
              Create Your First Match
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Create match modal */}
      {showCreate && (
        <CreateMatchModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* ───────── Match Card ───────── */
function MatchCard({ match, currentUserId }) {
  const meta = SPORT_META[match.sportType] || {
    emoji: '🏆',
    label: match.sportType,
    color: 'bg-muted/15 text-muted',
  };
  const isCreator = match.createdByUserId === currentUserId;
  const isCricket = match.sportType === 'CRICKET';

  // Determine status
  let statusLabel, statusClass;
  if (match.completed) {
    statusLabel = 'Completed';
    statusClass = 'bg-green-500/15 text-green-400';
  } else if (isCricket && match.cricketInnings?.length > 0) {
    statusLabel = 'In Progress';
    statusClass = 'bg-amber-500/15 text-amber-400';
  } else {
    statusLabel = 'Upcoming';
    statusClass = 'bg-blue-500/15 text-blue-400';
  }

  // Score display
  const scoreA = isCricket
    ? formatCricketScore(match.cricketInnings, match.teamA)
    : match.scoreA;
  const scoreB = isCricket
    ? formatCricketScore(match.cricketInnings, match.teamB)
    : match.scoreB;

  // Pending invites count
  const pendingInvites =
    match.invites?.filter((i) => i.status === 'PENDING').length || 0;

  return (
    <Link
      href={`/dashboard/matches/${match.id}`}
      className="bg-surface border border-border rounded-2xl p-5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all group block"
    >
      {/* Top row: sport badge + status */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}
        >
          {meta.emoji} {meta.label}
        </span>
        <div className="flex items-center gap-2">
          {isCreator && (
            <span className="text-[10px] font-medium text-muted bg-border/50 px-2 py-0.5 rounded-full">
              Host
            </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-3">
        {/* Team A */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-primary truncate">{match.teamA}</p>
          {match.playerA && (
            <p className="text-xs text-muted truncate">{match.playerA.name}</p>
          )}
        </div>

        {/* Score */}
        {match.completed || (isCricket && match.cricketInnings?.length > 0) ? (
          <div className="text-center shrink-0">
            {isCricket ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs font-mono text-muted">
                  {scoreA || '-'}
                </span>
                <span className="text-[10px] text-muted">vs</span>
                <span className="text-xs font-mono text-muted">
                  {scoreB || '-'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-primary">
                  {scoreA ?? '-'}
                </span>
                <span className="text-xs text-muted">-</span>
                <span className="text-lg font-bold text-primary">
                  {scoreB ?? '-'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted shrink-0">vs</span>
        )}

        {/* Team B */}
        <div className="flex-1 min-w-0 text-right">
          <p className="font-semibold text-primary truncate">{match.teamB}</p>
          {match.playerB && (
            <p className="text-xs text-muted truncate">{match.playerB.name}</p>
          )}
        </div>
      </div>

      {/* Bottom row: date, invites, stats */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <span className="text-xs text-muted">
          {match.date
            ? new Date(match.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'No date set'}
        </span>
        <div className="flex items-center gap-2">
          {pendingInvites > 0 && (
            <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {pendingInvites} pending
            </span>
          )}
          {match.statsSynced && (
            <span className="text-[10px] font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              Stats synced ✓
            </span>
          )}
          {isCricket && match.overs && (
            <span className="text-[10px] font-medium text-muted bg-border/50 px-2 py-0.5 rounded-full">
              T{match.overs}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
