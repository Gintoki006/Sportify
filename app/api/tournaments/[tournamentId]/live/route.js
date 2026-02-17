import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/tournaments/[tournamentId]/live — batch live scores
 *
 * Returns lightweight live data for ALL matches in the tournament that
 * are either in-progress (have an active innings/events) or recently completed.
 * Supports both Cricket and Football tournaments.
 * Designed for the "Live Matches" tab polling (every 10s).
 */
export async function GET(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        sportType: true,
        overs: true,
        playersPerSide: true,
        status: true,
        matches: {
          orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            round: true,
            teamA: true,
            teamB: true,
            scoreA: true,
            scoreB: true,
            completed: true,
            playerA: { select: { id: true, name: true, avatarUrl: true } },
            playerB: { select: { id: true, name: true, avatarUrl: true } },
            cricketInnings: {
              orderBy: { inningsNumber: 'asc' },
              select: {
                inningsNumber: true,
                battingTeamName: true,
                bowlingTeamName: true,
                totalRuns: true,
                totalWickets: true,
                totalOvers: true,
                extras: true,
                isComplete: true,
                battingEntries: {
                  where: { isOut: false },
                  orderBy: { battingOrder: 'asc' },
                  take: 2,
                  select: {
                    playerName: true,
                    runs: true,
                    ballsFaced: true,
                    strikeRate: true,
                  },
                },
                bowlingEntries: {
                  orderBy: { bowlingOrder: 'desc' },
                  take: 1,
                  select: {
                    playerName: true,
                    oversBowled: true,
                    runsConceded: true,
                    wickets: true,
                    economy: true,
                  },
                },
                ballEvents: {
                  orderBy: { timestamp: 'desc' },
                  take: 6,
                  select: {
                    runsScored: true,
                    extraType: true,
                    isWicket: true,
                    overNumber: true,
                    ballNumber: true,
                  },
                },
              },
            },
            footballMatchData: {
              select: {
                status: true,
                halfTimeScoreA: true,
                halfTimeScoreB: true,
                fullTimeScoreA: true,
                fullTimeScoreB: true,
                extraTimeScoreA: true,
                extraTimeScoreB: true,
                penaltyScoreA: true,
                penaltyScoreB: true,
                players: {
                  select: {
                    playerName: true,
                    team: true,
                    goals: true,
                    assists: true,
                    yellowCards: true,
                    redCards: true,
                  },
                  orderBy: [{ team: 'asc' }, { isStarting: 'desc' }],
                },
                events: {
                  select: {
                    eventType: true,
                    minute: true,
                    addedTime: true,
                    playerName: true,
                    assistPlayerName: true,
                    team: true,
                    description: true,
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                },
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    const sportType = tournament.sportType;
    const maxOvers = tournament.overs || 20;
    const playersPerSide = tournament.playersPerSide || 11;

    const liveMatches = [];

    for (const match of tournament.matches) {
      const isTBD = match.teamA === 'TBD' || match.teamB === 'TBD';
      if (isTBD) continue;

      // ── Football path ──
      if (sportType === 'FOOTBALL') {
        const fmd = match.footballMatchData;
        if (!fmd && !match.completed) continue;

        const footballStatus = fmd?.status || 'NOT_STARTED';
        // Map to a unified matchStatus for the UI
        const IN_PROGRESS_STATUSES = [
          'FIRST_HALF',
          'SECOND_HALF',
          'EXTRA_TIME_FIRST',
          'EXTRA_TIME_SECOND',
          'PENALTIES',
        ];
        let matchStatus = 'NOT_STARTED';
        if (match.completed || footballStatus === 'COMPLETED') {
          matchStatus = 'COMPLETED';
        } else if (IN_PROGRESS_STATUSES.includes(footballStatus)) {
          matchStatus = 'IN_PROGRESS';
        } else if (footballStatus === 'HALF_TIME') {
          matchStatus = 'HALF_TIME';
        }

        if (matchStatus === 'NOT_STARTED' && !fmd) continue;

        // Goal scorers
        const goalScorers = fmd
          ? fmd.events
              .filter(
                (e) =>
                  e.eventType === 'GOAL' ||
                  e.eventType === 'OWN_GOAL' ||
                  e.eventType === 'PENALTY_SCORED',
              )
              .map((e) => ({
                playerName: e.playerName,
                minute: e.minute,
                addedTime: e.addedTime,
                team: e.team,
                type: e.eventType,
              }))
          : [];

        // Cards summary
        const cardsSummary = {
          teamA: { yellow: 0, red: 0 },
          teamB: { yellow: 0, red: 0 },
        };
        if (fmd) {
          for (const p of fmd.players) {
            const tk = p.team === 'A' ? 'teamA' : 'teamB';
            cardsSummary[tk].yellow += p.yellowCards;
            cardsSummary[tk].red += p.redCards;
          }
        }

        // Last event minute
        const lastEvent = fmd?.events?.[0];
        const lastMinute = lastEvent
          ? lastEvent.minute + (lastEvent.addedTime || 0)
          : 0;

        // Result text
        let result = null;
        if (matchStatus === 'COMPLETED') {
          if (match.scoreA > match.scoreB) {
            result = `${match.teamA} won ${match.scoreA}–${match.scoreB}`;
          } else if (match.scoreB > match.scoreA) {
            result = `${match.teamB} won ${match.scoreB}–${match.scoreA}`;
          } else {
            result = `Draw ${match.scoreA}–${match.scoreB}`;
          }
          // Add penalties info
          if (fmd?.penaltyScoreA !== null && fmd?.penaltyScoreB !== null) {
            result += ` (Pens: ${fmd.penaltyScoreA}–${fmd.penaltyScoreB})`;
          }
        }

        liveMatches.push({
          matchId: match.id,
          round: match.round,
          teamA: match.teamA,
          teamB: match.teamB,
          playerA: match.playerA,
          playerB: match.playerB,
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          completed: match.completed,
          matchStatus,
          sportType: 'FOOTBALL',
          footballStatus,
          halfTimeScoreA: fmd?.halfTimeScoreA,
          halfTimeScoreB: fmd?.halfTimeScoreB,
          lastMinute,
          periodStartedAt: fmd?.periodStartedAt,
          halfDuration: fmd?.halfDuration || 45,
          goalScorers,
          cardsSummary,
          recentEvents: fmd?.events?.slice(0, 5) || [],
          result,
        });
        continue;
      }

      // ── Cricket path (unchanged) ──
      const hasInnings = match.cricketInnings.length > 0;
      if (!hasInnings && !match.completed) continue;

      const activeInnings = match.cricketInnings.find((i) => !i.isComplete);
      const completedInnings = match.cricketInnings.filter((i) => i.isComplete);

      let matchStatus = 'NOT_STARTED';
      if (match.completed) {
        matchStatus = 'COMPLETED';
      } else if (activeInnings) {
        matchStatus = 'IN_PROGRESS';
      } else if (completedInnings.length === 1) {
        matchStatus = 'INNINGS_BREAK';
      } else if (completedInnings.length >= 2) {
        matchStatus = 'COMPLETED';
      }

      if (matchStatus === 'NOT_STARTED' && !hasInnings) continue;

      const innings = match.cricketInnings.map((inn) => {
        const isActive = !inn.isComplete;
        const oversDecimal =
          Math.floor(inn.totalOvers) + ((inn.totalOvers % 1) * 10) / 6;
        const runRate = oversDecimal > 0 ? inn.totalRuns / oversDecimal : 0;

        let target = null;
        let requiredRate = null;
        if (inn.inningsNumber === 2) {
          const firstInn = match.cricketInnings.find(
            (i) => i.inningsNumber === 1,
          );
          if (firstInn) {
            target = firstInn.totalRuns + 1;
            const runsNeeded = target - inn.totalRuns;
            const totalBallsAvail = maxOvers * 6;
            const legalBallsBowled =
              Math.floor(inn.totalOvers) * 6 +
              Math.round((inn.totalOvers % 1) * 10);
            const ballsRemaining = totalBallsAvail - legalBallsBowled;
            const oversRemaining = ballsRemaining / 6;
            requiredRate =
              oversRemaining > 0 ? runsNeeded / oversRemaining : null;
          }
        }

        const summary = {
          inningsNumber: inn.inningsNumber,
          battingTeamName: inn.battingTeamName,
          totalRuns: inn.totalRuns,
          totalWickets: inn.totalWickets,
          totalOvers: inn.totalOvers,
          isComplete: inn.isComplete,
          runRate: Math.round(runRate * 100) / 100,
          target,
          requiredRate:
            requiredRate !== null ? Math.round(requiredRate * 100) / 100 : null,
        };

        if (isActive) {
          summary.batsmenOnCrease = inn.battingEntries.map((b) => ({
            name: b.playerName,
            runs: b.runs,
            balls: b.ballsFaced,
          }));
          summary.currentBowler = inn.bowlingEntries[0]
            ? {
                name: inn.bowlingEntries[0].playerName,
                overs: inn.bowlingEntries[0].oversBowled,
                wickets: inn.bowlingEntries[0].wickets,
              }
            : null;
          summary.lastSixBalls = inn.ballEvents.reverse().map((b) => ({
            runs: b.runsScored,
            extra: b.extraType,
            isWicket: b.isWicket,
          }));
        }

        return summary;
      });

      let result = null;
      if (matchStatus === 'COMPLETED' && match.cricketInnings.length === 2) {
        const inn1 = match.cricketInnings.find((i) => i.inningsNumber === 1);
        const inn2 = match.cricketInnings.find((i) => i.inningsNumber === 2);
        if (inn1 && inn2) {
          if (inn2.totalRuns > inn1.totalRuns) {
            const wicketsRemaining = playersPerSide - 1 - inn2.totalWickets;
            result = `${inn2.battingTeamName} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
          } else if (inn1.totalRuns > inn2.totalRuns) {
            result = `${inn1.battingTeamName} won by ${inn1.totalRuns - inn2.totalRuns} run${inn1.totalRuns - inn2.totalRuns !== 1 ? 's' : ''}`;
          } else {
            result = 'Match tied';
          }
        }
      }

      liveMatches.push({
        matchId: match.id,
        round: match.round,
        teamA: match.teamA,
        teamB: match.teamB,
        playerA: match.playerA,
        playerB: match.playerB,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        completed: match.completed,
        matchStatus,
        sportType: 'CRICKET',
        maxOvers,
        innings,
        result,
      });
    }

    return NextResponse.json({
      tournamentId: tournament.id,
      tournamentStatus: tournament.status,
      sportType,
      liveMatches,
    });
  } catch (err) {
    console.error('[tournaments/live] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
