import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/tournaments/[tournamentId]/live — batch live scores
 *
 * Returns lightweight live data for ALL matches in the tournament that
 * are either in-progress (have an active innings) or recently completed.
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

    const maxOvers = tournament.overs || 20;
    const playersPerSide = tournament.playersPerSide || 11;

    // Build live data for each match that has cricket innings
    const liveMatches = [];

    for (const match of tournament.matches) {
      const isTBD = match.teamA === 'TBD' || match.teamB === 'TBD';
      if (isTBD) continue;

      const hasInnings = match.cricketInnings.length > 0;
      if (!hasInnings && !match.completed) continue; // not started & not scoreable

      const activeInnings = match.cricketInnings.find((i) => !i.isComplete);
      const completedInnings = match.cricketInnings.filter((i) => i.isComplete);

      // Determine status
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

      // Skip matches with no innings data at all
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

      // Result text for completed matches
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
        maxOvers,
        innings,
        result,
      });
    }

    return NextResponse.json({
      tournamentId: tournament.id,
      tournamentStatus: tournament.status,
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
