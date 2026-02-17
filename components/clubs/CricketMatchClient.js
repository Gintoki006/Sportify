'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AccessibleModal from '@/components/ui/AccessibleModal';
import MemberAutocomplete from '@/components/ui/MemberAutocomplete';

/* ───────── Constants ───────── */
const DISMISSAL_LABELS = {
  BOWLED: 'b',
  CAUGHT: 'c',
  LBW: 'lbw',
  RUN_OUT: 'run out',
  STUMPED: 'st',
  HIT_WICKET: 'hit wicket',
  RETIRED: 'retired',
  NOT_OUT: 'not out',
};

const EXTRA_LABELS = {
  WIDE: 'Wd',
  NO_BALL: 'Nb',
  BYE: 'B',
  LEG_BYE: 'Lb',
  PENALTY: 'P',
};

/* ───────── Helper: format overs display ───────── */
function formatOvers(overs) {
  const full = Math.floor(overs);
  const balls = Math.round((overs % 1) * 10);
  return `${full}.${balls}`;
}

/* ───────── Helper: build dismissal string ───────── */
function buildDismissalText(entry) {
  if (!entry.isOut) return 'not out';
  const parts = [];
  if (entry.dismissalType === 'CAUGHT') {
    parts.push(`c ${entry.fielderName || '?'}`);
    if (entry.bowlerName) parts.push(`b ${entry.bowlerName}`);
  } else if (entry.dismissalType === 'BOWLED') {
    parts.push(`b ${entry.bowlerName || '?'}`);
  } else if (entry.dismissalType === 'LBW') {
    parts.push(`lbw b ${entry.bowlerName || '?'}`);
  } else if (entry.dismissalType === 'RUN_OUT') {
    parts.push(`run out (${entry.fielderName || '?'})`);
  } else if (entry.dismissalType === 'STUMPED') {
    parts.push(`st ${entry.fielderName || '?'} b ${entry.bowlerName || '?'}`);
  } else if (entry.dismissalType === 'HIT_WICKET') {
    parts.push(`hit wicket b ${entry.bowlerName || '?'}`);
  } else if (entry.dismissalType === 'RETIRED') {
    parts.push('retired');
  }
  return parts.join(' ') || 'out';
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function CricketMatchClient({ match, members = [] }) {
  const router = useRouter();
  const [innings, setInnings] = useState(match.innings || []);
  const [activeTab, setActiveTab] = useState(
    match.innings?.length > 0
      ? match.innings[match.innings.length - 1].inningsNumber
      : 1,
  );
  const [matchCompleted, setMatchCompleted] = useState(match.completed);
  const [matchResultOverride, setMatchResultOverride] = useState(null);

  // Scorer state
  const [showScorer, setShowScorer] = useState(false);
  const [showStartInnings, setShowStartInnings] = useState(false);

  // Live polling
  const [liveData, setLiveData] = useState(null);
  const pollRef = useRef(null);

  const canScore = match.canScore;
  const maxOvers = match.tournament.overs;
  const maxWickets = match.tournament.playersPerSide - 1;

  // Determine current match state
  const activeInnings = innings.find((i) => !i.isComplete);
  const hasNoInnings = innings.length === 0;
  const firstComplete = innings.find(
    (i) => i.inningsNumber === 1 && i.isComplete,
  );
  const needsSecondInnings =
    firstComplete && !innings.find((i) => i.inningsNumber === 2);
  const isLive = !matchCompleted && (activeInnings || needsSecondInnings);

  // Calculate result (derived state, no effect needed)
  const matchResult = useMemo(() => {
    if (matchResultOverride) return matchResultOverride;
    if (!matchCompleted || innings.length < 2) return null;
    const inn1 = innings.find((i) => i.inningsNumber === 1);
    const inn2 = innings.find((i) => i.inningsNumber === 2);
    if (!inn1 || !inn2) return null;
    if (inn2.totalRuns > inn1.totalRuns) {
      const wr = maxWickets - inn2.totalWickets;
      return `${inn2.battingTeamName} won by ${wr} wicket${wr !== 1 ? 's' : ''}`;
    }
    if (inn1.totalRuns > inn2.totalRuns) {
      const diff = inn1.totalRuns - inn2.totalRuns;
      return `${inn1.battingTeamName} won by ${diff} run${diff !== 1 ? 's' : ''}`;
    }
    return 'Match tied';
  }, [matchCompleted, innings, maxWickets, matchResultOverride]);

  /* ── Live Polling ── */
  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${match.id}/cricket/live`);
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
        if (data.completed) {
          setMatchCompleted(true);
        }
      }
    } catch {
      /* swallow */
    }
  }, [match.id]);

  useEffect(() => {
    if (!matchCompleted && !canScore) {
      // Initial fetch deferred to avoid synchronous setState in effect body
      const initialTimeout = setTimeout(fetchLive, 0);
      pollRef.current = setInterval(fetchLive, 5000);
      return () => {
        clearTimeout(initialTimeout);
        clearInterval(pollRef.current);
      };
    }
  }, [matchCompleted, canScore, fetchLive]);

  /* ── Refresh scorecard from server ── */
  const refreshScorecard = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${match.id}/cricket`);
      if (res.ok) {
        const data = await res.json();
        setInnings(data.innings || []);
        if (data.match?.completed) {
          setMatchCompleted(true);
        }
        if (data.result) {
          setMatchResultOverride(data.result);
        }
      }
    } catch {
      /* swallow */
    }
  }, [match.id]);

  /* ── Target for 2nd innings ── */
  const target =
    innings.length >= 1 && innings[0].isComplete
      ? innings[0].totalRuns + 1
      : null;

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
        ) : (
          <Link
            href={`/dashboard/clubs/${match.club.id}/tournament/${match.tournament.id}`}
            className="text-xs text-accent hover:underline inline-flex items-center gap-1 mb-2"
          >
            ← {match.tournament.name}
          </Link>
        )}

        <div className="flex items-center justify-between gap-2 mb-3">
          {match.round ? (
            <span className="text-xs text-muted">Round {match.round}</span>
          ) : (
            <span className="text-xs text-muted">Standalone Match</span>
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

        {/* Score summary */}
        <MatchScoreSummary
          match={match}
          innings={innings}
          liveData={liveData}
          matchResult={matchResult}
          maxOvers={maxOvers}
          target={target}
        />

        {/* Actions for scorer */}
        {canScore && !matchCompleted && (
          <div className="flex gap-2 mt-4">
            {hasNoInnings || needsSecondInnings ? (
              <button
                onClick={() => setShowStartInnings(true)}
                className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold hover:brightness-110 transition-all"
              >
                {hasNoInnings ? '🏏 Start 1st Innings' : '🏏 Start 2nd Innings'}
              </button>
            ) : activeInnings ? (
              <button
                onClick={() => setShowScorer(true)}
                className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold hover:brightness-110 transition-all"
              >
                🏏 Open Scorer
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Innings Tabs ── */}
      {innings.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div
            className="flex border-b border-border"
            role="tablist"
            aria-label="Innings scorecard"
          >
            {innings.map((inn) => (
              <button
                key={inn.inningsNumber}
                onClick={() => setActiveTab(inn.inningsNumber)}
                role="tab"
                aria-selected={activeTab === inn.inningsNumber}
                aria-controls={`innings-panel-${inn.inningsNumber}`}
                id={`innings-tab-${inn.inningsNumber}`}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === inn.inningsNumber
                    ? 'bg-accent/10 text-accent border-b-2 border-accent'
                    : 'text-muted hover:text-primary hover:bg-surface'
                }`}
              >
                <span className="truncate">{inn.battingTeamName}</span>{' '}
                <span className="whitespace-nowrap">
                  {inn.totalRuns}/{inn.totalWickets}
                </span>{' '}
                <span className="text-muted text-xs whitespace-nowrap">
                  ({formatOvers(inn.totalOvers)})
                </span>
              </button>
            ))}
          </div>

          {/* Scorecard content */}
          {innings
            .filter((inn) => inn.inningsNumber === activeTab)
            .map((inn) => (
              <div
                key={inn.inningsNumber}
                role="tabpanel"
                id={`innings-panel-${inn.inningsNumber}`}
                aria-labelledby={`innings-tab-${inn.inningsNumber}`}
              >
                <InningsScorecard innings={inn} />
              </div>
            ))}
        </div>
      )}

      {/* ── Start Innings Modal ── */}
      {showStartInnings && (
        <StartInningsModal
          match={match}
          members={members}
          inningsNumber={needsSecondInnings ? 2 : 1}
          maxPlayers={match.tournament.playersPerSide}
          onClose={() => setShowStartInnings(false)}
          onStarted={(newInnings) => {
            setInnings((prev) => [...prev, newInnings]);
            setActiveTab(newInnings.inningsNumber);
            setShowStartInnings(false);
            setShowScorer(true);
          }}
        />
      )}

      {/* ── Scorer Modal ── */}
      {showScorer && activeInnings && (
        <ScorerModal
          match={match}
          members={members}
          innings={activeInnings}
          maxOvers={maxOvers}
          maxWickets={maxWickets}
          target={target}
          onClose={() => setShowScorer(false)}
          onBallRecorded={(result) => {
            refreshScorecard();
            if (result.matchCompleted) {
              setMatchCompleted(true);
              setShowScorer(false);
            }
            if (result.inningsComplete && !result.matchCompleted) {
              setShowScorer(false);
            }
          }}
          onUndo={() => refreshScorecard()}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MatchScoreSummary — compact score header
   ═══════════════════════════════════════════════════════ */
function MatchScoreSummary({
  match,
  innings,
  liveData,
  matchResult,
  maxOvers,
  target,
}) {
  const inn1 = innings.find((i) => i.inningsNumber === 1);
  const inn2 = innings.find((i) => i.inningsNumber === 2);

  // Use live data if available for active innings
  const live = liveData?.innings;

  const teamAScore = live
    ? live.find((i) => i.battingTeamName === match.teamA)
    : innings.find((i) => i.battingTeamName === match.teamA);
  const teamBScore = live
    ? live.find((i) => i.battingTeamName === match.teamB)
    : innings.find((i) => i.battingTeamName === match.teamB);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        {/* Team A */}
        <div className="text-center flex-1">
          <p className="text-sm font-semibold text-primary truncate">
            {match.teamA}
          </p>
          {teamAScore ? (
            <p className="text-2xl font-bold text-primary">
              {teamAScore.totalRuns}
              <span className="text-muted text-lg">
                /{teamAScore.totalWickets}
              </span>
              <span className="text-xs text-muted ml-1">
                ({formatOvers(teamAScore.totalOvers)})
              </span>
            </p>
          ) : (
            <p className="text-lg text-muted">—</p>
          )}
        </div>

        <span className="text-muted text-xs font-medium">vs</span>

        {/* Team B */}
        <div className="text-center flex-1">
          <p className="text-sm font-semibold text-primary truncate">
            {match.teamB}
          </p>
          {teamBScore ? (
            <p className="text-2xl font-bold text-primary">
              {teamBScore.totalRuns}
              <span className="text-muted text-lg">
                /{teamBScore.totalWickets}
              </span>
              <span className="text-xs text-muted ml-1">
                ({formatOvers(teamBScore.totalOvers)})
              </span>
            </p>
          ) : (
            <p className="text-lg text-muted">—</p>
          )}
        </div>
      </div>

      {/* Target info */}
      {target && inn2 && !inn2.isComplete && (
        <p className="text-center text-xs text-amber-400">
          Target: {target} • Need {Math.max(0, target - inn2.totalRuns)} runs
          from{' '}
          {Math.max(
            0,
            maxOvers * 6 -
              Math.floor(inn2.totalOvers) * 6 -
              Math.round((inn2.totalOvers % 1) * 10),
          )}{' '}
          balls
        </p>
      )}

      {/* Result */}
      {matchResult && (
        <p className="text-center text-sm font-semibold text-green-400">
          {matchResult}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   InningsScorecard — full batting + bowling tables
   ═══════════════════════════════════════════════════════ */
function InningsScorecard({ innings }) {
  const [showBallByBall, setShowBallByBall] = useState(false);

  return (
    <div className="p-4 space-y-6">
      {/* ── Batting Table ── */}
      <div>
        <h3
          className="text-xs font-semibold text-muted uppercase tracking-wider mb-3"
          id={`batting-${innings.inningsNumber}`}
        >
          {innings.battingTeamName} — Batting
        </h3>
        <div
          className="overflow-x-auto"
          role="region"
          aria-labelledby={`batting-${innings.inningsNumber}`}
          tabIndex={0}
        >
          <table
            className="w-full text-xs"
            aria-label={`${innings.battingTeamName} batting scorecard`}
          >
            <thead>
              <tr className="border-b border-border text-muted">
                <th scope="col" className="text-left py-2 pr-4 font-medium">
                  Batter
                </th>
                <th
                  scope="col"
                  className="text-left py-2 pr-4 font-medium min-w-[120px]"
                >
                  Dismissal
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-2 font-medium"
                  aria-label="Runs"
                >
                  R
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-2 font-medium"
                  aria-label="Balls Faced"
                >
                  B
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-2 font-medium"
                  aria-label="Fours"
                >
                  4s
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-2 font-medium"
                  aria-label="Sixes"
                >
                  6s
                </th>
                <th
                  scope="col"
                  className="text-right py-2 pl-2 font-medium"
                  aria-label="Strike Rate"
                >
                  SR
                </th>
              </tr>
            </thead>
            <tbody>
              {innings.battingEntries.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border/50 hover:bg-accent/5 transition-colors"
                >
                  <td className="py-2 pr-4 font-medium text-primary whitespace-nowrap">
                    {b.playerName}
                  </td>
                  <td className="py-2 pr-4 text-muted whitespace-nowrap">
                    {buildDismissalText(b)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right font-semibold ${b.runs >= 50 ? 'text-amber-400' : b.runs >= 30 ? 'text-accent' : 'text-primary'}`}
                  >
                    {b.runs}
                  </td>
                  <td className="py-2 px-2 text-right text-muted">
                    {b.ballsFaced}
                  </td>
                  <td className="py-2 px-2 text-right text-muted">{b.fours}</td>
                  <td className="py-2 px-2 text-right text-muted">{b.sixes}</td>
                  <td className="py-2 pl-2 text-right text-muted">
                    {b.strikeRate.toFixed(1)}
                  </td>
                </tr>
              ))}
              {/* Extras & Total */}
              <tr className="border-b border-border">
                <td className="py-2 pr-4 text-muted" colSpan={2}>
                  Extras
                </td>
                <td
                  className="py-2 px-2 text-right text-primary font-medium"
                  colSpan={5}
                >
                  {innings.extras}
                </td>
              </tr>
              <tr className="font-semibold">
                <td className="py-2 pr-4 text-primary" colSpan={2}>
                  Total
                </td>
                <td className="py-2 px-2 text-right text-primary" colSpan={5}>
                  {innings.totalRuns}/{innings.totalWickets}{' '}
                  <span className="text-muted font-normal">
                    ({formatOvers(innings.totalOvers)} ov)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bowling Table ── */}
      <div>
        <h3
          className="text-xs font-semibold text-muted uppercase tracking-wider mb-3"
          id={`bowling-${innings.inningsNumber}`}
        >
          {innings.bowlingTeamName} — Bowling
        </h3>
        <div
          className="overflow-x-auto"
          role="region"
          aria-labelledby={`bowling-${innings.inningsNumber}`}
          tabIndex={0}
        >
          <table
            className="w-full text-xs"
            aria-label={`${innings.bowlingTeamName} bowling figures`}
          >
            <thead>
              <tr className="border-b border-border text-muted">
                <th scope="col" className="text-left py-2 pr-4 font-medium">
                  Bowler
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-2 font-medium"
                  aria-label="Overs"
                >
                  O
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-2 font-medium"
                  aria-label="Maidens"
                >
                  M
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-2 font-medium"
                  aria-label="Runs Conceded"
                >
                  R
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-2 font-medium"
                  aria-label="Wickets"
                >
                  W
                </th>
                <th
                  scope="col"
                  className="text-right py-2 px-2 font-medium"
                  aria-label="Economy Rate"
                >
                  Econ
                </th>
                <th
                  scope="col"
                  className="text-right py-2 pl-2 font-medium"
                  aria-label="Wides"
                >
                  Wd
                </th>
                <th
                  scope="col"
                  className="text-right py-2 pl-2 font-medium"
                  aria-label="No Balls"
                >
                  Nb
                </th>
              </tr>
            </thead>
            <tbody>
              {innings.bowlingEntries.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border/50 hover:bg-accent/5 transition-colors"
                >
                  <td className="py-2 pr-4 font-medium text-primary whitespace-nowrap">
                    {b.playerName}
                  </td>
                  <td className="py-2 px-2 text-right text-muted">
                    {formatOvers(b.oversBowled)}
                  </td>
                  <td className="py-2 px-2 text-right text-muted">
                    {b.maidens}
                  </td>
                  <td className="py-2 px-2 text-right text-muted">
                    {b.runsConceded}
                  </td>
                  <td
                    className={`py-2 px-2 text-right font-semibold ${b.wickets >= 3 ? 'text-amber-400' : b.wickets >= 1 ? 'text-accent' : 'text-primary'}`}
                  >
                    {b.wickets}
                  </td>
                  <td className="py-2 px-2 text-right text-muted">
                    {b.economy.toFixed(1)}
                  </td>
                  <td className="py-2 pl-2 text-right text-muted">{b.wides}</td>
                  <td className="py-2 pl-2 text-right text-muted">
                    {b.noBalls}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Fall of Wickets ── */}
      {innings.fallOfWickets?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Fall of Wickets
          </h3>
          <div className="flex flex-wrap gap-2">
            {innings.fallOfWickets.map((f) => (
              <span
                key={f.wicketNumber}
                className="text-[11px] px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20"
              >
                {f.runs}/{f.wicketNumber} ({f.batsmanName}, {f.overs} ov)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Over-by-Over Summary ── */}
      {innings.overSummaries?.length > 0 && (
        <div>
          <button
            onClick={() => setShowBallByBall((v) => !v)}
            className="text-xs font-semibold text-accent hover:underline mb-2"
          >
            {showBallByBall ? 'Hide' : 'Show'} Ball-by-Ball
          </button>

          {showBallByBall && (
            <div className="space-y-2">
              {innings.overSummaries.map((over) => (
                <div
                  key={over.over}
                  className="flex items-start gap-3 p-2 rounded-lg bg-bg border border-border/50"
                >
                  <span className="text-[11px] font-semibold text-muted w-10 shrink-0">
                    Ov {over.over}
                  </span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {over.balls.map((ball, bi) => (
                      <span
                        key={bi}
                        title={ball.commentary}
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-semibold ${
                          ball.isWicket
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : ball.extraType
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : ball.runs === 4
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : ball.runs === 6
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : ball.runs === 0
                                    ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                    : 'bg-surface text-primary border border-border'
                        }`}
                      >
                        {ball.isWicket
                          ? 'W'
                          : ball.extraType
                            ? `${ball.runs + ball.extraRuns}${EXTRA_LABELS[ball.extraType] || ''}`
                            : ball.runs}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-muted shrink-0">
                    {over.runs} runs
                    {over.wickets > 0 ? `, ${over.wickets}W` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   StartInningsModal — initialize batting lineup & bowler
   ═══════════════════════════════════════════════════════ */
function StartInningsModal({
  match,
  members,
  inningsNumber,
  maxPlayers,
  onClose,
  onStarted,
}) {
  const [battingTeam, setBattingTeam] = useState('A');
  const [lineup, setLineup] = useState(
    Array.from({ length: maxPlayers }, (_, i) => ({ name: '', playerId: '' })),
  );
  const [bowlerName, setBowlerName] = useState('');
  const [bowlerPlayerId, setBowlerPlayerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleLineupChange(idx, field, value) {
    setLineup((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const filled = lineup.filter((l) => l.name.trim());
    if (filled.length < 2) {
      setError('At least 2 batsmen are required.');
      return;
    }
    if (!bowlerName.trim()) {
      setError('Opening bowler is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/cricket/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battingTeam,
          battingLineup: filled.map((l) => ({
            name: l.name.trim(),
            playerId: l.playerId || undefined,
          })),
          bowler: {
            name: bowlerName.trim(),
            playerId: bowlerPlayerId || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start innings.');
        setSubmitting(false);
        return;
      }

      // Fetch the full innings data for the scorecard
      const scorecardRes = await fetch(`/api/matches/${match.id}/cricket`);
      if (scorecardRes.ok) {
        const scorecardData = await scorecardRes.json();
        const newInn = scorecardData.innings?.find(
          (i) => i.inningsNumber === inningsNumber,
        );
        if (newInn) {
          onStarted(newInn);
          return;
        }
      }

      // Fallback: use the data from start endpoint
      onStarted({
        id: data.innings.id,
        inningsNumber: data.innings.inningsNumber,
        battingTeamName: data.innings.battingTeamName,
        bowlingTeamName: data.innings.bowlingTeamName,
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: 0,
        extras: 0,
        isComplete: false,
        battingEntries: data.innings.battingEntries || [],
        bowlingEntries: data.innings.bowlingEntries || [],
        fallOfWickets: [],
        overSummaries: [],
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
      title={`Start ${inningsNumber === 1 ? '1st' : '2nd'} Innings`}
    >
      <form
        onSubmit={handleSubmit}
        className="p-5 space-y-4 overflow-y-auto max-h-[70vh]"
      >
        {/* Batting team selector */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Batting Team
          </label>
          <div className="flex gap-2">
            {['A', 'B'].map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setBattingTeam(side)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  battingTeam === side
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted hover:border-accent/50'
                }`}
              >
                {side === 'A' ? match.teamA : match.teamB}
              </button>
            ))}
          </div>
        </div>

        {/* Batting lineup */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Batting Order
          </label>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {lineup.map((player, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-5 text-right">
                  {idx + 1}.
                </span>
                <MemberAutocomplete
                  members={members}
                  value={player.name}
                  playerId={player.playerId}
                  onChange={(name, pid) => {
                    handleLineupChange(idx, 'name', name);
                    handleLineupChange(idx, 'playerId', pid);
                  }}
                  placeholder={`Batsman ${idx + 1}${idx < 2 ? ' *' : ''}`}
                  required={idx < 2}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Opening bowler */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Opening Bowler
          </label>
          <MemberAutocomplete
            members={members}
            value={bowlerName}
            playerId={bowlerPlayerId}
            onChange={(name, pid) => {
              setBowlerName(name);
              setBowlerPlayerId(pid);
            }}
            placeholder="Bowler name"
            required
          />
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
              Starting…
            </span>
          ) : (
            'Start Innings'
          )}
        </button>
      </form>
    </AccessibleModal>
  );
}

/* ═══════════════════════════════════════════════════════
   ScorerModal — ball-by-ball scoring interface
   ═══════════════════════════════════════════════════════ */
function ScorerModal({
  match,
  members,
  innings,
  maxOvers,
  maxWickets,
  target,
  onClose,
  onBallRecorded,
  onUndo,
}) {
  const [currentBatsman, setCurrentBatsman] = useState('');
  const [currentBowler, setCurrentBowler] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastBallResult, setLastBallResult] = useState(null);

  // Wicket flow state
  const [wicketMode, setWicketMode] = useState(false);
  const [dismissalType, setDismissalType] = useState('');
  const [fielderName, setFielderName] = useState('');
  const [newBatsmanName, setNewBatsmanName] = useState('');
  const [newBatsmanId, setNewBatsmanId] = useState('');

  // Extra flow
  const [extraMode, setExtraMode] = useState(null); // 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE'

  // Live innings data
  const [liveInnings, setLiveInnings] = useState(innings);

  // Auto-select batsmen/bowler from current entries
  useEffect(() => {
    const notOut = innings.battingEntries?.filter((b) => !b.isOut) || [];
    if (notOut.length > 0 && !currentBatsman) {
      setCurrentBatsman(notOut[0].playerName);
    }
    const bowlers = innings.bowlingEntries || [];
    if (bowlers.length > 0 && !currentBowler) {
      setCurrentBowler(bowlers[bowlers.length - 1].playerName);
    }
  }, [innings, currentBatsman, currentBowler]);

  // Refresh live innings
  const refreshLive = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${match.id}/cricket`);
      if (res.ok) {
        const data = await res.json();
        const active = data.innings?.find(
          (i) => i.inningsNumber === innings.inningsNumber,
        );
        if (active) setLiveInnings(active);
      }
    } catch {
      /* swallow */
    }
  }, [match.id, innings.inningsNumber]);

  async function recordBall(runs, opts = {}) {
    if (!currentBatsman || !currentBowler) {
      setError('Select batsman and bowler first.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Resolve playerIds from the current entries
      const batsmanEntry = liveInnings.battingEntries?.find(
        (b) => b.playerName === currentBatsman,
      );
      const bowlerEntry = liveInnings.bowlingEntries?.find(
        (b) => b.playerName === currentBowler,
      );

      const payload = {
        batsmanName: currentBatsman,
        batsmanId: batsmanEntry?.playerId || undefined,
        bowlerName: currentBowler,
        bowlerId: bowlerEntry?.playerId || undefined,
        runsScored: runs,
        ...opts,
      };

      const res = await fetch(`/api/matches/${match.id}/cricket/ball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to record ball.');
        setSubmitting(false);
        return;
      }

      setLastBallResult(data);
      setLiveInnings((prev) => ({
        ...prev,
        totalRuns: data.innings.totalRuns,
        totalWickets: data.innings.totalWickets,
        totalOvers: data.innings.totalOvers,
        extras: data.innings.extras,
        isComplete: data.innings.isComplete,
      }));

      // Rotate strike on odd runs (bat runs or extra runs)
      const effectiveRuns =
        opts.extraType === 'BYE' || opts.extraType === 'LEG_BYE'
          ? opts.extraRuns || 0
          : opts.extraType === 'WIDE'
            ? opts.extraRuns || 0
            : runs;
      if (
        effectiveRuns % 2 === 1 &&
        !opts.isWicket &&
        opts.extraType !== 'WIDE'
      ) {
        const notOut = liveInnings.battingEntries?.filter(
          (b) => !b.isOut && b.playerName !== currentBatsman,
        );
        if (notOut?.length > 0) {
          setCurrentBatsman(notOut[0].playerName);
        }
      }

      // Reset modes
      setWicketMode(false);
      setExtraMode(null);
      setDismissalType('');
      setFielderName('');
      setNewBatsmanName('');
      setNewBatsmanId('');

      onBallRecorded(data);
      await refreshLive();
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUndo() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/matches/${match.id}/cricket/undo`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to undo.');
        setSubmitting(false);
        return;
      }
      setLastBallResult(null);
      await refreshLive();
      onUndo();
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleWicket() {
    if (!dismissalType) {
      setError('Select a dismissal type.');
      return;
    }
    recordBall(0, {
      isWicket: true,
      dismissalType,
      fielderName: fielderName || undefined,
      newBatsmanName: newBatsmanName || undefined,
      newBatsmanId: newBatsmanId || undefined,
      ...(extraMode ? { extraType: extraMode, extraRuns: 1 } : {}),
    });
  }

  const notOutBatsmen =
    liveInnings.battingEntries?.filter((b) => !b.isOut) || [];
  const bowlers = liveInnings.bowlingEntries || [];

  return (
    <AccessibleModal isOpen={true} onClose={onClose} title="Cricket Scorer">
      <div className="p-4 space-y-4 overflow-y-auto max-h-[80vh]">
        {/* Mini scoreboard */}
        <div
          className="bg-bg rounded-xl p-3 border border-border"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-lg font-bold text-primary"
                aria-label={`Score: ${liveInnings.totalRuns} for ${liveInnings.totalWickets}`}
              >
                {liveInnings.totalRuns}/{liveInnings.totalWickets}
              </p>
              <p className="text-xs text-muted">
                {formatOvers(liveInnings.totalOvers)} / {maxOvers} overs
              </p>
            </div>
            {target && (
              <div className="text-right">
                <p className="text-xs text-amber-400">Target: {target}</p>
                <p className="text-xs text-muted">
                  Need {Math.max(0, target - liveInnings.totalRuns)} runs
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Batsman / Bowler selectors */}
        <div className="grid grid-cols-1 min-[475px]:grid-cols-2 gap-3">
          <div>
            <label
              className="block text-[10px] font-semibold text-muted uppercase mb-1"
              htmlFor="on-strike-select"
            >
              On Strike
            </label>
            <select
              id="on-strike-select"
              value={currentBatsman}
              onChange={(e) => setCurrentBatsman(e.target.value)}
              aria-label="Select batsman on strike"
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Select…</option>
              {notOutBatsmen.map((b) => (
                <option key={b.playerName} value={b.playerName}>
                  {b.playerName} ({b.runs}* {b.ballsFaced}b)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-[10px] font-semibold text-muted uppercase mb-1"
              htmlFor="bowler-select"
            >
              Bowler
            </label>
            <div className="flex gap-1 relative">
              <select
                id="bowler-select"
                value={currentBowler}
                onChange={(e) => setCurrentBowler(e.target.value)}
                aria-label="Select current bowler"
                className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-bg text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="">Select…</option>
                {bowlers.map((b) => (
                  <option key={b.playerName} value={b.playerName}>
                    {b.playerName} ({formatOvers(b.oversBowled)}-{b.wickets})
                  </option>
                ))}
              </select>
              <NewBowlerButton
                matchId={match.id}
                inningsId={liveInnings.id}
                bowlers={bowlers}
                members={members}
                onAdded={(name) => {
                  setCurrentBowler(name);
                  refreshLive();
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Run Buttons ── */}
        {!wicketMode && (
          <div>
            <p
              className="text-[10px] font-semibold text-muted uppercase mb-2"
              id="run-buttons-label"
            >
              {extraMode ? `${EXTRA_LABELS[extraMode]} + Runs` : 'Runs'}
            </p>
            <div
              className="grid grid-cols-7 gap-1.5"
              role="group"
              aria-labelledby="run-buttons-label"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                <button
                  key={r}
                  disabled={submitting}
                  aria-label={`${r} run${r !== 1 ? 's' : ''}${extraMode ? ` (${extraMode.replace('_', ' ')})` : ''}`}
                  onClick={() => {
                    if (extraMode) {
                      if (extraMode === 'BYE' || extraMode === 'LEG_BYE') {
                        // Byes/leg-byes: no runs off the bat, all extras
                        recordBall(0, { extraType: extraMode, extraRuns: r });
                      } else if (extraMode === 'WIDE') {
                        // Wides: 1 penalty + any additional runs, all extras
                        recordBall(0, {
                          extraType: extraMode,
                          extraRuns: 1 + r,
                        });
                      } else if (extraMode === 'NO_BALL') {
                        // No-ball: batsman keeps runs, 1 penalty extra
                        recordBall(r, { extraType: extraMode, extraRuns: 1 });
                      }
                    } else {
                      recordBall(r);
                    }
                  }}
                  className={`py-3 rounded-xl font-bold text-lg transition-all disabled:opacity-50 ${
                    r === 4
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                      : r === 6
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                        : r === 0
                          ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20'
                          : 'bg-surface text-primary border border-border hover:bg-accent/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Extra Buttons ── */}
        {!wicketMode && (
          <div>
            <p
              className="text-[10px] font-semibold text-muted uppercase mb-2"
              id="extras-label"
            >
              Extras
            </p>
            <div
              className="flex gap-1.5"
              role="group"
              aria-labelledby="extras-label"
            >
              {['WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setExtraMode(extraMode === type ? null : type)}
                  aria-pressed={extraMode === type}
                  aria-label={`${type.replace('_', ' ')} extra`}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                    extraMode === type
                      ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                      : 'border-border text-muted hover:border-amber-500/50'
                  }`}
                >
                  {EXTRA_LABELS[type]}
                </button>
              ))}
            </div>
            {extraMode && (
              <p className="text-[10px] text-amber-400 mt-1">
                {extraMode} selected — tap a run button above
              </p>
            )}
          </div>
        )}

        {/* ── Wicket Button / Flow ── */}
        {!wicketMode ? (
          <button
            onClick={() => {
              setWicketMode(true);
              setExtraMode(null);
            }}
            className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-sm hover:bg-red-500/30 transition-all"
          >
            🔴 WICKET
          </button>
        ) : (
          <div className="space-y-3 p-3 rounded-xl border border-red-500/30 bg-red-500/5">
            <p
              className="text-xs font-semibold text-red-400 uppercase tracking-wider"
              id="wicket-label"
            >
              Wicket — {currentBatsman}
            </p>

            {/* Dismissal type */}
            <div
              className="grid grid-cols-4 gap-1.5"
              role="radiogroup"
              aria-labelledby="wicket-label"
            >
              {[
                'BOWLED',
                'CAUGHT',
                'LBW',
                'RUN_OUT',
                'STUMPED',
                'HIT_WICKET',
                'RETIRED',
              ].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDismissalType(d)}
                  role="radio"
                  aria-checked={dismissalType === d}
                  className={`py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                    dismissalType === d
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-border text-muted hover:border-red-500/50'
                  }`}
                >
                  {DISMISSAL_LABELS[d] || d}
                </button>
              ))}
            </div>

            {/* Fielder (for catches, run-outs, stumpings) */}
            {['CAUGHT', 'RUN_OUT', 'STUMPED'].includes(dismissalType) && (
              <input
                type="text"
                value={fielderName}
                onChange={(e) => setFielderName(e.target.value)}
                placeholder="Fielder name"
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-bg text-primary text-xs placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            )}

            {/* New batsman */}
            {dismissalType !== 'RETIRED' && (
              <MemberAutocomplete
                members={members}
                value={newBatsmanName}
                playerId={newBatsmanId}
                onChange={(name, pid) => {
                  setNewBatsmanName(name);
                  setNewBatsmanId(pid);
                }}
                placeholder="New batsman name"
                inputClassName="w-full px-3 py-1.5 rounded-lg border border-border bg-bg text-primary text-xs placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setWicketMode(false);
                  setDismissalType('');
                  setFielderName('');
                  setNewBatsmanName('');
                }}
                className="flex-1 py-2 rounded-lg border border-border text-muted text-xs font-medium hover:bg-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleWicket}
                disabled={submitting || !dismissalType}
                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        )}

        {/* ── Undo + Swap Strike ── */}
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={submitting}
            aria-label="Undo last ball delivery"
            className="flex-1 py-2 rounded-lg border border-border text-muted text-xs font-medium hover:bg-surface transition-all disabled:opacity-50"
          >
            ↩ Undo Last Ball
          </button>
          <button
            onClick={() => {
              const other = notOutBatsmen.find(
                (b) => b.playerName !== currentBatsman,
              );
              if (other) setCurrentBatsman(other.playerName);
            }}
            aria-label="Swap batting strike between batsmen"
            className="flex-1 py-2 rounded-lg border border-border text-muted text-xs font-medium hover:bg-surface transition-all"
          >
            🔄 Swap Strike
          </button>
        </div>

        {/* Error */}
        {error && (
          <p
            className="text-red-500 text-xs bg-red-500/10 px-3 py-2 rounded-lg"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Last ball result */}
        {lastBallResult?.ballEvent && (
          <div className="text-center" aria-live="assertive">
            <p className="text-xs text-muted">
              {lastBallResult.ballEvent.commentary}
            </p>
          </div>
        )}
      </div>
    </AccessibleModal>
  );
}

/* ───────── NewBowlerButton — inline add new bowler ───────── */
function NewBowlerButton({ matchId, inningsId, bowlers, members, onAdded }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');

  async function handleAdd() {
    if (!name.trim()) return;
    // We don't have a dedicated endpoint — new bowlers are auto-created
    // when the scorer sends a ball with their name. Just set and close.
    onAdded(name.trim(), playerId || undefined);
    setName('');
    setPlayerId('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="New bowler"
        className="shrink-0 px-2 py-1.5 rounded-lg border border-dashed border-accent/50 text-accent text-xs hover:bg-accent/10 transition-all"
      >
        +
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-1 sm:bottom-auto sm:w-56 bg-surface border border-border rounded-lg shadow-lg p-2">
      <MemberAutocomplete
        members={members}
        value={name}
        playerId={playerId}
        onChange={(n, pid) => {
          setName(n);
          setPlayerId(pid);
        }}
        placeholder="New bowler name"
        inputClassName="w-full px-2 py-1 rounded border border-border bg-bg text-primary text-xs mb-1 focus:outline-none focus:ring-1 focus:ring-accent/50"
      />
      <div className="flex gap-1">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-1 text-[10px] text-muted hover:text-primary"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          className="flex-1 py-1 text-[10px] text-accent font-medium"
        >
          Add
        </button>
      </div>
    </div>
  );
}
