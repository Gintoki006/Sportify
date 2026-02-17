import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/matches/[matchId]/cricket/live — lightweight live score data
 *
 * Returns: current score, overs, batsmen on crease, current bowler,
 * last 6 balls, run rate, target (if 2nd innings), and match status.
 * Designed for fast polling (every 5 seconds).
 */
export async function GET(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        teamA: true,
        teamB: true,
        scoreA: true,
        scoreB: true,
        completed: true,
        round: true,
        isStandalone: true,
        sportType: true,
        overs: true,
        playersPerSide: true,
        tournament: {
          select: {
            overs: true,
            playersPerSide: true,
            name: true,
          },
        },
        cricketInnings: {
          orderBy: { inningsNumber: 'asc' },
          select: {
            id: true,
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
                extraRuns: true,
                isWicket: true,
                commentary: true,
                overNumber: true,
                ballNumber: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const activeInnings = match.cricketInnings.find((i) => !i.isComplete);
    const completedInnings = match.cricketInnings.filter((i) => i.isComplete);

    // Determine match status
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

    // Get current innings data
    const currentInnings =
      activeInnings || completedInnings[completedInnings.length - 1];

    let liveData = {
      matchId: match.id,
      teamA: match.teamA,
      teamB: match.teamB,
      matchStatus,
      completed: match.completed,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      maxOvers: match.tournament?.overs || match.overs || 20,
      innings: [],
    };

    // Build summary for each innings
    for (const inn of match.cricketInnings) {
      const isActive = !inn.isComplete;

      // Run rate
      const oversDecimal =
        Math.floor(inn.totalOvers) + ((inn.totalOvers % 1) * 10) / 6;
      const runRate = oversDecimal > 0 ? inn.totalRuns / oversDecimal : 0;

      // Target (for 2nd innings)
      let target = null;
      let requiredRate = null;
      if (inn.inningsNumber === 2) {
        const firstInn = match.cricketInnings.find(
          (i) => i.inningsNumber === 1,
        );
        if (firstInn) {
          target = firstInn.totalRuns + 1;
          const runsNeeded = target - inn.totalRuns;
          const maxOvers = match.tournament?.overs || match.overs || 20;
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

      const inningSummary = {
        inningsNumber: inn.inningsNumber,
        battingTeamName: inn.battingTeamName,
        bowlingTeamName: inn.bowlingTeamName,
        totalRuns: inn.totalRuns,
        totalWickets: inn.totalWickets,
        totalOvers: inn.totalOvers,
        extras: inn.extras,
        isComplete: inn.isComplete,
        runRate: Math.round(runRate * 100) / 100,
        target,
        requiredRate:
          requiredRate !== null ? Math.round(requiredRate * 100) / 100 : null,
      };

      if (isActive) {
        // Only include live detail for active innings
        inningSummary.batsmenOnCrease = inn.battingEntries
          .slice(0, 2)
          .map((b) => ({
            name: b.playerName,
            runs: b.runs,
            balls: b.ballsFaced,
            sr: b.strikeRate,
          }));

        inningSummary.currentBowler = inn.bowlingEntries[0]
          ? {
              name: inn.bowlingEntries[0].playerName,
              overs: inn.bowlingEntries[0].oversBowled,
              runs: inn.bowlingEntries[0].runsConceded,
              wickets: inn.bowlingEntries[0].wickets,
              economy: inn.bowlingEntries[0].economy,
            }
          : null;

        inningSummary.lastSixBalls = inn.ballEvents.reverse().map((b) => ({
          runs: b.runsScored,
          extra: b.extraType,
          extraRuns: b.extraRuns,
          isWicket: b.isWicket,
          commentary: b.commentary,
        }));
      }

      liveData.innings.push(inningSummary);
    }

    // Determine result text for completed matches
    if (matchStatus === 'COMPLETED' && match.cricketInnings.length === 2) {
      const inn1 = match.cricketInnings.find((i) => i.inningsNumber === 1);
      const inn2 = match.cricketInnings.find((i) => i.inningsNumber === 2);
      if (inn1 && inn2) {
        if (inn2.totalRuns > inn1.totalRuns) {
          const playersPerSide =
            match.tournament?.playersPerSide || match.playersPerSide || 11;
          const wicketsRemaining = playersPerSide - 1 - inn2.totalWickets;
          liveData.result = `${inn2.battingTeamName} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
        } else if (inn1.totalRuns > inn2.totalRuns) {
          liveData.result = `${inn1.battingTeamName} won by ${inn1.totalRuns - inn2.totalRuns} run${inn1.totalRuns - inn2.totalRuns !== 1 ? 's' : ''}`;
        } else {
          liveData.result = 'Match tied';
        }
      }
    }

    return NextResponse.json(liveData);
  } catch (err) {
    console.error('[cricket/live] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
