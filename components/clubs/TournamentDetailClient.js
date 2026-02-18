'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AccessibleModal from '@/components/ui/AccessibleModal';
import MemberAutocomplete from '@/components/ui/MemberAutocomplete';
import { isTeamSport } from '@/lib/sportMetrics';
import Image from 'next/image';
import DatePicker from '@/components/ui/DatePicker';

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

const VALID_SPORTS = [
  { value: 'FOOTBALL', label: 'Football', emoji: '⚽' },
  { value: 'CRICKET', label: 'Cricket', emoji: '🏏' },
  { value: 'BASKETBALL', label: 'Basketball', emoji: '🏀' },
  { value: 'BADMINTON', label: 'Badminton', emoji: '🏸' },
  { value: 'TENNIS', label: 'Tennis', emoji: '🎾' },
  { value: 'VOLLEYBALL', label: 'Volleyball', emoji: '🏐' },
];

export default function TournamentDetailClient({ tournament }) {
  const router = useRouter();
  const [matches, setMatches] = useState(tournament.matches);
  const [scoreModal, setScoreModal] = useState(null);
  const [status, setStatus] = useState(tournament.status);
  const [tournamentName, setTournamentName] = useState(tournament.name);
  const [tournamentSport, setTournamentSport] = useState(tournament.sportType);
  const [tournamentStartDate, setTournamentStartDate] = useState(
    tournament.startDate,
  );
  const [tournamentEndDate, setTournamentEndDate] = useState(
    tournament.endDate,
  );

  // Management modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMatchModal, setEditMatchModal] = useState(null);
  const [showManageMenu, setShowManageMenu] = useState(false);

  // Tab state: 'bracket' | 'live' | 'standings'
  const [activeTab, setActiveTab] = useState('bracket');

  // Live matches data (for the Live tab)
  const [liveMatches, setLiveMatches] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');

  const isCricketTournament = tournamentSport === 'CRICKET';
  const isFootballTournament = tournamentSport === 'FOOTBALL';
  const hasLiveSupport = isCricketTournament || isFootballTournament;

  const canManage = tournament.canManageTournament;

  // Live polling for the Live tab (cricket & football matches)
  const fetchLiveData = useCallback(async () => {
    if (!hasLiveSupport) return;
    setLiveError('');
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/live`);
      if (!res.ok) throw new Error('Failed to fetch live data');
      const data = await res.json();
      setLiveMatches(data.liveMatches || []);
      if (data.tournamentStatus && data.tournamentStatus !== status) {
        setStatus(data.tournamentStatus);
      }
    } catch {
      setLiveError('Could not load live data');
    }
  }, [hasLiveSupport, tournament.id, status]);

  useEffect(() => {
    if (activeTab !== 'live' || !hasLiveSupport) return;

    setLiveLoading(true);
    fetchLiveData().finally(() => setLiveLoading(false));

    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, [activeTab, hasLiveSupport, fetchLiveData]);

  // Pre-fetch live data on mount for the badge indicator
  useEffect(() => {
    if (hasLiveSupport && activeTab !== 'live') {
      fetchLiveData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            statsSynced: !!(m.playerA || m.playerB),
            playerStatsSynced: !!data.playerStatsSynced,
          };
        }
        // Update next round matches with advanced winner + player data
        if (data.nextMatch && m.id === data.nextMatch.id) {
          // Determine which side the winner was advanced to
          const scoredMatch = prev.find((pm) => pm.id === matchId);
          const winnerIsA = scoredMatch && data.scoreA > data.scoreB;
          const winnerPlayer = winnerIsA
            ? scoredMatch?.playerA
            : scoredMatch?.playerB;

          const updates = {
            ...m,
            teamA: data.nextMatch.teamA,
            teamB: data.nextMatch.teamB,
          };

          // Propagate player info to the correct side
          if (winnerPlayer && data.nextMatch.playerAId) {
            updates.playerA =
              data.nextMatch.playerAId === winnerPlayer?.id
                ? winnerPlayer
                : m.playerA;
          }
          if (winnerPlayer && data.nextMatch.playerBId) {
            updates.playerB =
              data.nextMatch.playerBId === winnerPlayer?.id
                ? winnerPlayer
                : m.playerB;
          }

          return updates;
        }
        return m;
      }),
    );
    if (data.tournamentStatus) {
      setStatus(data.tournamentStatus);
    }
    setScoreModal(null);
  }

  function handleEditSaved(data) {
    if (data.name) setTournamentName(data.name);
    if (data.sportType) setTournamentSport(data.sportType);
    if (data.startDate) setTournamentStartDate(data.startDate);
    if (data.endDate !== undefined) setTournamentEndDate(data.endDate);
    if (data.status) setStatus(data.status);
    setShowEditModal(false);
  }

  function handleMatchEdited(matchId, updatedMatch) {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              teamA: updatedMatch.teamA,
              teamB: updatedMatch.teamB,
              playerA: updatedMatch.playerA || m.playerA,
              playerB: updatedMatch.playerB || m.playerB,
            }
          : m,
      ),
    );
    setEditMatchModal(null);
  }

  function handleResetDone(data) {
    setMatches(data.matches);
    if (data.tournamentStatus) setStatus(data.tournamentStatus);
  }

  // Find the champion
  const champion = useMemo(() => {
    if (status !== 'COMPLETED') return null;
    const finalMatch = matches.find(
      (m) => m.round === totalRounds && m.completed,
    );
    if (!finalMatch) return null;
    const isA = finalMatch.scoreA > finalMatch.scoreB;
    return {
      name: isA ? finalMatch.teamA : finalMatch.teamB,
      player: isA ? finalMatch.playerA : finalMatch.playerB,
    };
  }, [matches, status, totalRounds]);

  // Build standings
  // Build a name → player lookup from all matches
  const playerByName = useMemo(() => {
    const map = {};
    matches.forEach((m) => {
      if (m.playerA && m.teamA) map[m.teamA] = m.playerA;
      if (m.playerB && m.teamB) map[m.teamB] = m.playerB;
    });
    return map;
  }, [matches]);

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
      .map(([name, s]) => ({ name, player: playerByName[name], ...s }))
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  }, [matches, playerByName]);

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
              <span className="text-2xl">{SPORT_EMOJIS[tournamentSport]}</span>
              <h1 className="text-2xl font-bold text-primary">
                {tournamentName}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}
              >
                {STATUS_LABELS[status]}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              {new Date(tournamentStartDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {tournamentEndDate &&
                ` – ${new Date(tournamentEndDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}`}
            </p>
            {tournamentSport === 'CRICKET' &&
              (tournament.overs || tournament.playersPerSide) && (
                <div className="flex items-center gap-2 mt-1.5">
                  {tournament.overs && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {tournament.overs} overs
                    </span>
                  )}
                  {tournament.playersPerSide && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {tournament.playersPerSide}-a-side
                    </span>
                  )}
                </div>
              )}
            {tournamentSport === 'FOOTBALL' &&
              (tournament.halfDuration || tournament.squadSize) && (
                <div className="flex items-center gap-2 mt-1.5">
                  {tournament.halfDuration && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                      {tournament.halfDuration} min halves
                    </span>
                  )}
                  {tournament.squadSize && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                      {tournament.squadSize}-a-side
                    </span>
                  )}
                </div>
              )}
          </div>

          <div className="flex items-center gap-3">
            {/* Management dropdown */}
            {canManage && (
              <div className="relative">
                <button
                  onClick={() => setShowManageMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-bg text-sm font-medium text-primary hover:bg-border/30 transition-colors"
                  aria-label="Manage tournament"
                >
                  <span aria-hidden="true">⚙</span> Manage
                  <span className="text-[10px]" aria-hidden="true">
                    ▾
                  </span>
                </button>
                {showManageMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowManageMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-surface border border-border rounded-xl shadow-xl py-1 animate-in fade-in-0 zoom-in-95">
                      <button
                        onClick={() => {
                          setShowManageMenu(false);
                          setShowEditModal(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-bg transition-colors flex items-center gap-2"
                      >
                        <span>✏️</span> Edit Details
                      </button>
                      <button
                        onClick={() => {
                          setShowManageMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <span>🗑️</span> Delete Tournament
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {champion && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20"
                role="status"
                aria-label={`Tournament champion: ${champion.name}`}
              >
                <span className="text-xl" aria-hidden="true">
                  🏆
                </span>
                {champion.player?.avatarUrl ? (
                  <Image
                    src={champion.player.avatarUrl}
                    alt={`${champion.name}'s avatar`}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-accent/30"
                  />
                ) : null}
                <div>
                  <p className="text-xs text-muted">Champion</p>
                  {champion.player?.id ? (
                    <Link
                      href={`/dashboard/profile?userId=${champion.player.id}`}
                      className="text-sm font-bold text-accent hover:underline"
                    >
                      {champion.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-bold text-accent">
                      {champion.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'bracket'
                ? 'text-accent border-b-2 border-accent bg-accent/5'
                : 'text-muted hover:text-primary hover:bg-bg/50'
            }`}
          >
            🏆 Bracket
          </button>
          {hasLiveSupport && (
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'live'
                  ? 'text-accent border-b-2 border-accent bg-accent/5'
                  : 'text-muted hover:text-primary hover:bg-bg/50'
              }`}
            >
              {isFootballTournament ? '⚽' : '🏏'} Live
              {liveMatches.some((m) => m.matchStatus === 'IN_PROGRESS') && (
                <span className="ml-1.5 inline-flex items-center">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'standings'
                ? 'text-accent border-b-2 border-accent bg-accent/5'
                : 'text-muted hover:text-primary hover:bg-bg/50'
            }`}
          >
            📊 Standings
          </button>
        </div>

        <div className="p-6">
          {/* Bracket Tab */}
          {activeTab === 'bracket' && (
            <>
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
                            canEnterScores={tournament.canEnterScores}
                            canManage={canManage}
                            isCricket={tournamentSport === 'CRICKET'}
                            isFootball={tournamentSport === 'FOOTBALL'}
                            isTeam={isTeamSport(tournamentSport)}
                            clubId={tournament.club.id}
                            tournamentId={tournament.id}
                            onScore={() => setScoreModal(match)}
                            onEdit={() => setEditMatchModal(match)}
                            onReset={(data) => handleResetDone(data)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Live Matches Tab */}
          {activeTab === 'live' && hasLiveSupport && (
            <LiveMatchesPanel
              liveMatches={liveMatches}
              loading={liveLoading}
              error={liveError}
              clubId={tournament.club.id}
              tournamentId={tournament.id}
              maxOvers={tournament.overs || 20}
              sportType={tournamentSport}
            />
          )}

          {/* Standings Tab */}
          {activeTab === 'standings' && (
            <>
              {standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm"
                    aria-label="Tournament standings"
                  >
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
                              {!isTeamSport(tournamentSport) && (
                                <PlayerAvatar player={s.player} />
                              )}
                              {isTeamSport(tournamentSport) ? (
                                <span>{s.name}</span>
                              ) : (
                                <TeamName name={s.name} player={s.player} />
                              )}
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
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted text-sm">
                    No matches completed yet. Standings will appear here after
                    scores are entered.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Score Modal */}
      {scoreModal && (
        <ScoreEntryModal
          match={scoreModal}
          tournamentId={tournament.id}
          sportType={tournamentSport}
          clubMembers={tournament.clubMembers || []}
          onClose={() => setScoreModal(null)}
          onSubmitted={handleScoreSubmitted}
        />
      )}

      {/* Edit Tournament Modal */}
      {showEditModal && (
        <EditTournamentModal
          tournament={{
            id: tournament.id,
            name: tournamentName,
            sportType: tournamentSport,
            startDate: tournamentStartDate,
            endDate: tournamentEndDate,
            status,
          }}
          onClose={() => setShowEditModal(false)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteTournamentModal
          tournament={{ id: tournament.id, name: tournamentName }}
          clubId={tournament.club.id}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Edit Match Modal */}
      {editMatchModal && (
        <EditMatchModal
          match={editMatchModal}
          clubMembers={tournament.clubMembers || []}
          isTeam={isTeamSport(tournamentSport)}
          onClose={() => setEditMatchModal(null)}
          onSaved={handleMatchEdited}
        />
      )}
    </div>
  );
}

/* ───────── Player Avatar ───────── */
function PlayerAvatar({ player, size = 'w-5 h-5' }) {
  if (!player?.avatarUrl) return null;
  return (
    <Image
      src={player.avatarUrl}
      alt={player.name ? `${player.name}'s avatar` : ''}
      width={20}
      height={20}
      className={`${size} rounded-full object-cover shrink-0`}
    />
  );
}

/* ───────── Team Name (optionally linked) ───────── */
function TeamName({ name, player, className }) {
  if (player?.id) {
    return (
      <Link
        href={`/dashboard/profile?userId=${player.id}`}
        className={`hover:underline ${className || ''}`}
      >
        {name}
      </Link>
    );
  }
  return <span className={className}>{name}</span>;
}

/* ───────── Live Matches Panel ───────── */
function LiveMatchesPanel({
  liveMatches,
  loading,
  error,
  clubId,
  tournamentId,
  maxOvers,
  sportType,
}) {
  const isFootball = sportType === 'FOOTBALL';

  if (loading && liveMatches.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-muted">Loading live scores…</span>
      </div>
    );
  }

  if (error && liveMatches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  // Separate by status
  const inProgress = liveMatches.filter(
    (m) =>
      m.matchStatus === 'IN_PROGRESS' ||
      m.matchStatus === 'INNINGS_BREAK' ||
      m.matchStatus === 'HALF_TIME',
  );
  const completed = liveMatches.filter((m) => m.matchStatus === 'COMPLETED');

  if (liveMatches.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-3xl mb-3 block">{isFootball ? '⚽' : '🏏'}</span>
        <p className="text-muted text-sm">
          No {isFootball ? 'football' : 'cricket'} matches have been started
          yet.
        </p>
        <p className="text-muted text-xs mt-1">
          Start scoring a match from the Bracket tab to see live data here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* In Progress */}
      {inProgress.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Live Now
            </h4>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {inProgress.map((match) => (
              <LiveMatchCard
                key={match.matchId}
                match={match}
                clubId={clubId}
                tournamentId={tournamentId}
                maxOvers={maxOvers}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {completed.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>✓</span> Completed
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map((match) => (
              <LiveMatchCard
                key={match.matchId}
                match={match}
                clubId={clubId}
                tournamentId={tournamentId}
                maxOvers={maxOvers}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Live Match Card ───────── */
function LiveMatchCard({ match, clubId, tournamentId, maxOvers }) {
  const isFootball = match.sportType === 'FOOTBALL';
  const isInProgress =
    match.matchStatus === 'IN_PROGRESS' ||
    match.matchStatus === 'INNINGS_BREAK' ||
    match.matchStatus === 'HALF_TIME';

  // Football status label
  const FOOTBALL_STATUS_LABELS = {
    FIRST_HALF: '1st Half',
    HALF_TIME: 'Half Time',
    SECOND_HALF: '2nd Half',
    EXTRA_TIME_FIRST: 'ET 1st Half',
    EXTRA_TIME_SECOND: 'ET 2nd Half',
    PENALTIES: 'Penalties',
  };

  // Real-time minute for football
  const FOOTBALL_ACTIVE = [
    'FIRST_HALF',
    'SECOND_HALF',
    'EXTRA_TIME_FIRST',
    'EXTRA_TIME_SECOND',
    'PENALTIES',
  ];
  const fbActive = isFootball && FOOTBALL_ACTIVE.includes(match.footballStatus);
  const halfDur = match.halfDuration || 45;
  const [fbMinute, setFbMinute] = useState(0);

  useEffect(() => {
    if (!isFootball || !match.periodStartedAt || !fbActive) {
      const t = setTimeout(() => setFbMinute(match.lastMinute || 0), 0);
      return () => clearTimeout(t);
    }
    function compute() {
      let base = 1;
      if (match.footballStatus === 'SECOND_HALF') base = halfDur + 1;
      else if (match.footballStatus === 'EXTRA_TIME_FIRST')
        base = 2 * halfDur + 1;
      else if (match.footballStatus === 'EXTRA_TIME_SECOND')
        base = 2 * halfDur + 16;
      else if (match.footballStatus === 'PENALTIES') base = 2 * halfDur + 30;
      const elapsed = Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(match.periodStartedAt).getTime()) / 60000,
        ),
      );
      return base + elapsed;
    }
    const iv = setInterval(() => setFbMinute(compute()), 1000);
    return () => clearInterval(iv);
  }, [
    isFootball,
    match.periodStartedAt,
    fbActive,
    match.footballStatus,
    halfDur,
    match.lastMinute,
  ]);

  function formatFbMinute(min) {
    let normalEnd = 0;
    if (
      match.footballStatus === 'FIRST_HALF' ||
      match.footballStatus === 'HALF_TIME'
    )
      normalEnd = halfDur;
    else if (
      match.footballStatus === 'SECOND_HALF' ||
      match.footballStatus === 'FULL_TIME' ||
      match.footballStatus === 'COMPLETED'
    )
      normalEnd = 2 * halfDur;
    else if (match.footballStatus === 'EXTRA_TIME_FIRST')
      normalEnd = 2 * halfDur + 15;
    else if (match.footballStatus === 'EXTRA_TIME_SECOND')
      normalEnd = 2 * halfDur + 30;
    if (normalEnd > 0 && min > normalEnd)
      return `${normalEnd}+${min - normalEnd}'`;
    return `${min}'`;
  }

  return (
    <Link
      href={`/dashboard/clubs/${clubId}/tournament/${tournamentId}/match/${match.matchId}`}
      className="block rounded-xl border border-border bg-bg hover:bg-surface hover:border-accent/30 transition-all group"
    >
      {/* Status badge */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-[10px] text-muted uppercase tracking-wider">
          Round {match.round}
        </span>
        {match.matchStatus === 'IN_PROGRESS' && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            {isFootball
              ? FOOTBALL_STATUS_LABELS[match.footballStatus] || 'LIVE'
              : 'LIVE'}
          </span>
        )}
        {match.matchStatus === 'INNINGS_BREAK' && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            INNINGS BREAK
          </span>
        )}
        {match.matchStatus === 'HALF_TIME' && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            HALF TIME
          </span>
        )}
        {match.matchStatus === 'COMPLETED' && (
          <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
            COMPLETED
          </span>
        )}
      </div>

      {/* Football score display */}
      {isFootball ? (
        <div className="px-4 py-3">
          {/* Score line */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary truncate max-w-32">
              {match.teamA}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-accent tabular-nums">
                {match.scoreA ?? 0}
              </span>
              <span className="text-xs text-muted">–</span>
              <span className="text-xl font-bold text-accent tabular-nums">
                {match.scoreB ?? 0}
              </span>
            </div>
            <span className="text-sm font-medium text-primary truncate max-w-32 text-right">
              {match.teamB}
            </span>
          </div>

          {/* Minute indicator */}
          {isInProgress && fbMinute > 0 && (
            <p
              className={`text-center text-[10px] font-semibold mt-1 ${fbActive ? 'text-red-400 animate-pulse' : 'text-accent'}`}
            >
              {formatFbMinute(fbMinute)}
            </p>
          )}

          {/* Goal scorers */}
          {match.goalScorers && match.goalScorers.length > 0 && (
            <div className="border-t border-border/50 mt-2 pt-2 space-y-0.5">
              {match.goalScorers.map((g, i) => (
                <div
                  key={i}
                  className={`flex items-center text-[10px] ${
                    g.team === 'A' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <span className="text-muted">
                    ⚽ {g.playerName} {g.minute}&apos;
                    {g.addedTime ? `+${g.addedTime}` : ''}
                    {g.type === 'OWN_GOAL' ? ' (OG)' : ''}
                    {g.type === 'PENALTY_SCORED' ? ' (P)' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Cards summary */}
          {match.cardsSummary && (
            <div className="flex items-center justify-between mt-2 text-[10px] text-muted">
              <span>
                {match.cardsSummary.teamA.yellow > 0 && (
                  <span className="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-[1px] mr-0.5 align-middle" />
                )}
                {match.cardsSummary.teamA.yellow > 0 &&
                  match.cardsSummary.teamA.yellow}
                {match.cardsSummary.teamA.red > 0 && (
                  <span className="inline-block w-2.5 h-3.5 bg-red-500 rounded-[1px] ml-1 mr-0.5 align-middle" />
                )}
                {match.cardsSummary.teamA.red > 0 &&
                  match.cardsSummary.teamA.red}
              </span>
              <span>
                {match.cardsSummary.teamB.yellow > 0 &&
                  match.cardsSummary.teamB.yellow}
                {match.cardsSummary.teamB.yellow > 0 && (
                  <span className="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-[1px] ml-0.5 mr-1 align-middle" />
                )}
                {match.cardsSummary.teamB.red > 0 &&
                  match.cardsSummary.teamB.red}
                {match.cardsSummary.teamB.red > 0 && (
                  <span className="inline-block w-2.5 h-3.5 bg-red-500 rounded-[1px] ml-0.5 align-middle" />
                )}
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Cricket innings scores */}
          <div className="px-4 py-2 space-y-1.5">
            {match.innings?.map((inn) => (
              <div
                key={inn.inningsNumber}
                className={`flex items-center justify-between ${
                  !inn.isComplete ? 'text-primary font-semibold' : 'text-muted'
                }`}
              >
                <span className="text-sm truncate max-w-36">
                  {inn.battingTeamName}
                </span>
                <div className="flex items-center gap-2 text-sm tabular-nums">
                  <span
                    className={!inn.isComplete ? 'text-accent font-bold' : ''}
                  >
                    {inn.totalRuns}/{inn.totalWickets}
                  </span>
                  <span className="text-[11px] text-muted">
                    ({inn.totalOvers}/{maxOvers})
                  </span>
                </div>
              </div>
            ))}
            {(!match.innings || match.innings.length === 0) && (
              <p className="text-xs text-muted italic">
                Awaiting first innings
              </p>
            )}
          </div>

          {/* Active innings detail */}
          {(() => {
            const activeInnings = match.innings?.find((i) => !i.isComplete);
            if (!activeInnings) return null;
            return (
              <div className="border-t border-border/50 px-4 py-2 space-y-1.5">
                {activeInnings.batsmenOnCrease &&
                  activeInnings.batsmenOnCrease.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {activeInnings.batsmenOnCrease.map((b, i) => (
                        <span key={i} className="text-[11px] text-primary">
                          {b.name}{' '}
                          <span className="font-semibold text-accent">
                            {b.runs}
                          </span>
                          <span className="text-muted">({b.balls})</span>
                        </span>
                      ))}
                    </div>
                  )}
                <div className="flex items-center gap-3 text-[10px] text-muted">
                  <span>CRR: {activeInnings.runRate}</span>
                  {activeInnings.target && (
                    <>
                      <span>Target: {activeInnings.target}</span>
                      {activeInnings.requiredRate !== null && (
                        <span>RRR: {activeInnings.requiredRate}</span>
                      )}
                    </>
                  )}
                </div>
                {activeInnings.lastSixBalls &&
                  activeInnings.lastSixBalls.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted mr-1">
                        Recent:
                      </span>
                      {activeInnings.lastSixBalls.map((b, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                            b.isWicket
                              ? 'bg-red-500/20 text-red-400'
                              : b.runs >= 4
                                ? 'bg-green-500/20 text-green-400'
                                : b.extra
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-border/50 text-muted'
                          }`}
                        >
                          {b.isWicket ? 'W' : b.extra ? 'E' : b.runs}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            );
          })()}
        </>
      )}

      {/* Result text */}
      {match.result && (
        <div className="border-t border-border/50 px-4 py-2">
          <p className="text-xs font-medium text-green-400">{match.result}</p>
        </div>
      )}

      {/* View link */}
      <div className="border-t border-border/40 px-4 py-1.5 text-center">
        <span className="text-[11px] font-medium text-accent group-hover:underline">
          {isInProgress ? 'View Live Scorecard →' : 'View Scorecard →'}
        </span>
      </div>
    </Link>
  );
}

/* ───────── Match Card ───────── */
function MatchCard({
  match,
  canEnterScores,
  canManage,
  isCricket,
  isFootball,
  isTeam,
  clubId,
  tournamentId,
  onScore,
  onEdit,
  onReset,
}) {
  const isTBD = match.teamA === 'TBD' || match.teamB === 'TBD';
  const canScore = canEnterScores && !match.completed && !isTBD;
  const canEditMatch = canManage && !match.completed;
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  const winnerIsA = match.completed && match.scoreA > match.scoreB;
  const winnerIsB = match.completed && match.scoreB > match.scoreA;

  async function handleReset() {
    if (
      !confirm(
        'Reset this score? This will also clear any downstream bracket results and synced stats.',
      )
    )
      return;
    setResetting(true);
    setResetError('');
    try {
      const res = await fetch(`/api/matches/${match.id}/reset`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Failed to reset');
        setResetting(false);
        return;
      }
      onReset(data);
    } catch {
      setResetError('Network error');
    }
    setResetting(false);
  }

  return (
    <div
      role="group"
      aria-label={`Match: ${match.teamA} vs ${match.teamB}${match.completed ? ` — ${match.scoreA}:${match.scoreB}` : ''}`}
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
        <span className="flex items-center gap-1.5 truncate max-w-32">
          {winnerIsA && <span className="mr-0.5">▸</span>}
          {!isTeam && <PlayerAvatar player={match.playerA} />}
          {isTeam ? (
            <span>{match.teamA}</span>
          ) : (
            <TeamName name={match.teamA} player={match.playerA} />
          )}
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
        <span className="flex items-center gap-1.5 truncate max-w-32">
          {winnerIsB && <span className="mr-0.5">▸</span>}
          {!isTeam && <PlayerAvatar player={match.playerB} />}
          {isTeam ? (
            <span>{match.teamB}</span>
          ) : (
            <TeamName name={match.teamB} player={match.playerB} />
          )}
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

      {/* Stats synced indicator */}
      {match.completed && match.statsSynced && !isTeam && (
        <div
          className="border-t border-border/40 px-3 py-1 bg-green-500/5 text-[10px] text-green-600 flex items-center gap-1"
          role="status"
          aria-label="Player statistics have been synced for this match"
        >
          <span aria-hidden="true">✓</span> Stats synced
        </div>
      )}
      {match.completed && match.playerStatsSynced && isTeam && (
        <div
          className="border-t border-border/40 px-3 py-1 bg-green-500/5 text-[10px] text-green-600 flex items-center gap-1"
          role="status"
          aria-label="Per-player statistics have been recorded for this match"
        >
          <span aria-hidden="true">✓</span> Player stats recorded
        </div>
      )}

      {/* Score / Cricket / Football link button */}
      {(isCricket || isFootball) && !isTBD ? (
        <Link
          href={`/dashboard/clubs/${clubId}/tournament/${tournamentId}/match/${match.id}`}
          className="block w-full py-1.5 text-xs font-medium text-accent bg-accent/5 hover:bg-accent/10 border-t border-border/40 transition-colors text-center"
        >
          {isCricket ? '🏏' : '⚽'}{' '}
          {match.completed
            ? 'Scorecard'
            : canEnterScores
              ? 'Score Match'
              : 'View Match'}{' '}
          →
        </Link>
      ) : canScore ? (
        <button
          onClick={onScore}
          className="w-full py-1.5 text-xs font-medium text-accent bg-accent/5 hover:bg-accent/10 border-t border-border/40 transition-colors"
        >
          Enter Score →
        </button>
      ) : null}

      {/* Management buttons */}
      {canManage && (
        <div className="flex border-t border-border/40">
          {canEditMatch && (
            <button
              onClick={onEdit}
              className="flex-1 py-1.5 text-xs font-medium text-muted hover:text-primary bg-bg/50 hover:bg-border/30 transition-colors"
            >
              ✏️ Edit
            </button>
          )}
          {match.completed && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex-1 py-1.5 text-xs font-medium text-amber-500 hover:text-amber-400 bg-bg/50 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
            >
              {resetting ? '⏳' : '↩️'} Reset
            </button>
          )}
        </div>
      )}
      {resetError && (
        <div className="px-2 py-1 text-[10px] text-red-500 bg-red-500/5 border-t border-border/40">
          {resetError}
        </div>
      )}
    </div>
  );
}

/* ───────── Score Entry Modal ───────── */
const TEAM_SPORT_METRICS = {
  FOOTBALL: [
    { key: 'goals', label: 'Goals' },
    { key: 'assists', label: 'Assists' },
    { key: 'shots_on_target', label: 'Shots on Target' },
  ],
  BASKETBALL: [
    { key: 'points_scored', label: 'Points' },
    { key: 'shots_taken', label: 'Shots Taken' },
    { key: 'shots_on_target', label: 'Shots on Target' },
  ],
  VOLLEYBALL: [
    { key: 'spikes', label: 'Spikes' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'serves', label: 'Serves' },
    { key: 'digs', label: 'Digs' },
  ],
};

function ScoreEntryModal({
  match,
  tournamentId,
  sportType,
  clubMembers,
  onClose,
  onSubmitted,
}) {
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Per-player stat entry state (team sports only)
  const isTeam = isTeamSport(sportType) && sportType !== 'CRICKET'; // Cricket has its own scorer
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const metricDefs = TEAM_SPORT_METRICS[sportType] || [];

  // Team A players  &  Team B players — each { name, userId, metrics: { key: value } }
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);

  // Members for autocomplete (re-map clubMembers to expected { id, name, avatarUrl })
  const members = useMemo(
    () =>
      (clubMembers || []).map((m) => ({
        id: m.userId,
        name: m.name,
        avatarUrl: m.avatarUrl,
      })),
    [clubMembers],
  );

  function addPlayer(team) {
    const blank = {
      name: '',
      userId: '',
      metrics: Object.fromEntries(metricDefs.map((d) => [d.key, 0])),
    };
    if (team === 'A') setTeamAPlayers((p) => [...p, blank]);
    else setTeamBPlayers((p) => [...p, blank]);
  }

  function removePlayer(team, idx) {
    if (team === 'A') setTeamAPlayers((p) => p.filter((_, i) => i !== idx));
    else setTeamBPlayers((p) => p.filter((_, i) => i !== idx));
  }

  function updatePlayer(team, idx, field, value) {
    const setter = team === 'A' ? setTeamAPlayers : setTeamBPlayers;
    setter((prev) => {
      const copy = [...prev];
      if (field === 'name' || field === 'userId') {
        copy[idx] = { ...copy[idx], [field]: value };
      } else {
        copy[idx] = {
          ...copy[idx],
          metrics: { ...copy[idx].metrics, [field]: value },
        };
      }
      return copy;
    });
  }

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
      const payload = { scoreA: a, scoreB: b };

      // Attach per-player stats if any entered
      if (showPlayerStats) {
        const allPlayers = [
          ...teamAPlayers
            .filter((p) => p.name.trim())
            .map((p) => ({ ...p, team: 'A' })),
          ...teamBPlayers
            .filter((p) => p.name.trim())
            .map((p) => ({ ...p, team: 'B' })),
        ];
        if (allPlayers.length > 0) {
          payload.playerStats = allPlayers.map((p) => ({
            name: p.name.trim(),
            userId: p.userId || null,
            team: p.team,
            metrics: Object.fromEntries(
              Object.entries(p.metrics).map(([k, v]) => [k, parseInt(v) || 0]),
            ),
          }));
        }
      }

      const res = await fetch(`/api/matches/${match.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  function renderPlayerRows(team, players, setPlayers) {
    return (
      <div className="space-y-2">
        {players.map((p, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-start gap-2 bg-bg/50 border border-border/50 rounded-lg p-2"
          >
            <div className="flex-1 min-w-35">
              <MemberAutocomplete
                members={members}
                value={p.name}
                playerId={p.userId}
                onChange={(name, uid) => {
                  updatePlayer(team, idx, 'name', name);
                  updatePlayer(team, idx, 'userId', uid);
                }}
                placeholder="Player name"
                inputClassName="w-full px-2 py-1 rounded border border-border bg-bg text-primary text-xs focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
            {metricDefs.map((def) => (
              <div key={def.key} className="w-16">
                <label className="block text-[9px] text-muted mb-0.5 truncate">
                  {def.label}
                </label>
                <input
                  type="number"
                  min="0"
                  value={p.metrics[def.key]}
                  onChange={(e) =>
                    updatePlayer(team, idx, def.key, e.target.value)
                  }
                  className="w-full px-1 py-1 rounded border border-border bg-bg text-primary text-xs text-center focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => removePlayer(team, idx)}
              className="mt-4 px-1.5 text-red-400 hover:text-red-300 text-xs"
              title="Remove player"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addPlayer(team)}
          className="w-full py-1.5 rounded-lg border border-dashed border-accent/40 text-accent text-xs hover:bg-accent/5 transition-colors"
        >
          + Add Player
        </button>
      </div>
    );
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Enter Score"
      maxWidth={isTeam && showPlayerStats ? 'max-w-xl' : 'max-w-sm'}
    >
      <form
        onSubmit={handleSubmit}
        className="p-6 space-y-5 overflow-y-auto max-h-[80vh]"
      >
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

        {/* Per-player stats toggle (team sports only, except cricket) */}
        {isTeam && metricDefs.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowPlayerStats(!showPlayerStats)}
              className={`w-full py-2 rounded-lg border text-xs font-medium transition-all ${
                showPlayerStats
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-muted hover:border-accent/50'
              }`}
            >
              {showPlayerStats
                ? '▾ Hide per-player stats'
                : '▸ Add per-player stats (optional)'}
            </button>
          </div>
        )}

        {/* Per-player stat forms */}
        {isTeam && showPlayerStats && metricDefs.length > 0 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                {match.teamA} — Players
              </h4>
              {renderPlayerRows('A', teamAPlayers, setTeamAPlayers)}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                {match.teamB} — Players
              </h4>
              {renderPlayerRows('B', teamBPlayers, setTeamBPlayers)}
            </div>
          </div>
        )}

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

/* ───────── Edit Tournament Modal ───────── */
function EditTournamentModal({ tournament, onClose, onSaved }) {
  const [name, setName] = useState(tournament.name);
  const [sportType, setSportType] = useState(tournament.sportType);
  const [startDate, setStartDate] = useState(
    tournament.startDate ? tournament.startDate.slice(0, 10) : '',
  );
  const [endDate, setEndDate] = useState(
    tournament.endDate ? tournament.endDate.slice(0, 10) : '',
  );
  const [status, setStatusVal] = useState(tournament.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        sportType,
        startDate: startDate || undefined,
        endDate: endDate || null,
        status,
      };
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save.');
        setSubmitting(false);
        return;
      }
      onSaved({
        name: name.trim(),
        sportType,
        startDate: startDate
          ? new Date(startDate).toISOString()
          : tournament.startDate,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        status,
      });
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Edit Tournament"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Name */}
        <div>
          <label
            htmlFor="edit-name"
            className="text-xs text-muted uppercase tracking-wider mb-1.5 block"
          >
            Tournament Name
          </label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            autoFocus
            required
          />
        </div>

        {/* Sport Type */}
        <div>
          <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">
            Sport
          </label>
          <div className="grid grid-cols-3 gap-2">
            {VALID_SPORTS.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setSportType(s.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  sportType === s.value
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-bg border-border text-muted hover:border-border/80'
                }`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs text-muted uppercase tracking-wider mb-1.5 block">
            Status
          </label>
          <div className="flex gap-2">
            {['UPCOMING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => setStatusVal(st)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  status === st
                    ? STATUS_STYLES[st] + ' border-current'
                    : 'bg-bg border-border text-muted hover:border-border/80'
                }`}
              >
                {STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="edit-start"
              className="text-xs text-muted uppercase tracking-wider mb-1.5 block"
            >
              Start Date
            </label>
            <DatePicker
              id="edit-start"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="edit-end"
              className="text-xs text-muted uppercase tracking-wider mb-1.5 block"
            >
              End Date
            </label>
            <DatePicker
              id="edit-end"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:bg-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AccessibleModal>
  );
}

/* ───────── Delete Tournament Modal ───────── */
function DeleteTournamentModal({ tournament, clubId, onClose }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  async function handleDelete() {
    setError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete.');
        setDeleting(false);
        return;
      }
      router.push(`/dashboard/clubs/${clubId}`);
      router.refresh();
    } catch {
      setError('Network error.');
      setDeleting(false);
    }
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Delete Tournament"
      maxWidth="max-w-sm"
    >
      <div className="p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-primary font-medium">
            Are you sure you want to delete{' '}
            <span className="font-bold">{tournament.name}</span>?
          </p>
          <p className="text-xs text-muted mt-2">
            This will permanently remove the tournament, all matches, brackets,
            and synced stats. This action cannot be undone.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirm-delete"
            className="text-xs text-muted mb-1.5 block"
          >
            Type{' '}
            <span className="font-mono font-bold text-red-500">DELETE</span> to
            confirm
          </label>
          <input
            id="confirm-delete"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
            placeholder="DELETE"
          />
        </div>

        {error && (
          <p
            className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg text-center"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:bg-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || confirmText !== 'DELETE'}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting…' : 'Delete Forever'}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}

/* ───────── Edit Match Modal ───────── */
function EditMatchModal({ match, clubMembers, isTeam, onClose, onSaved }) {
  const [teamA, setTeamA] = useState(match.teamA);
  const [teamB, setTeamB] = useState(match.teamB);
  const [playerAId, setPlayerAId] = useState(match.playerA?.id || '');
  const [playerBId, setPlayerBId] = useState(match.playerB?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handlePlayerSelect(side, userId) {
    const member = clubMembers.find((m) => m.userId === userId);
    if (side === 'A') {
      setPlayerAId(userId);
      if (member?.name) setTeamA(member.name);
    } else {
      setPlayerBId(userId);
      if (member?.name) setTeamB(member.name);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!teamA.trim() || !teamB.trim()) {
      setError('Both team names are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamA: teamA.trim(),
          teamB: teamB.trim(),
          ...(isTeam
            ? {}
            : { playerAId: playerAId || null, playerBId: playerBId || null }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save.');
        setSubmitting(false);
        return;
      }
      onSaved(match.id, data.match);
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Edit Match"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Team A */}
        <div className="space-y-2">
          <label className="text-xs text-muted uppercase tracking-wider block">
            {isTeam ? 'Team A' : 'Team / Player A'}
          </label>
          <input
            type="text"
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
            placeholder={isTeam ? 'Enter team name' : ''}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            required
          />
          {!isTeam && clubMembers.length > 0 && (
            <select
              value={playerAId}
              onChange={(e) => handlePlayerSelect('A', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Select linked player…</option>
              {clubMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name || m.userId}
                </option>
              ))}
            </select>
          )}
        </div>

        <div
          className="text-center text-muted text-xs font-bold"
          aria-hidden="true"
        >
          vs
        </div>

        {/* Team B */}
        <div className="space-y-2">
          <label className="text-xs text-muted uppercase tracking-wider block">
            {isTeam ? 'Team B' : 'Team / Player B'}
          </label>
          <input
            type="text"
            value={teamB}
            onChange={(e) => setTeamB(e.target.value)}
            placeholder={isTeam ? 'Enter team name' : ''}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            required
          />
          {!isTeam && clubMembers.length > 0 && (
            <select
              value={playerBId}
              onChange={(e) => handlePlayerSelect('B', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Select linked player…</option>
              {clubMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name || m.userId}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <p
            className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg text-center"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:bg-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Save Match'}
          </button>
        </div>
      </form>
    </AccessibleModal>
  );
}
