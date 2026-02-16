import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * PUT /api/matches/[matchId]/cricket/undo — undo the last ball delivery
 *
 * Rolls back: BallEvent deletion, batsman/bowler aggregates, innings totals.
 * If the last ball completed an innings, reopens it.
 */
export async function PUT(req, { params }) {
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
          include: {
            club: { select: { id: true, adminUserId: true } },
            matches: { orderBy: [{ round: 'asc' }, { createdAt: 'asc' }] },
          },
        },
        cricketInnings: {
          orderBy: { inningsNumber: 'desc' },
          include: {
            battingEntries: { orderBy: { battingOrder: 'asc' } },
            bowlingEntries: { orderBy: { bowlingOrder: 'asc' } },
            ballEvents: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.tournament.sportType !== 'CRICKET') {
      return NextResponse.json(
        { error: 'This is not a cricket match' },
        { status: 400 },
      );
    }

    // Permission check
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const membership = await prisma.clubMember.findUnique({
      where: {
        userId_clubId: {
          userId: dbUser.id,
          clubId: match.tournament.club.id,
        },
      },
      select: { role: true },
    });

    const callerRole =
      match.tournament.club.adminUserId === dbUser.id
        ? 'ADMIN'
        : membership?.role;

    if (!callerRole || !hasPermission(callerRole, 'enterScores')) {
      return NextResponse.json(
        { error: 'Only Admins and Hosts can undo deliveries' },
        { status: 403 },
      );
    }

    // Find the most recent innings with ball events
    const latestInnings = match.cricketInnings.find(
      (i) => i.ballEvents.length > 0,
    );

    if (!latestInnings) {
      return NextResponse.json(
        { error: 'No deliveries to undo' },
        { status: 400 },
      );
    }

    const lastBall = latestInnings.ballEvents[0]; // already sorted desc, take 1

    const isLegalDelivery =
      !lastBall.extraType ||
      (lastBall.extraType !== 'WIDE' && lastBall.extraType !== 'NO_BALL');

    await prisma.$transaction(async (tx) => {
      // 1. Roll back batsman stats
      const batsmanEntry = latestInnings.battingEntries.find(
        (b) => b.playerName === lastBall.batsmanName,
      );

      if (batsmanEntry) {
        const newRuns = Math.max(0, batsmanEntry.runs - lastBall.runsScored);
        const removeBall = lastBall.extraType !== 'WIDE' ? 1 : 0;
        const newBallsFaced = Math.max(0, batsmanEntry.ballsFaced - removeBall);
        const newFours = Math.max(
          0,
          batsmanEntry.fours - (lastBall.runsScored === 4 ? 1 : 0),
        );
        const newSixes = Math.max(
          0,
          batsmanEntry.sixes - (lastBall.runsScored === 6 ? 1 : 0),
        );
        const newSR = newBallsFaced > 0 ? (newRuns / newBallsFaced) * 100 : 0;

        const updateData = {
          runs: newRuns,
          ballsFaced: newBallsFaced,
          fours: newFours,
          sixes: newSixes,
          strikeRate: Math.round(newSR * 100) / 100,
        };

        // If this ball was a wicket, un-dismiss the batsman
        if (lastBall.isWicket && lastBall.dismissalType !== 'RETIRED') {
          updateData.isOut = false;
          updateData.dismissalType = null;
          updateData.bowlerName = null;
          updateData.bowlerId = null;
          updateData.fielderName = null;
        }

        await tx.battingEntry.update({
          where: { id: batsmanEntry.id },
          data: updateData,
        });
      }

      // 2. Roll back bowler stats
      const bowlerEntry = latestInnings.bowlingEntries.find(
        (b) => b.playerName === lastBall.bowlerName,
      );

      if (bowlerEntry) {
        const removeLegalBall = isLegalDelivery ? 1 : 0;
        const bowlerLegalBalls =
          Math.floor(bowlerEntry.oversBowled) * 6 +
          Math.round((bowlerEntry.oversBowled % 1) * 10) -
          removeLegalBall;

        const newOversBowled =
          bowlerLegalBalls <= 0
            ? 0
            : Math.floor(bowlerLegalBalls / 6) + (bowlerLegalBalls % 6) / 10;

        const totalRunsThisBall = lastBall.runsScored + lastBall.extraRuns;
        const bowlerRuns =
          lastBall.extraType === 'BYE' || lastBall.extraType === 'LEG_BYE'
            ? 0
            : totalRunsThisBall;

        const newRunsConceded = Math.max(
          0,
          bowlerEntry.runsConceded - bowlerRuns,
        );
        const wasWicketForBowler =
          lastBall.isWicket &&
          ['BOWLED', 'CAUGHT', 'LBW', 'HIT_WICKET', 'STUMPED'].includes(
            lastBall.dismissalType,
          );
        const newWickets = Math.max(
          0,
          bowlerEntry.wickets - (wasWicketForBowler ? 1 : 0),
        );

        const fullOvers = Math.floor(Math.max(0, bowlerLegalBalls) / 6);
        const partialBalls = Math.max(0, bowlerLegalBalls) % 6;
        const totalBowlerOvers = fullOvers + partialBalls / 6;
        const newEconomy =
          totalBowlerOvers > 0 ? newRunsConceded / totalBowlerOvers : 0;

        const newExtras = Math.max(
          0,
          bowlerEntry.extras - (lastBall.extraType ? lastBall.extraRuns : 0),
        );
        const newNoBalls = Math.max(
          0,
          bowlerEntry.noBalls - (lastBall.extraType === 'NO_BALL' ? 1 : 0),
        );
        const newWides = Math.max(
          0,
          bowlerEntry.wides - (lastBall.extraType === 'WIDE' ? 1 : 0),
        );

        await tx.bowlingEntry.update({
          where: { id: bowlerEntry.id },
          data: {
            oversBowled: Math.round(Math.max(0, newOversBowled) * 10) / 10,
            runsConceded: newRunsConceded,
            wickets: newWickets,
            economy: Math.round(newEconomy * 100) / 100,
            extras: newExtras,
            noBalls: newNoBalls,
            wides: newWides,
          },
        });
      }

      // 3. Roll back innings totals
      const totalRunsThisBall = lastBall.runsScored + lastBall.extraRuns;
      const newTotalRuns = Math.max(
        0,
        latestInnings.totalRuns - totalRunsThisBall,
      );
      const newTotalWickets = Math.max(
        0,
        latestInnings.totalWickets -
          (lastBall.isWicket && lastBall.dismissalType !== 'RETIRED' ? 1 : 0),
      );
      const newExtras = Math.max(
        0,
        latestInnings.extras - (lastBall.extraType ? lastBall.extraRuns : 0),
      );

      // Recalculate overs from remaining legal balls
      // We need to count all legal balls minus this one
      const allBallEvents = await tx.ballEvent.findMany({
        where: { inningsId: latestInnings.id },
        orderBy: { timestamp: 'asc' },
      });
      const remainingLegalBalls = allBallEvents.filter(
        (e) =>
          e.id !== lastBall.id &&
          (!e.extraType ||
            (e.extraType !== 'WIDE' && e.extraType !== 'NO_BALL')),
      ).length;

      const newTotalOvers =
        Math.floor(remainingLegalBalls / 6) + (remainingLegalBalls % 6) / 10;

      await tx.cricketInnings.update({
        where: { id: latestInnings.id },
        data: {
          totalRuns: newTotalRuns,
          totalWickets: newTotalWickets,
          totalOvers: Math.round(newTotalOvers * 10) / 10,
          extras: newExtras,
          isComplete: false, // Reopen innings if it was auto-completed
        },
      });

      // 4. If match was completed by this ball, uncomplete it
      if (match.completed) {
        await tx.match.update({
          where: { id: matchId },
          data: { scoreA: null, scoreB: null, completed: false },
        });

        // 4a. Reverse bracket advancement — reset the next round match slot
        const allMatches = match.tournament.matches;
        const totalRounds = Math.max(...allMatches.map((m) => m.round));
        const currentRound = match.round;

        if (currentRound < totalRounds) {
          const roundMatches = allMatches.filter(
            (m) => m.round === currentRound,
          );
          const matchIndex = roundMatches.findIndex((m) => m.id === matchId);
          const nextRoundMatchIndex = Math.floor(matchIndex / 2);
          const nextRoundMatches = allMatches.filter(
            (m) => m.round === currentRound + 1,
          );

          if (nextRoundMatches[nextRoundMatchIndex]) {
            const nextMatch = nextRoundMatches[nextRoundMatchIndex];
            const field = matchIndex % 2 === 0 ? 'teamA' : 'teamB';
            const playerField =
              matchIndex % 2 === 0 ? 'playerAId' : 'playerBId';

            // Only reset if the next match hasn't started (no ball events)
            const nextMatchFull = await tx.match.findUnique({
              where: { id: nextMatch.id },
              include: { cricketInnings: { include: { ballEvents: true } } },
            });
            const nextMatchHasBalls = nextMatchFull?.cricketInnings?.some(
              (i) => i.ballEvents.length > 0,
            );

            if (!nextMatchHasBalls) {
              await tx.match.update({
                where: { id: nextMatch.id },
                data: { [field]: 'TBD', [playerField]: null },
              });
            }
          }
        }

        // 4b. If tournament was marked COMPLETED by this match, revert to IN_PROGRESS
        if (currentRound === totalRounds) {
          await tx.tournament.update({
            where: { id: match.tournamentId },
            data: { status: 'IN_PROGRESS' },
          });
        }

        // 4c. Delete stat entries created for this match & reverse goal progress
        const playerIds = [match.playerAId, match.playerBId].filter(Boolean);
        if (playerIds.length > 0) {
          const sportProfiles = await tx.sportProfile.findMany({
            where: { userId: { in: playerIds }, sportType: 'CRICKET' },
          });

          for (const profile of sportProfiles) {
            const statEntry = await tx.statEntry.findFirst({
              where: { matchId, sportProfileId: profile.id },
            });

            if (statEntry) {
              // Reverse goal progress using the stat entry metrics
              const metrics = statEntry.metrics || {};
              const goals = await tx.goal.findMany({
                where: { sportProfileId: profile.id },
              });

              for (const goal of goals) {
                const metricValue = metrics[goal.metric];
                if (
                  metricValue !== undefined &&
                  typeof metricValue === 'number'
                ) {
                  const newCurrent = Math.max(0, goal.current - metricValue);
                  await tx.goal.update({
                    where: { id: goal.id },
                    data: {
                      current: newCurrent,
                      completed: newCurrent >= goal.target,
                    },
                  });
                }
              }

              // Delete the stat entry
              await tx.statEntry.delete({ where: { id: statEntry.id } });
            }
          }
        }
      }

      // 5. If this ball was a wicket that created a new batsman entry, remove it
      if (lastBall.isWicket && lastBall.dismissalType !== 'RETIRED') {
        // Find any batting entry with 0 runs, 0 balls faced, not out,
        // added AFTER the dismissed batsman (highest batting order)
        const lastBattingOrder = Math.max(
          ...latestInnings.battingEntries.map((b) => b.battingOrder),
        );
        const newBatsmanEntry = latestInnings.battingEntries.find(
          (b) =>
            b.battingOrder === lastBattingOrder &&
            b.runs === 0 &&
            b.ballsFaced === 0 &&
            !b.isOut,
        );

        // Only remove if they haven't been part of any ball events
        if (newBatsmanEntry) {
          const allBallEvents = await tx.ballEvent.findMany({
            where: { inningsId: latestInnings.id },
          });
          const hasFacedBall = allBallEvents.some(
            (e) =>
              e.id !== lastBall.id &&
              e.batsmanName === newBatsmanEntry.playerName,
          );

          if (!hasFacedBall) {
            await tx.battingEntry.delete({
              where: { id: newBatsmanEntry.id },
            });
          }
        }
      }

      // 6. Delete the ball event
      await tx.ballEvent.delete({ where: { id: lastBall.id } });
    });

    return NextResponse.json({ success: true, undone: lastBall.id });
  } catch (err) {
    console.error('[cricket/undo] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
