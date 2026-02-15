'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import AccessibleModal from '@/components/ui/AccessibleModal';

const STATUS_STYLES = {
  UPCOMING: 'bg-blue-500/10 text-blue-500',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-500',
  COMPLETED: 'bg-green-500/10 text-green-500',
};

const STATUS_LABELS = {
  UPCOMING: 'Upcoming',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const SPORT_EMOJIS = {
  FOOTBALL: '⚽',
  CRICKET: '🏏',
  BASKETBALL: '🏀',
  BADMINTON: '🏸',
  TENNIS: '🎾',
  VOLLEYBALL: '🏐',
};

export default function TournamentDetailClient({ tournament }) {
  const [matches, setMatches] = useState(tournament.matches);
  const [scoreModal, setScoreModal] = useState(null);
  const [status, setStatus] = useState(tournament.status);

  // Group matches by round
  const rounds = useMemo(() => {
    const map = {};
    matches.forEach((m) => {
      if (!map[m.round]) map[m.round] = [];
      map[m.round].push(m);
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([round, roundMatches]) => ({
        round: Number(round),
        matches: roundMatches,
      }));
  }, [matches]);

  const totalRounds = rounds.length;

  function getRoundLabel(round) {
    const fromFinal = totalRounds - round + 1;
    if (fromFinal === 1) return 'Final';
    if (fromFinal === 2) return 'Semi-Finals';
    if (fromFinal === 3) return 'Quarter-Finals';
    return `Round ${round}`;
  }

  function handleScoreSubmitted(matchId, data) {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            scoreA: data.scoreA,
            scoreB: data.scoreB,
            completed: true,
          };
        }
        // Update next round matches with advanced winner
        if (data.nextMatch && m.id === data.nextMatch.id) {
          return {
            ...m,
            teamA: data.nextMatch.teamA,
            teamB: data.nextMatch.teamB,
          };
        }
        return m;
      }),
    );
    if (data.tournamentStatus) {
      setStatus(data.tournamentStatus);
    }
    setScoreModal(null);
  }

  // Find the champion
  const champion = useMemo(() => {
    if (status !== 'COMPLETED') return null;
    const finalMatch = matches.find(
      (m) => m.round === totalRounds && m.completed,
    );
    if (!finalMatch) return null;
    return finalMatch.scoreA > finalMatch.scoreB
      ? finalMatch.teamA
      : finalMatch.scoreB > finalMatch.scoreA
        ? finalMatch.teamB
        : null;
  }, [matches, status, totalRounds]);

  // Build standings
  const standings = useMemo(() => {
    const stats = {};
    matches
      .filter((m) => m.completed)
      .forEach((m) => {
        if (!stats[m.teamA])
          stats[m.teamA] = { wins: 0, losses: 0, points: 0, conceded: 0 };
        if (!stats[m.teamB])
          stats[m.teamB] = { wins: 0, losses: 0, points: 0, conceded: 0 };
        stats[m.teamA].points += m.scoreA;
        stats[m.teamA].conceded += m.scoreB;
        stats[m.teamB].points += m.scoreB;
        stats[m.teamB].conceded += m.scoreA;
        if (m.scoreA > m.scoreB) {
          stats[m.teamA].wins++;
          stats[m.teamB].losses++;
        } else if (m.scoreB > m.scoreA) {
          stats[m.teamB].wins++;
          stats[m.teamA].losses++;
        }
      });
    return Object.entries(stats)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  }, [matches]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Link
              href={`/dashboard/clubs/${tournament.club.id}`}
              className="text-xs text-accent hover:underline inline-flex items-center gap-1 mb-2"
            >
              ← {tournament.club.name}
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {SPORT_EMOJIS[tournament.sportType]}
              </span>
              <h1 className="text-2xl font-bold text-primary">
                {tournament.name}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}
              >
                {STATUS_LABELS[status]}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              {new Date(tournament.startDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {tournament.endDate &&
                ` – ${new Date(tournament.endDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}`}
            </p>
          </div>

          {champion && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-xs text-muted">Champion</p>
                <p className="text-sm font-bold text-accent">{champion}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bracket Visualization */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">
          Bracket
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max items-start">
            {rounds.map(({ round, matches: roundMatches }) => (
              <div
                key={round}
                className="flex flex-col gap-4"
                style={{ minWidth: 220 }}
              >
                <div className="text-center">
                  <span className="text-xs font-semibold text-muted bg-bg px-3 py-1 rounded-full">
                    {getRoundLabel(round)}
                  </span>
                </div>
                <div
                  className="flex flex-col justify-around flex-1"
                  style={{
                    gap: `${Math.pow(2, round - 1) * 16}px`,
                    paddingTop: `${(Math.pow(2, round - 1) - 1) * 24}px`,
                  }}
                >
                  {roundMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isAdmin={tournament.isAdmin}
                      onScore={() => setScoreModal(match)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Standings */}
      {standings.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Standings
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Tournament standings">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wider">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Team/Player</th>
                  <th className="pb-3 pr-4 text-center">W</th>
                  <th className="pb-3 pr-4 text-center">L</th>
                  <th className="pb-3 pr-4 text-center">PF</th>
                  <th className="pb-3 text-center">PA</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.name} className="border-t border-border/50">
                    <td className="py-2.5 pr-4 text-muted">{i + 1}</td>
                    <td className="py-2.5 pr-4 font-medium text-primary">
                      <span className="flex items-center gap-2">
                        {i === 0 && status === 'COMPLETED' && (
                          <span className="text-xs">🏆</span>
                        )}
                        {s.name}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-center text-green-500 font-semibold">
                      {s.wins}
                    </td>
                    <td className="py-2.5 pr-4 text-center text-red-500 font-semibold">
                      {s.losses}
                    </td>
                    <td className="py-2.5 pr-4 text-center text-muted">
                      {s.points}
                    </td>
                    <td className="py-2.5 text-center text-muted">
                      {s.conceded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {scoreModal && (
        <ScoreEntryModal
          match={scoreModal}
          tournamentId={tournament.id}
          onClose={() => setScoreModal(null)}
          onSubmitted={handleScoreSubmitted}
        />
      )}
    </div>
  );
}

/* ───────── Match Card ───────── */
function MatchCard({ match, isAdmin, onScore }) {
  const isTBD = match.teamA === 'TBD' || match.teamB === 'TBD';
  const canScore = isAdmin && !match.completed && !isTBD;

  const winnerIsA = match.completed && match.scoreA > match.scoreB;
  const winnerIsB = match.completed && match.scoreB > match.scoreA;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        match.completed ? 'border-border' : 'border-border/60'
      }`}
    >
      {/* Team A */}
      <div
        className={`flex items-center justify-between px-3 py-2 text-sm ${
          winnerIsA
            ? 'bg-green-500/10 font-semibold text-primary'
            : match.completed
              ? 'bg-bg/50 text-muted'
              : 'bg-bg text-primary'
        }`}
      >
        <span className="truncate max-w-32">
          {winnerIsA && <span className="mr-1">▸</span>}
          {match.teamA}
        </span>
        {match.completed && (
          <span
            className={`ml-2 tabular-nums ${
              winnerIsA ? 'text-green-500' : 'text-muted'
            }`}
          >
            {match.scoreA}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* Team B */}
      <div
        className={`flex items-center justify-between px-3 py-2 text-sm ${
          winnerIsB
            ? 'bg-green-500/10 font-semibold text-primary'
            : match.completed
              ? 'bg-bg/50 text-muted'
              : 'bg-bg text-primary'
        }`}
      >
        <span className="truncate max-w-32">
          {winnerIsB && <span className="mr-1">▸</span>}
          {match.teamB}
        </span>
        {match.completed && (
          <span
            className={`ml-2 tabular-nums ${
              winnerIsB ? 'text-green-500' : 'text-muted'
            }`}
          >
            {match.scoreB}
          </span>
        )}
      </div>

      {/* Score button */}
      {canScore && (
        <button
          onClick={onScore}
          className="w-full py-1.5 text-xs font-medium text-accent bg-accent/5 hover:bg-accent/10 border-t border-border/40 transition-colors"
        >
          Enter Score →
        </button>
      )}
    </div>
  );
}

/* ───────── Score Entry Modal ───────── */
function ScoreEntryModal({ match, tournamentId, onClose, onSubmitted }) {
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const a = parseInt(scoreA);
    const b = parseInt(scoreB);

    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      setError('Enter valid scores (0 or higher).');
      return;
    }
    if (a === b) {
      setError('Ties are not allowed in single-elimination.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreA: a, scoreB: b }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit score.');
        setSubmitting(false);
        return;
      }
      onSubmitted(match.id, data);
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Enter Score"
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-center">
            <label
              htmlFor="score-a"
              className="text-xs text-muted uppercase tracking-wider mb-2 block"
            >
              {match.teamA}
            </label>
            <input
              id="score-a"
              type="number"
              min="0"
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              className="w-full text-center text-2xl font-bold px-4 py-3 rounded-xl border border-border bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              autoFocus
              required
            />
          </div>
          <span
            className="text-muted text-lg font-bold mt-6"
            aria-hidden="true"
          >
            vs
          </span>
          <div className="text-center">
            <label
              htmlFor="score-b"
              className="text-xs text-muted uppercase tracking-wider mb-2 block"
            >
              {match.teamB}
            </label>
            <input
              id="score-b"
              type="number"
              min="0"
              value={scoreB}
              onChange={(e) => setScoreB(e.target.value)}
              className="w-full text-center text-2xl font-bold px-4 py-3 rounded-xl border border-border bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              required
            />
          </div>
        </div>

        {error && (
          <p
            className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg text-center"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Submitting…
            </span>
          ) : (
            'Submit Score'
          )}
        </button>
      </form>
    </AccessibleModal>
  );
}
