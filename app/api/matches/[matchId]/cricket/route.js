import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/matches/[matchId]/cricket — full cricket scorecard
 *
 * Returns both innings with batting entries, bowling entries,
 * ball-by-ball events, and fall of wickets.
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
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            sportType: true,
            overs: true,
            playersPerSide: true,
            clubId: true,
            status: true,
          },
        },
        playerA: { select: { id: true, name: true, avatarUrl: true } },
        playerB: { select: { id: true, name: true, avatarUrl: true } },
        cricketInnings: {
          orderBy: { inningsNumber: 'asc' },
          include: {
            battingEntries: { orderBy: { battingOrder: 'asc' } },
            bowlingEntries: { orderBy: { bowlingOrder: 'asc' } },
            ballEvents: {
              orderBy: [
                { overNumber: 'asc' },
                { ballNumber: 'asc' },
                { timestamp: 'asc' },
              ],
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const matchSportType = match.isStandalone
      ? match.sportType
      : match.tournament?.sportType;
    if (matchSportType !== 'CRICKET') {
      return NextResponse.json(
        { error: 'This is not a cricket match' },
        { status: 400 },
      );
    }

    // Compute fall of wickets per innings
    const innings = match.cricketInnings.map((inn) => {
      // Build fall of wickets from ball events
      const fallOfWickets = [];
      let runningTotal = 0;
      let wicketCount = 0;

      for (const ball of inn.ballEvents) {
        runningTotal += ball.runsScored + ball.extraRuns;
        if (ball.isWicket && ball.dismissalType !== 'RETIRED') {
          wicketCount++;
          fallOfWickets.push({
            wicketNumber: wicketCount,
            runs: runningTotal,
            overs: `${ball.overNumber}.${ball.ballNumber}`,
            batsmanName: ball.batsmanName,
            dismissalType: ball.dismissalType,
          });
        }
      }

      // Build over-by-over summary
      const overSummaries = [];
      const maxOver =
        inn.ballEvents.length > 0
          ? Math.max(...inn.ballEvents.map((b) => b.overNumber))
          : 0;

      for (let o = 1; o <= maxOver; o++) {
        const overBalls = inn.ballEvents.filter((b) => b.overNumber === o);
        const overRuns = overBalls.reduce(
          (sum, b) => sum + b.runsScored + b.extraRuns,
          0,
        );
        const overWickets = overBalls.filter((b) => b.isWicket).length;

        overSummaries.push({
          over: o,
          runs: overRuns,
          wickets: overWickets,
          balls: overBalls.map((b) => ({
            runs: b.runsScored,
            extraType: b.extraType,
            extraRuns: b.extraRuns,
            isWicket: b.isWicket,
            commentary: b.commentary,
          })),
        });
      }

      return {
        id: inn.id,
        inningsNumber: inn.inningsNumber,
        battingTeamName: inn.battingTeamName,
        bowlingTeamName: inn.bowlingTeamName,
        totalRuns: inn.totalRuns,
        totalWickets: inn.totalWickets,
        totalOvers: inn.totalOvers,
        extras: inn.extras,
        isComplete: inn.isComplete,
        battingEntries: inn.battingEntries.map((b) => ({
          id: b.id,
          playerName: b.playerName,
          playerId: b.playerId,
          runs: b.runs,
          ballsFaced: b.ballsFaced,
          fours: b.fours,
          sixes: b.sixes,
          strikeRate: b.strikeRate,
          isOut: b.isOut,
          dismissalType: b.dismissalType,
          bowlerName: b.bowlerName,
          fielderName: b.fielderName,
          battingOrder: b.battingOrder,
        })),
        bowlingEntries: inn.bowlingEntries.map((b) => ({
          id: b.id,
          playerName: b.playerName,
          playerId: b.playerId,
          oversBowled: b.oversBowled,
          maidens: b.maidens,
          runsConceded: b.runsConceded,
          wickets: b.wickets,
          economy: b.economy,
          extras: b.extras,
          noBalls: b.noBalls,
          wides: b.wides,
          bowlingOrder: b.bowlingOrder,
        })),
        fallOfWickets,
        overSummaries,
        ballEvents: inn.ballEvents.map((b) => ({
          id: b.id,
          overNumber: b.overNumber,
          ballNumber: b.ballNumber,
          batsmanName: b.batsmanName,
          bowlerName: b.bowlerName,
          runsScored: b.runsScored,
          extraType: b.extraType,
          extraRuns: b.extraRuns,
          isWicket: b.isWicket,
          dismissalType: b.dismissalType,
          commentary: b.commentary,
          timestamp: b.timestamp,
        })),
      };
    });

    // Determine match result
    let result = null;
    if (match.completed && innings.length === 2) {
      const inn1 = innings.find((i) => i.inningsNumber === 1);
      const inn2 = innings.find((i) => i.inningsNumber === 2);
      if (inn1 && inn2) {
        if (inn2.totalRuns > inn1.totalRuns) {
          const playersPerSide = match.isStandalone
            ? (match.playersPerSide || 11)
            : (match.tournament?.playersPerSide || 11);
          const wicketsRemaining = playersPerSide - 1 - inn2.totalWickets;
          result = `${inn2.battingTeamName} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
        } else if (inn1.totalRuns > inn2.totalRuns) {
          result = `${inn1.battingTeamName} won by ${inn1.totalRuns - inn2.totalRuns} run${inn1.totalRuns - inn2.totalRuns !== 1 ? 's' : ''}`;
        } else {
          result = 'Match tied';
        }
      }
    }

    return NextResponse.json({
      match: {
        id: match.id,
        teamA: match.teamA,
        teamB: match.teamB,
        playerA: match.playerA,
        playerB: match.playerB,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        completed: match.completed,
        round: match.round,
      },
      tournament: match.tournament,
      innings,
      result,
    });
  } catch (err) {
    console.error('[cricket] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
