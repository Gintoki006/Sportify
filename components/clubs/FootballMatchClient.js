'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AccessibleModal from '@/components/ui/AccessibleModal';
import MemberAutocomplete from '@/components/ui/MemberAutocomplete';

/* ───────── Constants ───────── */
const EVENT_ICONS = {
  GOAL: '⚽',
  OWN_GOAL: '⚽🔴',
  YELLOW_CARD: '🟨',
  RED_CARD: '🟥',
  SUBSTITUTION: '🔄',
  CORNER: '📐',
  PENALTY_KICK: '⚽🎯',
  PENALTY_SCORED: '⚽✅',
  PENALTY_MISSED: '⚽❌',
  OFFSIDE: '🚩',
  FOUL: '⛔',
  HALF_TIME: '⏸️',
  FULL_TIME: '🏁',
  KICK_OFF: '▶️',
};

const STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  FIRST_HALF: '1st Half',
  HALF_TIME: 'Half Time',
  SECOND_HALF: '2nd Half',
  EXTRA_TIME_FIRST: 'Extra Time 1st',
  EXTRA_TIME_SECOND: 'Extra Time 2nd',
  PENALTIES: 'Penalties',
  COMPLETED: 'Completed',
};

const ACTIVE_PERIODS = [
  'FIRST_HALF',
  'SECOND_HALF',
  'EXTRA_TIME_FIRST',
  'EXTRA_TIME_SECOND',
  'PENALTIES',
];

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function FootballMatchClient({ match, members = [] }) {
  const router = useRouter();
  const [footballData, setFootballData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchCompleted, setMatchCompleted] = useState(match.completed);

  // Modal states
  const [showSetup, setShowSetup] = useState(false);
  const [showScorer, setShowScorer] = useState(false);

  // Live polling
  const [liveData, setLiveData] = useState(null);
  const pollRef = useRef(null);

  const canScore = match.canScore;

  /* ── Fetch full scorecard data ── */
  const fetchScorecard = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${match.id}/football`);
      if (res.ok) {
        const data = await res.json();
        setFootballData(data.footballData);
        if (data.match?.completed) setMatchCompleted(true);
      }
    } catch {
      /* swallow */
    } finally {
      setLoading(false);
    }
  }, [match.id]);

  /* ── Initial data load ── */
  useEffect(() => {
    fetchScorecard();
  }, [fetchScorecard]);

  /* ── Live Polling (spectators only) ── */
  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${match.id}/football/live`);
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
        if (data.completed) setMatchCompleted(true);
      }
    } catch {
      /* swallow */
    }
  }, [match.id]);

  useEffect(() => {
    if (!matchCompleted && !canScore && footballData) {
      const timer = setTimeout(fetchLive, 0);
      pollRef.current = setInterval(fetchLive, 5000);
      return () => {
        clearTimeout(timer);
        clearInterval(pollRef.current);
      };
    }
  }, [matchCompleted, canScore, fetchLive, footballData]);

  const isLive =
    footballData &&
    !matchCompleted &&
    ACTIVE_PERIODS.includes(footballData.status);
  const isSetUp = footballData !== null;
  const needsSetup = !isSetUp && !matchCompleted;

  /* ── Determine current status from live or scorecard data ── */
  const currentStatus =
    liveData?.status || footballData?.status || 'NOT_STARTED';
  const scoreA = liveData?.scoreA ?? match.scoreA ?? 0;
  const scoreB = liveData?.scoreB ?? match.scoreB ?? 0;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6">
        {match.isStandalone ? (
          <Link
            href="/dashboard/matches"
            className="text-xs text-accent hover:underline inline-flex items-center gap-1 mb-2"
          >
            ← Back to Matches
          </Link>
        ) : match.tournament ? (
          <Link
            href={`/dashboard/clubs/${match.club?.id}/tournament/${match.tournament.id}`}
            className="text-xs text-accent hover:underline inline-flex items-center gap-1 mb-2"
          >
            ← {match.tournament.name}
          </Link>
        ) : null}

        <div className="flex items-center justify-between gap-2 mb-3">
          {match.round ? (
            <span className="text-xs text-muted">Round {match.round}</span>
          ) : (
            <span className="text-xs text-muted">
              {match.isStandalone ? 'Standalone Match' : 'Match'}
            </span>
          )}
          <div className="flex items-center gap-2">
            {currentStatus !== 'NOT_STARTED' &&
              currentStatus !== 'COMPLETED' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400">
                  {STATUS_LABELS[currentStatus] || currentStatus}
                </span>
              )}
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
            {matchCompleted && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Score display */}
        <FootballScoreSummary
          match={match}
          footballData={footballData}
          liveData={liveData}
          scoreA={scoreA}
          scoreB={scoreB}
          matchCompleted={matchCompleted}
          currentStatus={currentStatus}
        />

        {/* Actions for scorer */}
        {canScore && !matchCompleted && (
          <div className="flex gap-2 mt-4">
            {needsSetup ? (
              <button
                onClick={() => setShowSetup(true)}
                className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold hover:brightness-110 transition-all"
              >
                ⚽ Set Lineups
              </button>
            ) : (
              <button
                onClick={() => setShowScorer(true)}
                className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold hover:brightness-110 transition-all"
              >
                ⚽ Open Scorer
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Event Timeline ── */}
      {footballData && footballData.events?.length > 0 && (
        <EventTimeline
          events={footballData.events}
          teamA={match.teamA}
          teamB={match.teamB}
        />
      )}

      {/* ── Team Sheets ── */}
      {footballData && (
        <TeamSheets
          teamAPlayers={footballData.teamAPlayers}
          teamBPlayers={footballData.teamBPlayers}
          teamA={match.teamA}
          teamB={match.teamB}
        />
      )}

      {/* ── Match Stats ── */}
      {footballData?.matchStats && (
        <MatchStatsSummary
          matchStats={footballData.matchStats}
          teamA={match.teamA}
          teamB={match.teamB}
        />
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">Loading match data…</p>
        </div>
      )}

      {/* ── Setup Modal ── */}
      {showSetup && (
        <FootballSetupModal
          match={match}
          members={members}
          onClose={() => setShowSetup(false)}
          onSetupComplete={(data) => {
            setFootballData(data);
            setShowSetup(false);
            fetchScorecard();
          }}
        />
      )}

      {/* ── Scorer Modal ── */}
      {showScorer && footballData && (
        <FootballScorerPanel
          match={match}
          members={members}
          footballData={footballData}
          onClose={() => setShowScorer(false)}
          onEventRecorded={() => fetchScorecard()}
          onStatusChanged={(result) => {
            fetchScorecard();
            if (result.matchCompleted) {
              setMatchCompleted(true);
              setShowScorer(false);
            }
          }}
          onUndo={() => fetchScorecard()}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FootballScoreSummary
   ═══════════════════════════════════════════════════════ */
function FootballScoreSummary({
  match,
  footballData,
  liveData,
  scoreA,
  scoreB,
  matchCompleted,
  currentStatus,
}) {
  const htA = liveData?.halfTimeScoreA ?? footballData?.scores?.halfTime?.teamA;
  const htB = liveData?.halfTimeScoreB ?? footballData?.scores?.halfTime?.teamB;
  const penA =
    liveData?.penaltyScoreA ?? footballData?.scores?.penalties?.teamA;
  const penB =
    liveData?.penaltyScoreB ?? footballData?.scores?.penalties?.teamB;

  const winner =
    matchCompleted && scoreA !== scoreB
      ? scoreA > scoreB
        ? match.teamA
        : match.teamB
      : null;

  // Real-time minute display using server periodStartedAt
  const isLive = ACTIVE_PERIODS.includes(currentStatus);
  const periodStartedAt =
    liveData?.periodStartedAt || footballData?.periodStartedAt;
  const halfDur =
    liveData?.halfDuration ||
    footballData?.halfDuration ||
    match.halfDuration ||
    match.tournament?.halfDuration ||
    45;

  const [liveMinute, setLiveMinute] = useState(0);
  const timerRef = useRef(null);

  // Compute real-time minute from server timestamp
  const computeMinute = useCallback(() => {
    if (!periodStartedAt || !isLive) return 0;
    let base = 1;
    if (currentStatus === 'SECOND_HALF') base = halfDur + 1;
    else if (currentStatus === 'EXTRA_TIME_FIRST') base = 2 * halfDur + 1;
    else if (currentStatus === 'EXTRA_TIME_SECOND') base = 2 * halfDur + 16;
    else if (currentStatus === 'PENALTIES') base = 2 * halfDur + 30;
    const elapsedMs = Date.now() - new Date(periodStartedAt).getTime();
    return base + Math.max(0, Math.floor(elapsedMs / 60000));
  }, [periodStartedAt, isLive, currentStatus, halfDur]);

  useEffect(() => {
    if (isLive && periodStartedAt) {
      const id = setInterval(() => {
        setLiveMinute(computeMinute());
      }, 1000);
      timerRef.current = id;
      return () => clearInterval(id);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      let val = 0;
      if (currentStatus === 'HALF_TIME') val = halfDur;
      else if (currentStatus === 'FULL_TIME' || currentStatus === 'COMPLETED')
        val = 2 * halfDur;
      const t = setTimeout(() => setLiveMinute(val), 0);
      return () => clearTimeout(t);
    }
  }, [isLive, periodStartedAt, computeMinute, currentStatus, halfDur]);

  function formatMatchMinute(min) {
    let normalEnd = 0;
    if (currentStatus === 'FIRST_HALF') normalEnd = halfDur;
    else if (currentStatus === 'SECOND_HALF') normalEnd = 2 * halfDur;
    else if (currentStatus === 'EXTRA_TIME_FIRST') normalEnd = 2 * halfDur + 15;
    else if (currentStatus === 'EXTRA_TIME_SECOND')
      normalEnd = 2 * halfDur + 30;

    if (normalEnd > 0 && min > normalEnd) {
      return `${normalEnd}+${min - normalEnd}'`;
    }
    return `${min}'`;
  }

  // Show minute if live with a valid timestamp, or for non-active statuses that have a meaningful time
  const showMinute = isLive && periodStartedAt;
  const showStaticStatus =
    !matchCompleted && !isLive && currentStatus !== 'NOT_STARTED';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        {/* Team A */}
        <div className="text-center flex-1">
          <p
            className={`text-lg font-bold ${winner === match.teamA ? 'text-accent' : 'text-primary'}`}
          >
            {match.teamA}
          </p>
          <p className="text-4xl font-black text-primary mt-1">
            {scoreA ?? '—'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1">
          {matchCompleted ? (
            <span className="text-xs text-muted font-medium">FULL TIME</span>
          ) : showMinute ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-red-400 tabular-nums animate-pulse">
                {formatMatchMinute(liveMinute)}
              </span>
              <span className="text-[10px] text-muted">
                {STATUS_LABELS[currentStatus]}
              </span>
            </div>
          ) : showStaticStatus ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-bold text-muted tabular-nums">
                {liveMinute > 0 ? formatMatchMinute(liveMinute) : ''}
              </span>
              <span className="text-[10px] text-muted">
                {STATUS_LABELS[currentStatus]}
              </span>
            </div>
          ) : (
            <span className="text-lg text-muted font-bold">VS</span>
          )}
        </div>

        {/* Team B */}
        <div className="text-center flex-1">
          <p
            className={`text-lg font-bold ${winner === match.teamB ? 'text-accent' : 'text-primary'}`}
          >
            {match.teamB}
          </p>
          <p className="text-4xl font-black text-primary mt-1">
            {scoreB ?? '—'}
          </p>
        </div>
      </div>

      {/* Half-time score */}
      {htA != null && htB != null && (htA > 0 || htB > 0) && (
        <p className="text-center text-xs text-muted">
          HT: {htA} – {htB}
        </p>
      )}

      {/* Penalty score */}
      {penA != null && penB != null && (
        <p className="text-center text-xs text-amber-400">
          Penalties: {penA} – {penB}
        </p>
      )}

      {/* Winner */}
      {winner && (
        <div className="text-center py-2 px-4 rounded-xl bg-accent/10 border border-accent/20">
          <p className="text-sm font-semibold text-accent">🏆 {winner} wins!</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EventTimeline — chronological match events
   ═══════════════════════════════════════════════════════ */
function EventTimeline({ events, teamA, teamB }) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? events : events.slice(-10);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Match Events</h3>
        {events.length > 10 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-accent hover:underline"
          >
            {expanded ? 'Show recent' : `Show all (${events.length})`}
          </button>
        )}
      </div>
      <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
        {displayed.map((ev) => {
          const icon = EVENT_ICONS[ev.eventType] || '📋';
          const isTeamA = ev.team === 'A';
          const teamName = isTeamA ? teamA : teamB;

          let desc = ev.description || '';
          if (ev.eventType === 'GOAL') {
            desc = ev.assistPlayerName
              ? `${ev.playerName} (Assist: ${ev.assistPlayerName})`
              : ev.playerName;
          } else if (ev.eventType === 'OWN_GOAL') {
            desc = `${ev.playerName} (OG)`;
          } else if (
            ev.eventType === 'YELLOW_CARD' ||
            ev.eventType === 'RED_CARD'
          ) {
            desc = ev.playerName;
          } else if (ev.eventType === 'SUBSTITUTION') {
            desc = ev.playerName;
          } else if (!desc) {
            desc = ev.playerName;
          }

          return (
            <div
              key={ev.id}
              className={`flex items-center gap-3 px-4 py-2.5 ${
                isTeamA ? '' : 'flex-row-reverse text-right'
              }`}
            >
              <span className="text-xs font-semibold text-muted w-10 shrink-0 text-center">
                {ev.minute}&apos;
                {ev.addedTime ? `+${ev.addedTime}` : ''}
              </span>
              <span className="text-sm shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary truncate">{desc}</p>
                <p className="text-[10px] text-muted">{teamName}</p>
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <p className="text-sm text-muted text-center py-6">No events yet</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TeamSheets — two-column player list
   ═══════════════════════════════════════════════════════ */
function TeamSheets({ teamAPlayers, teamBPlayers, teamA, teamB }) {
  if (!teamAPlayers?.length && !teamBPlayers?.length) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-primary">Team Sheets</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <TeamColumn players={teamAPlayers} teamName={teamA} />
        <TeamColumn players={teamBPlayers} teamName={teamB} />
      </div>
    </div>
  );
}

function TeamColumn({ players, teamName }) {
  if (!players?.length) return <div className="p-4" />;

  return (
    <div className="p-4">
      <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        {teamName}
      </h4>
      <div
        className="overflow-x-auto"
        role="region"
        aria-label={`${teamName} player stats`}
        tabIndex={0}
      >
        <table
          className="w-full text-xs"
          aria-label={`${teamName} player statistics`}
        >
          <thead>
            <tr className="border-b border-border text-muted">
              <th scope="col" className="text-left py-1.5 pr-2 font-medium">
                Player
              </th>
              <th
                scope="col"
                className="text-right py-1.5 px-1 font-medium"
                aria-label="Goals"
              >
                ⚽
              </th>
              <th
                scope="col"
                className="text-right py-1.5 px-1 font-medium"
                aria-label="Assists"
              >
                🅰️
              </th>
              <th
                scope="col"
                className="text-right py-1.5 px-1 font-medium"
                aria-label="Yellow Cards"
              >
                🟨
              </th>
              <th
                scope="col"
                className="text-right py-1.5 px-1 font-medium"
                aria-label="Red Cards"
              >
                🟥
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border/30 hover:bg-accent/5 transition-colors"
              >
                <td className="py-1.5 pr-2 text-primary whitespace-nowrap">
                  <span className="font-medium">{p.playerName}</span>
                  {!p.isStarting && (
                    <span className="ml-1 text-[9px] text-muted">(sub)</span>
                  )}
                  {p.minuteSubbedOut != null && (
                    <span className="ml-1 text-[9px] text-amber-400">
                      ↩ {p.minuteSubbedOut}&apos;
                    </span>
                  )}
                  {p.minuteSubbedIn != null && (
                    <span className="ml-1 text-[9px] text-green-400">
                      ↪ {p.minuteSubbedIn}&apos;
                    </span>
                  )}
                </td>
                <td
                  className={`text-right py-1.5 px-1 ${p.goals > 0 ? 'font-semibold text-accent' : 'text-muted'}`}
                >
                  {p.goals || '–'}
                </td>
                <td
                  className={`text-right py-1.5 px-1 ${p.assists > 0 ? 'font-semibold text-blue-400' : 'text-muted'}`}
                >
                  {p.assists || '–'}
                </td>
                <td className="text-right py-1.5 px-1 text-muted">
                  {p.yellowCards || '–'}
                </td>
                <td className="text-right py-1.5 px-1 text-muted">
                  {p.redCards || '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MatchStatsSummary — side-by-side team comparison
   ═══════════════════════════════════════════════════════ */
function MatchStatsSummary({ matchStats, teamA, teamB }) {
  const statsA = matchStats.teamA;
  const statsB = matchStats.teamB;

  const rows = [
    {
      label: 'Shots on Target',
      a: statsA.shotsOnTarget,
      b: statsB.shotsOnTarget,
    },
    { label: 'Corners', a: statsA.corners, b: statsB.corners },
    { label: 'Fouls', a: statsA.fouls, b: statsB.fouls },
    { label: 'Yellow Cards', a: statsA.yellowCards, b: statsB.yellowCards },
    { label: 'Red Cards', a: statsA.redCards, b: statsB.redCards },
    { label: 'Offsides', a: statsA.offsides, b: statsB.offsides },
  ];

  // Only show if there's any data
  const hasData = rows.some((r) => r.a > 0 || r.b > 0);
  if (!hasData) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-primary">Match Stats</h3>
      </div>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between text-xs text-muted font-medium">
          <span className="flex-1 text-center">{teamA}</span>
          <span className="w-24" />
          <span className="flex-1 text-center">{teamB}</span>
        </div>
        {rows.map((row) => {
          const total = row.a + row.b || 1;
          const pctA = (row.a / total) * 100;
          return (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-8 text-right text-sm font-semibold text-primary">
                {row.a}
              </span>
              <div className="flex-1">
                <div className="flex h-2 rounded-full overflow-hidden bg-bg border border-border/50">
                  <div
                    className="bg-accent/60 transition-all"
                    style={{ width: `${pctA}%` }}
                  />
                  <div
                    className="bg-blue-400/60 transition-all"
                    style={{ width: `${100 - pctA}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted text-center mt-0.5">
                  {row.label}
                </p>
              </div>
              <span className="w-8 text-left text-sm font-semibold text-primary">
                {row.b}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FootballSetupModal — Phase 21.9
   ═══════════════════════════════════════════════════════ */
function FootballSetupModal({ match, members, onClose, onSetupComplete }) {
  const defaultSize = match.squadSize || match.tournament?.squadSize || 11;
  const [teamAPlayers, setTeamAPlayers] = useState(
    Array.from({ length: defaultSize }, () => ({ name: '', playerId: '' })),
  );
  const [teamBPlayers, setTeamBPlayers] = useState(
    Array.from({ length: defaultSize }, () => ({ name: '', playerId: '' })),
  );
  const [halfDuration, setHalfDuration] = useState(
    match.halfDuration || match.tournament?.halfDuration || 45,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updatePlayer(team, idx, name, playerId) {
    const setter = team === 'A' ? setTeamAPlayers : setTeamBPlayers;
    setter((prev) => {
      const copy = [...prev];
      copy[idx] = { name, playerId };
      return copy;
    });
  }

  function addPlayer(team) {
    const setter = team === 'A' ? setTeamAPlayers : setTeamBPlayers;
    setter((prev) => [...prev, { name: '', playerId: '' }]);
  }

  function removePlayer(team, idx) {
    const setter = team === 'A' ? setTeamAPlayers : setTeamBPlayers;
    setter((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const filledA = teamAPlayers.filter((p) => p.name.trim());
    const filledB = teamBPlayers.filter((p) => p.name.trim());

    if (filledA.length < 1) {
      setError(`${match.teamA} needs at least 1 player.`);
      return;
    }
    if (filledB.length < 1) {
      setError(`${match.teamB} needs at least 1 player.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/football/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamAPlayers: filledA.map((p) => ({
            name: p.name.trim(),
            playerId: p.playerId || undefined,
          })),
          teamBPlayers: filledB.map((p) => ({
            name: p.name.trim(),
            playerId: p.playerId || undefined,
          })),
          halfDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to set up match.');
        setSubmitting(false);
        return;
      }

      onSetupComplete(data.footballMatch);
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  }

  function renderPlayerSlots(team, players) {
    return (
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {players.map((player, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-[10px] text-muted w-5 text-right shrink-0">
              {idx + 1}.
            </span>
            <MemberAutocomplete
              members={members}
              value={player.name}
              playerId={player.playerId}
              onChange={(name, pid) => updatePlayer(team, idx, name, pid)}
              placeholder={`Player ${idx + 1}`}
              className="flex-1"
            />
            {players.length > 1 && (
              <button
                type="button"
                onClick={() => removePlayer(team, idx)}
                className="shrink-0 text-red-400 hover:text-red-300 text-xs px-1"
                aria-label={`Remove player ${idx + 1}`}
              >
                ✕
              </button>
            )}
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
      title="Set Lineups"
      maxWidth="max-w-2xl"
    >
      <form
        onSubmit={handleSubmit}
        className="p-5 space-y-4 overflow-y-auto max-h-[75vh]"
      >
        {/* Half duration config */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
            Half Duration (minutes)
          </label>
          <div className="flex gap-2">
            {[30, 35, 40, 45].map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setHalfDuration(dur)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  halfDuration === dur
                    ? 'bg-accent/15 text-accent border border-accent/40'
                    : 'border border-border text-muted hover:border-accent/30'
                }`}
              >
                {dur} min
              </button>
            ))}
          </div>
        </div>

        {/* Two-column lineup entry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Team A */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent/60" />
              {match.teamA}
            </h3>
            {renderPlayerSlots('A', teamAPlayers)}
          </div>

          {/* Team B */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400/60" />
              {match.teamB}
            </h3>
            {renderPlayerSlots('B', teamBPlayers)}
          </div>
        </div>

        {error && (
          <p
            className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Setting up…
            </span>
          ) : (
            '⚽ Confirm Lineups & Start'
          )}
        </button>
      </form>
    </AccessibleModal>
  );
}

/* ═══════════════════════════════════════════════════════
   FootballScorerPanel — Phase 21.10
   ═══════════════════════════════════════════════════════ */
function FootballScorerPanel({
  match,
  members,
  footballData,
  onClose,
  onEventRecorded,
  onStatusChanged,
  onUndo,
}) {
  const [minute, setMinute] = useState('');
  const [addedTime, setAddedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  // Current match state (refreshed from parent)
  const [currentData, setCurrentData] = useState(footballData);

  // Active flow states
  const [activeFlow, setActiveFlow] = useState(null);
  // null | 'goal' | 'card' | 'sub' | 'penalty-shootout'

  // Stoppage time prompt state
  const [stoppagePrompt, setStoppagePrompt] = useState(null);
  // null | { targetStatus: string, stoppageMinutes: string }

  /* ── Live Match Timer (real-time, server-based) ── */
  const halfDuration =
    currentData?.halfDuration ||
    footballData?.halfDuration ||
    match.halfDuration ||
    match.tournament?.halfDuration ||
    45;
  const intervalRef = useRef(null);
  const [displayMinute, setDisplayMinute] = useState(0);
  const minuteManualRef = useRef(false); // true when user manually edits minute

  // Compute the base minute at the start of a given period
  const getBaseMinuteForStatus = useCallback(
    (st) => {
      switch (st) {
        case 'FIRST_HALF':
          return 1;
        case 'SECOND_HALF':
          return halfDuration + 1;
        case 'EXTRA_TIME_FIRST':
          return 2 * halfDuration + 1;
        case 'EXTRA_TIME_SECOND':
          return 2 * halfDuration + 16;
        case 'PENALTIES':
          return 2 * halfDuration + 30;
        default:
          return 0;
      }
    },
    [halfDuration],
  );

  // Compute the current minute from server-side periodStartedAt
  const computeRealTimeMinute = useCallback(
    (st, periodStartedAt) => {
      if (!periodStartedAt || !ACTIVE_PERIODS.includes(st)) return 0;
      const base = getBaseMinuteForStatus(st);
      const elapsedMs = Date.now() - new Date(periodStartedAt).getTime();
      const elapsedMin = Math.max(0, Math.floor(elapsedMs / 60000));
      return base + elapsedMin;
    },
    [getBaseMinuteForStatus],
  );

  // Start / restart the timer when status or periodStartedAt changes
  useEffect(() => {
    const st = currentData?.status || 'NOT_STARTED';
    const periodStartedAt = currentData?.periodStartedAt;
    const isPlay = ACTIVE_PERIODS.includes(st);

    if (isPlay && periodStartedAt) {
      // Compute initial minute from server timestamp
      const initial = computeRealTimeMinute(st, periodStartedAt);
      setDisplayMinute(initial);
      if (!minuteManualRef.current) setMinute(String(initial));

      // Update every second using real clock
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const cur = computeRealTimeMinute(st, periodStartedAt);
        setDisplayMinute(cur);
        if (!minuteManualRef.current) setMinute(String(cur));
      }, 1000);
    } else {
      // Not playing — stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Set display to a sensible static value
      if (st === 'HALF_TIME') setDisplayMinute(halfDuration);
      else if (st === 'FULL_TIME' || st === 'COMPLETED')
        setDisplayMinute(2 * halfDuration);
      else setDisplayMinute(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData?.status, currentData?.periodStartedAt]);

  // Format the timer display (e.g. "36'" or "45+2'")
  const formatTimer = useCallback(
    (min) => {
      const st = currentData?.status || 'NOT_STARTED';
      let normalEnd = 0;
      if (st === 'FIRST_HALF' || st === 'HALF_TIME') normalEnd = halfDuration;
      else if (st === 'SECOND_HALF' || st === 'FULL_TIME' || st === 'COMPLETED')
        normalEnd = 2 * halfDuration;
      else if (st === 'EXTRA_TIME_FIRST') normalEnd = 2 * halfDuration + 15;
      else if (st === 'EXTRA_TIME_SECOND') normalEnd = 2 * halfDuration + 30;

      if (normalEnd > 0 && min > normalEnd) {
        return `${normalEnd}+${min - normalEnd}'`;
      }
      return `${min}'`;
    },
    [currentData?.status, halfDuration],
  );

  // Goal flow
  const [goalTeam, setGoalTeam] = useState('A');
  const [goalScorer, setGoalScorer] = useState('');
  const [goalScorerId, setGoalScorerId] = useState('');
  const [goalAssist, setGoalAssist] = useState('');
  const [goalAssistId, setGoalAssistId] = useState('');
  const [isOwnGoal, setIsOwnGoal] = useState(false);

  // Card flow
  const [cardTeam, setCardTeam] = useState('A');
  const [cardPlayer, setCardPlayer] = useState('');
  const [cardPlayerId, setCardPlayerId] = useState('');
  const [cardType, setCardType] = useState('YELLOW_CARD');

  // Sub flow
  const [subTeam, setSubTeam] = useState('A');
  const [subOutPlayer, setSubOutPlayer] = useState('');
  const [subOutPlayerId, setSubOutPlayerId] = useState('');
  const [subInPlayer, setSubInPlayer] = useState('');
  const [subInPlayerId, setSubInPlayerId] = useState('');

  // Penalty shootout flow
  const [penTeam, setPenTeam] = useState('A');
  const [penPlayer, setPenPlayer] = useState('');
  const [penPlayerId, setPenPlayerId] = useState('');

  // Sync with parent data
  useEffect(() => {
    setCurrentData(footballData);
  }, [footballData]);

  const status = currentData?.status || 'NOT_STARTED';
  const isActive = ACTIVE_PERIODS.includes(status);
  const isPenalties = status === 'PENALTIES';

  // Get players per team from the football data
  const teamAPlayers = useMemo(
    () =>
      (currentData?.teamAPlayers || []).filter(
        (p) => !p.minuteSubbedOut || p.minuteSubbedOut === null,
      ),
    [currentData],
  );
  const teamBPlayers = useMemo(
    () =>
      (currentData?.teamBPlayers || []).filter(
        (p) => !p.minuteSubbedOut || p.minuteSubbedOut === null,
      ),
    [currentData],
  );
  const allTeamAPlayers = useMemo(
    () => currentData?.teamAPlayers || [],
    [currentData],
  );
  const allTeamBPlayers = useMemo(
    () => currentData?.teamBPlayers || [],
    [currentData],
  );

  const scoreA = currentData?.scores?.total?.teamA ?? match.scoreA ?? 0;
  const scoreB = currentData?.scores?.total?.teamB ?? match.scoreB ?? 0;

  // ── Record an event ──
  async function recordEvent(eventType, payload = {}) {
    const min = parseInt(minute);
    if (isNaN(min) || min < 0) {
      setError('Enter a valid minute.');
      return;
    }

    // Auto-compute addedTime if minute exceeds normal period end
    let computedAddedTime = parseInt(addedTime) || undefined;
    const st = currentData?.status || 'NOT_STARTED';
    let normalEnd = 0;
    if (st === 'FIRST_HALF') normalEnd = halfDuration;
    else if (st === 'SECOND_HALF') normalEnd = 2 * halfDuration;
    else if (st === 'EXTRA_TIME_FIRST') normalEnd = 2 * halfDuration + 15;
    else if (st === 'EXTRA_TIME_SECOND') normalEnd = 2 * halfDuration + 30;

    if (normalEnd > 0 && min > normalEnd && !computedAddedTime) {
      computedAddedTime = min - normalEnd;
    }

    setSubmitting(true);
    setError('');

    try {
      const body = {
        eventType,
        minute: normalEnd > 0 && min > normalEnd ? normalEnd : min,
        addedTime: computedAddedTime,
        ...payload,
      };

      const res = await fetch(`/api/matches/${match.id}/football/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to record event.');
        setSubmitting(false);
        return;
      }

      setLastResult(data);
      setCurrentData((prev) => ({
        ...prev,
        ...data.matchData,
      }));
      resetFlows();
      // Reset manual override so timer auto-fills again
      minuteManualRef.current = false;
      setMinute(String(displayMinute));
      onEventRecorded(data);
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Change match status (with optional stoppage time prompt) ──
  function requestStatusChange(newStatus) {
    // Show stoppage time prompt for half time and full time transitions
    const needsStoppagePrompt =
      (status === 'FIRST_HALF' && newStatus === 'HALF_TIME') ||
      (status === 'SECOND_HALF' &&
        (newStatus === 'FULL_TIME' || newStatus === 'COMPLETED')) ||
      (status === 'EXTRA_TIME_FIRST' && newStatus === 'EXTRA_TIME_SECOND') ||
      (status === 'EXTRA_TIME_SECOND' &&
        (newStatus === 'PENALTIES' || newStatus === 'COMPLETED'));

    if (needsStoppagePrompt) {
      setStoppagePrompt({ targetStatus: newStatus, stoppageMinutes: '' });
    } else {
      changeStatus(newStatus);
    }
  }

  function confirmStoppageAndChangeStatus() {
    if (!stoppagePrompt) return;
    // If user entered stoppage time, we just acknowledge it (it's informational)
    // The timer already handles added time display automatically
    const target = stoppagePrompt.targetStatus;
    setStoppagePrompt(null);
    changeStatus(target);
  }

  async function changeStatus(newStatus) {
    setSubmitting(true);
    setError('');
    minuteManualRef.current = false;

    try {
      const res = await fetch(`/api/matches/${match.id}/football/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to change status.');
        setSubmitting(false);
        return;
      }

      setCurrentData((prev) => ({
        ...prev,
        status: data.matchData?.status || newStatus,
        periodStartedAt: data.matchData?.periodStartedAt || null,
      }));
      onStatusChanged(data);
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Undo last event ──
  async function handleUndo() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/matches/${match.id}/football/undo`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to undo.');
        setSubmitting(false);
        return;
      }
      setLastResult(null);
      onUndo();
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetFlows() {
    setActiveFlow(null);
    setGoalScorer('');
    setGoalScorerId('');
    setGoalAssist('');
    setGoalAssistId('');
    setIsOwnGoal(false);
    setCardPlayer('');
    setCardPlayerId('');
    setSubOutPlayer('');
    setSubOutPlayerId('');
    setSubInPlayer('');
    setSubInPlayerId('');
    setPenPlayer('');
    setPenPlayerId('');
  }

  // ── Goal confirm ──
  function confirmGoal() {
    if (!goalScorer.trim()) {
      setError('Select a scorer.');
      return;
    }
    const eventType = isOwnGoal ? 'OWN_GOAL' : 'GOAL';
    recordEvent(eventType, {
      playerName: goalScorer.trim(),
      playerId: goalScorerId || undefined,
      assistPlayerName: goalAssist.trim() || undefined,
      assistPlayerId: goalAssistId || undefined,
      team: goalTeam,
    });
  }

  // ── Card confirm ──
  function confirmCard() {
    if (!cardPlayer.trim()) {
      setError('Select a player.');
      return;
    }
    recordEvent(cardType, {
      playerName: cardPlayer.trim(),
      playerId: cardPlayerId || undefined,
      team: cardTeam,
    });
  }

  // ── Sub confirm ──
  function confirmSub() {
    if (!subOutPlayer.trim()) {
      setError('Select player going off.');
      return;
    }
    if (!subInPlayer.trim()) {
      setError('Select player coming on.');
      return;
    }
    recordEvent('SUBSTITUTION', {
      playerName: subOutPlayer.trim(),
      playerId: subOutPlayerId || undefined,
      team: subTeam,
      subInPlayerName: subInPlayer.trim(),
      subInPlayerId: subInPlayerId || undefined,
      description: `Substitution: ${subInPlayer.trim()} on for ${subOutPlayer.trim()}`,
    });
  }

  // ── Quick events (corner, offside, foul) ──
  function quickEvent(eventType, team) {
    recordEvent(eventType, {
      playerName: '—',
      team,
    });
  }

  // ── Penalty shootout ──
  function confirmPenalty(scored) {
    if (!penPlayer.trim()) {
      setError('Select a penalty taker.');
      return;
    }
    recordEvent(scored ? 'PENALTY_SCORED' : 'PENALTY_MISSED', {
      playerName: penPlayer.trim(),
      playerId: penPlayerId || undefined,
      team: penTeam,
    });
  }

  // Players for the currently selected team in each flow
  const getFlowPlayers = (team) => {
    const src = team === 'A' ? allTeamAPlayers : allTeamBPlayers;
    return src.map((p) => ({
      id: p.playerId || p.id,
      name: p.playerName,
    }));
  };

  // Members list + match players combined for autocomplete
  const combinedMembers = useMemo(() => {
    const ids = new Set();
    const result = [];
    for (const m of members) {
      if (!ids.has(m.id || m.userId)) {
        ids.add(m.id || m.userId);
        result.push({
          id: m.id || m.userId,
          name: m.name,
          avatarUrl: m.avatarUrl,
        });
      }
    }
    for (const p of [...allTeamAPlayers, ...allTeamBPlayers]) {
      const pid = p.playerId || p.id;
      if (!ids.has(pid)) {
        ids.add(pid);
        result.push({ id: pid, name: p.playerName });
      }
    }
    return result;
  }, [members, allTeamAPlayers, allTeamBPlayers]);

  /* ── Period control buttons ── */
  function renderPeriodControls() {
    const buttons = [];

    if (status === 'NOT_STARTED') {
      buttons.push(
        <button
          key="kickoff"
          disabled={submitting}
          onClick={() => changeStatus('FIRST_HALF')}
          className="flex-1 py-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 font-semibold text-sm hover:bg-green-500/30 transition-all disabled:opacity-50"
        >
          ▶️ Kick Off
        </button>,
      );
    }
    if (status === 'FIRST_HALF') {
      buttons.push(
        <button
          key="ht"
          disabled={submitting}
          onClick={() => requestStatusChange('HALF_TIME')}
          className="flex-1 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs hover:bg-amber-500/30 transition-all disabled:opacity-50"
        >
          ⏸️ Half Time
        </button>,
      );
    }
    if (status === 'HALF_TIME') {
      buttons.push(
        <button
          key="sh"
          disabled={submitting}
          onClick={() => changeStatus('SECOND_HALF')}
          className="flex-1 py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 font-semibold text-xs hover:bg-green-500/30 transition-all disabled:opacity-50"
        >
          ▶️ Second Half
        </button>,
      );
    }
    if (status === 'SECOND_HALF') {
      buttons.push(
        <button
          key="ft"
          disabled={submitting}
          onClick={() => requestStatusChange('FULL_TIME')}
          className="flex-1 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs hover:bg-amber-500/30 transition-all disabled:opacity-50"
        >
          🏁 Full Time
        </button>,
      );
    }
    if (status === 'FULL_TIME') {
      buttons.push(
        <button
          key="et"
          disabled={submitting}
          onClick={() => changeStatus('EXTRA_TIME_FIRST')}
          className="flex-1 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold text-xs hover:bg-blue-500/30 transition-all disabled:opacity-50"
        >
          ⚡ Extra Time
        </button>,
        <button
          key="complete-ft"
          disabled={submitting}
          onClick={() => changeStatus('COMPLETED')}
          className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 font-semibold text-xs hover:bg-green-500/30 transition-all disabled:opacity-50"
        >
          ✅ End Match
        </button>,
      );
    }
    if (status === 'EXTRA_TIME_FIRST') {
      buttons.push(
        <button
          key="et2"
          disabled={submitting}
          onClick={() => requestStatusChange('EXTRA_TIME_SECOND')}
          className="flex-1 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs hover:bg-amber-500/30 transition-all disabled:opacity-50"
        >
          ⏸️ ET Half Time
        </button>,
      );
    }
    if (status === 'EXTRA_TIME_SECOND') {
      buttons.push(
        <button
          key="pen"
          disabled={submitting}
          onClick={() => requestStatusChange('PENALTIES')}
          className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs hover:bg-red-500/30 transition-all disabled:opacity-50"
        >
          🎯 Penalties
        </button>,
        <button
          key="complete-et"
          disabled={submitting}
          onClick={() => requestStatusChange('COMPLETED')}
          className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 font-semibold text-xs hover:bg-green-500/30 transition-all disabled:opacity-50"
        >
          ✅ End Match
        </button>,
      );
    }
    if (status === 'PENALTIES') {
      buttons.push(
        <button
          key="complete-pen"
          disabled={submitting}
          onClick={() => changeStatus('COMPLETED')}
          className="flex-1 py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 font-semibold text-xs hover:bg-green-500/30 transition-all disabled:opacity-50"
        >
          ✅ End Match
        </button>,
      );
    }

    if (buttons.length === 0) return null;
    return (
      <div className="flex gap-2" role="group" aria-label="Period controls">
        {buttons}
      </div>
    );
  }

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title="Football Scorer"
      maxWidth="max-w-lg"
    >
      <div className="p-4 space-y-4 overflow-y-auto max-h-[85vh]">
        {/* ── Mini scoreboard with timer ── */}
        <div
          className="bg-bg rounded-xl p-3 border border-border"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Timer badge — top right */}
          {isActive && (
            <div className="flex justify-end mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-red-400 tabular-nums">
                  {formatTimer(displayMinute)}
                </span>
              </span>
            </div>
          )}
          {!isActive && status !== 'NOT_STARTED' && (
            <div className="flex justify-end mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted/10 border border-border">
                <span className="text-sm font-bold text-muted tabular-nums">
                  {formatTimer(displayMinute)}
                </span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted truncate">{match.teamA}</p>
              <p className="text-2xl font-black text-primary">{scoreA}</p>
            </div>
            <div className="text-center px-4">
              <span className="text-xs font-medium text-muted">
                {STATUS_LABELS[status] || status}
              </span>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted truncate">{match.teamB}</p>
              <p className="text-2xl font-black text-primary">{scoreB}</p>
            </div>
          </div>
          {isPenalties && (
            <div className="flex items-center justify-center gap-4 mt-1">
              <span className="text-xs text-amber-400">
                Pen: {currentData?.scores?.penalties?.teamA ?? 0}
              </span>
              <span className="text-xs text-muted">–</span>
              <span className="text-xs text-amber-400">
                {currentData?.scores?.penalties?.teamB ?? 0}
              </span>
            </div>
          )}
        </div>

        {/* ── Minute input (auto-filled from timer, editable) ── */}
        {isActive && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label
                className="block text-[10px] font-semibold text-muted uppercase mb-1"
                htmlFor="match-minute"
              >
                Minute{' '}
                {!minuteManualRef.current && (
                  <span className="text-accent">(auto)</span>
                )}
              </label>
              <div className="relative">
                <input
                  id="match-minute"
                  type="number"
                  min="0"
                  max="150"
                  value={minute}
                  onChange={(e) => {
                    minuteManualRef.current = true;
                    setMinute(e.target.value);
                  }}
                  onBlur={() => {
                    // If user clears the field, revert to auto
                    if (!minute.trim()) {
                      minuteManualRef.current = false;
                      setMinute(String(displayMinute));
                    }
                  }}
                  placeholder="e.g. 45"
                  className={`w-full px-3 py-2 rounded-lg border bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                    minuteManualRef.current
                      ? 'border-amber-500/50'
                      : 'border-border'
                  }`}
                />
                {minuteManualRef.current && (
                  <button
                    type="button"
                    onClick={() => {
                      minuteManualRef.current = false;
                      setMinute(String(displayMinute));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-accent hover:underline"
                    title="Reset to auto timer"
                  >
                    auto
                  </button>
                )}
              </div>
            </div>
            <div className="w-20">
              <label
                className="block text-[10px] font-semibold text-muted uppercase mb-1"
                htmlFor="added-time"
              >
                +Time
              </label>
              <input
                id="added-time"
                type="number"
                min="0"
                max="15"
                value={addedTime}
                onChange={(e) => setAddedTime(e.target.value)}
                placeholder="+0"
                className="w-full px-2 py-2 rounded-lg border border-border bg-bg text-primary text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
        )}

        {/* ── Period Controls ── */}
        {renderPeriodControls()}

        {/* ── Stoppage Time Prompt ── */}
        {stoppagePrompt && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              ⏱️ Stoppage / Added Time
            </p>
            <p className="text-xs text-muted">
              How many minutes of added time were played?
            </p>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={stoppagePrompt.stoppageMinutes}
                  onChange={(e) =>
                    setStoppagePrompt((prev) => ({
                      ...prev,
                      stoppageMinutes: e.target.value,
                    }))
                  }
                  placeholder="e.g. 3"
                  className="w-full px-3 py-2 rounded-lg border border-amber-500/30 bg-bg text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <button
                onClick={confirmStoppageAndChangeStatus}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-all disabled:opacity-50"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setStoppagePrompt(null);
                  changeStatus(stoppagePrompt.targetStatus);
                }}
                className="px-3 py-2 rounded-lg border border-border text-muted text-xs font-medium hover:bg-surface transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── Quick Action Buttons ── */}
        {isActive && !isPenalties && activeFlow === null && (
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase mb-2">
              Record Event
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                disabled={submitting}
                onClick={() => setActiveFlow('goal')}
                className="py-3 rounded-xl bg-green-500/15 text-green-400 border border-green-500/25 font-semibold text-sm hover:bg-green-500/25 transition-all disabled:opacity-50"
              >
                ⚽ Goal
              </button>
              <button
                disabled={submitting}
                onClick={() => setActiveFlow('card')}
                className="py-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 font-semibold text-sm hover:bg-amber-500/25 transition-all disabled:opacity-50"
              >
                🟨 Card
              </button>
              <button
                disabled={submitting}
                onClick={() => setActiveFlow('sub')}
                className="py-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25 font-semibold text-sm hover:bg-blue-500/25 transition-all disabled:opacity-50"
              >
                🔄 Sub
              </button>
              <button
                disabled={submitting}
                onClick={() => {
                  recordEvent('FOUL', {
                    playerName: '—',
                    team: 'A',
                  });
                }}
                className="py-3 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25 font-semibold text-sm hover:bg-red-500/25 transition-all disabled:opacity-50"
              >
                ⛔ Foul
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                disabled={submitting}
                onClick={() => quickEvent('CORNER', 'A')}
                className="py-2 rounded-xl border border-border text-muted text-xs font-medium hover:bg-surface transition-all disabled:opacity-50"
              >
                📐 Corner {match.teamA?.slice(0, 3)}
              </button>
              <button
                disabled={submitting}
                onClick={() => quickEvent('CORNER', 'B')}
                className="py-2 rounded-xl border border-border text-muted text-xs font-medium hover:bg-surface transition-all disabled:opacity-50"
              >
                📐 Corner {match.teamB?.slice(0, 3)}
              </button>
              <button
                disabled={submitting}
                onClick={() => quickEvent('OFFSIDE', 'A')}
                className="py-2 rounded-xl border border-border text-muted text-xs font-medium hover:bg-surface transition-all disabled:opacity-50"
              >
                🚩 Offside
              </button>
            </div>
          </div>
        )}

        {/* ── Penalty Shootout Flow ── */}
        {isPenalties && activeFlow === null && (
          <div className="space-y-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Penalty Shootout
            </p>
            <div className="flex gap-2 mb-2">
              {['A', 'B'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPenTeam(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    penTeam === t
                      ? 'border-accent bg-accent/10 text-accent border'
                      : 'border border-border text-muted hover:border-accent/50'
                  }`}
                >
                  {t === 'A' ? match.teamA : match.teamB}
                </button>
              ))}
            </div>
            <MemberAutocomplete
              members={getFlowPlayers(penTeam)}
              value={penPlayer}
              playerId={penPlayerId}
              onChange={(n, pid) => {
                setPenPlayer(n);
                setPenPlayerId(pid);
              }}
              placeholder="Penalty taker"
            />
            <div className="flex gap-2">
              <button
                disabled={submitting}
                onClick={() => confirmPenalty(true)}
                className="flex-1 py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 font-semibold text-sm hover:bg-green-500/30 transition-all disabled:opacity-50"
              >
                ✅ Scored
              </button>
              <button
                disabled={submitting}
                onClick={() => confirmPenalty(false)}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-sm hover:bg-red-500/30 transition-all disabled:opacity-50"
              >
                ❌ Missed
              </button>
            </div>
          </div>
        )}

        {/* ── Goal Flow ── */}
        {activeFlow === 'goal' && (
          <div className="space-y-3 p-3 rounded-xl border border-green-500/30 bg-green-500/5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                {isOwnGoal ? 'Own Goal' : 'Goal'}
              </p>
              <button
                type="button"
                onClick={() => setIsOwnGoal(!isOwnGoal)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  isOwnGoal
                    ? 'border-red-500/40 bg-red-500/10 text-red-400'
                    : 'border-border text-muted hover:border-red-500/40'
                }`}
              >
                OG
              </button>
            </div>

            {/* Team selector */}
            <div className="flex gap-2">
              {['A', 'B'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setGoalTeam(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    goalTeam === t
                      ? 'border-accent bg-accent/10 text-accent border'
                      : 'border border-border text-muted hover:border-accent/50'
                  }`}
                >
                  {t === 'A' ? match.teamA : match.teamB}
                </button>
              ))}
            </div>

            {/* Scorer */}
            <MemberAutocomplete
              members={getFlowPlayers(goalTeam)}
              value={goalScorer}
              playerId={goalScorerId}
              onChange={(n, pid) => {
                setGoalScorer(n);
                setGoalScorerId(pid);
              }}
              placeholder="Goal scorer"
            />

            {/* Assist (optional, not for own goal) */}
            {!isOwnGoal && (
              <MemberAutocomplete
                members={getFlowPlayers(goalTeam)}
                value={goalAssist}
                playerId={goalAssistId}
                onChange={(n, pid) => {
                  setGoalAssist(n);
                  setGoalAssistId(pid);
                }}
                placeholder="Assist (optional)"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => resetFlows()}
                className="flex-1 py-2 rounded-lg border border-border text-muted text-xs font-medium hover:bg-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmGoal}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold hover:bg-green-500/30 transition-all disabled:opacity-50"
              >
                ⚽ Confirm Goal
              </button>
            </div>
          </div>
        )}

        {/* ── Card Flow ── */}
        {activeFlow === 'card' && (
          <div className="space-y-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Card
            </p>

            {/* Card type */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCardType('YELLOW_CARD')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  cardType === 'YELLOW_CARD'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-400 border'
                    : 'border border-border text-muted hover:border-amber-500/50'
                }`}
              >
                🟨 Yellow
              </button>
              <button
                type="button"
                onClick={() => setCardType('RED_CARD')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  cardType === 'RED_CARD'
                    ? 'border-red-500 bg-red-500/20 text-red-400 border'
                    : 'border border-border text-muted hover:border-red-500/50'
                }`}
              >
                🟥 Red
              </button>
            </div>

            {/* Team */}
            <div className="flex gap-2">
              {['A', 'B'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCardTeam(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    cardTeam === t
                      ? 'border-accent bg-accent/10 text-accent border'
                      : 'border border-border text-muted hover:border-accent/50'
                  }`}
                >
                  {t === 'A' ? match.teamA : match.teamB}
                </button>
              ))}
            </div>

            {/* Player */}
            <MemberAutocomplete
              members={getFlowPlayers(cardTeam)}
              value={cardPlayer}
              playerId={cardPlayerId}
              onChange={(n, pid) => {
                setCardPlayer(n);
                setCardPlayerId(pid);
              }}
              placeholder="Player name"
            />

            <div className="flex gap-2">
              <button
                onClick={() => resetFlows()}
                className="flex-1 py-2 rounded-lg border border-border text-muted text-xs font-medium hover:bg-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmCard}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-all disabled:opacity-50"
              >
                {cardType === 'YELLOW_CARD' ? '🟨' : '🟥'} Confirm Card
              </button>
            </div>
          </div>
        )}

        {/* ── Substitution Flow ── */}
        {activeFlow === 'sub' && (
          <div className="space-y-3 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Substitution
            </p>

            {/* Team */}
            <div className="flex gap-2">
              {['A', 'B'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSubTeam(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    subTeam === t
                      ? 'border-accent bg-accent/10 text-accent border'
                      : 'border border-border text-muted hover:border-accent/50'
                  }`}
                >
                  {t === 'A' ? match.teamA : match.teamB}
                </button>
              ))}
            </div>

            {/* Player going off */}
            <div>
              <label className="block text-[10px] text-muted uppercase mb-1">
                Player Off
              </label>
              <MemberAutocomplete
                members={getFlowPlayers(subTeam)}
                value={subOutPlayer}
                playerId={subOutPlayerId}
                onChange={(n, pid) => {
                  setSubOutPlayer(n);
                  setSubOutPlayerId(pid);
                }}
                placeholder="Player going off"
              />
            </div>

            {/* Player coming on */}
            <div>
              <label className="block text-[10px] text-muted uppercase mb-1">
                Player On
              </label>
              <MemberAutocomplete
                members={combinedMembers}
                value={subInPlayer}
                playerId={subInPlayerId}
                onChange={(n, pid) => {
                  setSubInPlayer(n);
                  setSubInPlayerId(pid);
                }}
                placeholder="Player coming on"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => resetFlows()}
                className="flex-1 py-2 rounded-lg border border-border text-muted text-xs font-medium hover:bg-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmSub}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/30 transition-all disabled:opacity-50"
              >
                🔄 Confirm Sub
              </button>
            </div>
          </div>
        )}

        {/* ── Undo ── */}
        {isActive && activeFlow === null && (
          <button
            onClick={handleUndo}
            disabled={submitting}
            aria-label="Undo last event"
            className="w-full py-2 rounded-lg border border-border text-muted text-xs font-medium hover:bg-surface transition-all disabled:opacity-50"
          >
            ↩ Undo Last Event
          </button>
        )}

        {/* ── Error ── */}
        {error && (
          <p
            className="text-red-500 text-xs bg-red-500/10 px-3 py-2 rounded-lg"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* ── Last result feedback ── */}
        {lastResult?.event && (
          <div className="text-center" aria-live="assertive">
            <p className="text-xs text-muted">
              {EVENT_ICONS[lastResult.event.eventType]}{' '}
              {lastResult.event.minute}&apos; {lastResult.event.playerName}
              {lastResult.autoRedCard && ' — 2nd yellow → auto red card!'}
            </p>
          </div>
        )}
      </div>
    </AccessibleModal>
  );
}
