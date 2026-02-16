import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * PUT /api/matches/[matchId]/score — submit match score (admin only)
 * Body: { scoreA, scoreB }
 *
 * This also:
 * - Advances the winner to the next round
 * - Auto-syncs stats to players who have matching sport profiles
 * - Checks for deduplication (no existing tournament entry for this match)
 * - Marks tournament COMPLETED if final match is done
 */
export async function PUT(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    const body = await req.json();
    const { scoreA, scoreB } = body;

    if (scoreA === undefined || scoreB === undefined) {
      return NextResponse.json(
        { error: 'scoreA and scoreB are required' },
        { status: 400 },
      );
    }

    if (
      typeof scoreA !== 'number' ||
      typeof scoreB !== 'number' ||
      scoreA < 0 ||
      scoreB < 0 ||
      !Number.isInteger(scoreA) ||
      !Number.isInteger(scoreB)
    ) {
      return NextResponse.json(
        { error: 'Scores must be non-negative integers' },
        { status: 400 },
      );
    }

    if (scoreA === scoreB) {
      return NextResponse.json(
        { error: 'Scores cannot be tied in single-elimination' },
        { status: 400 },
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            club: { select: { id: true, adminUserId: true } },
            matches: { orderBy: [{ round: 'asc' }, { createdAt: 'asc' }] },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.teamA === 'TBD' || match.teamB === 'TBD') {
      return NextResponse.json(
        { error: 'Cannot score a match with undetermined teams' },
        { status: 400 },
      );
    }

    // Verify admin
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    // Verify role: ADMIN or HOST can enter scores
    const callerMembership = await prisma.clubMember.findUnique({
      where: {
        userId_clubId: {
          userId: dbUser?.id,
          clubId: match.tournament.club.id,
        },
      },
      select: { role: true },
    });

    const callerRole =
      match.tournament.club.adminUserId === dbUser?.id
        ? 'ADMIN'
        : callerMembership?.role;

    if (!callerRole || !hasPermission(callerRole, 'enterScores')) {
      return NextResponse.json(
        { error: 'Only Admins and Hosts can submit scores' },
        { status: 403 },
      );
    }

    const winner = scoreA > scoreB ? match.teamA : match.teamB;

    // Atomically update match score first
    const result = await prisma.match.updateMany({
      where: { id: matchId, completed: false },
      data: { scoreA, scoreB, completed: true },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Match already completed' },
        { status: 400 },
      );
    }

    // Advance winner and update tournament in a transaction
    let advancedNextMatch = null;
    let newTournamentStatus = null;

    await prisma.$transaction(async (tx) => {
      // Advance winner to next round
      const allMatches = match.tournament.matches;
      const totalRounds = Math.max(...allMatches.map((m) => m.round));
      const currentRound = match.round;

      if (currentRound < totalRounds) {
        const roundMatches = allMatches.filter((m) => m.round === currentRound);
        const matchIndex = roundMatches.findIndex((m) => m.id === matchId);
        const nextRoundMatchIndex = Math.floor(matchIndex / 2);
        const nextRoundMatches = allMatches.filter(
          (m) => m.round === currentRound + 1,
        );

        if (nextRoundMatches[nextRoundMatchIndex]) {
          const nextMatch = nextRoundMatches[nextRoundMatchIndex];
          const field = matchIndex % 2 === 0 ? 'teamA' : 'teamB';
          const updated = await tx.match.update({
            where: { id: nextMatch.id },
            data: { [field]: winner },
          });
          advancedNextMatch = {
            id: updated.id,
            teamA: updated.teamA,
            teamB: updated.teamB,
          };
        }
      }

      // Check if tournament is complete (final match done)
      if (currentRound === totalRounds) {
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: { status: 'COMPLETED' },
        });
        newTournamentStatus = 'COMPLETED';
      } else if (match.tournament.status === 'UPCOMING') {
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: { status: 'IN_PROGRESS' },
        });
        newTournamentStatus = 'IN_PROGRESS';
      }

      // Auto-sync stats to players
      const clubMembers = await tx.clubMember.findMany({
        where: { clubId: match.tournament.clubId },
        include: {
          user: {
            include: {
              sportProfiles: {
                where: { sportType: match.tournament.sportType },
                select: { id: true },
              },
            },
          },
        },
      });

      const teamNames = [match.teamA, match.teamB];
      const teamScores = [scoreA, scoreB];

      const existingEntries = await tx.statEntry.findMany({
        where: { matchId },
        select: { sportProfileId: true },
      });
      const alreadySynced = new Set(
        existingEntries.map((e) => e.sportProfileId),
      );

      for (let i = 0; i < teamNames.length; i++) {
        const teamName = teamNames[i];
        const score = teamScores[i];

        const member = clubMembers.find(
          (m) => m.user.name.toLowerCase() === teamName.toLowerCase(),
        );

        if (member && member.user.sportProfiles.length > 0) {
          const sportProfileId = member.user.sportProfiles[0].id;
          if (alreadySynced.has(sportProfileId)) continue;

          const metrics = buildTournamentMetrics(
            match.tournament.sportType,
            score,
            teamScores[1 - i],
            score > teamScores[1 - i],
          );

          await tx.statEntry.create({
            data: {
              sportProfileId,
              date: match.date || new Date(),
              opponent: teamNames[1 - i],
              notes: `${match.tournament.name} — Round ${match.round}`,
              metrics,
              source: 'TOURNAMENT',
              matchId,
            },
          });

          const goals = await tx.goal.findMany({
            where: { sportProfileId, completed: false },
          });

          for (const goal of goals) {
            const metricValue = metrics[goal.metric];
            if (metricValue !== undefined && typeof metricValue === 'number') {
              const newCurrent = goal.current + metricValue;
              await tx.goal.update({
                where: { id: goal.id },
                data: {
                  current: newCurrent,
                  completed: newCurrent >= goal.target,
                },
              });
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      winner,
      scoreA,
      scoreB,
      nextMatch: advancedNextMatch,
      tournamentStatus: newTournamentStatus,
    });
  } catch (err) {
    console.error('[matches/score] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Build tournament-specific metrics based on sport type and match score
 */
function buildTournamentMetrics(sportType, ownScore, opponentScore, isWinner) {
  switch (sportType) {
    case 'FOOTBALL':
      return {
        goals: ownScore,
        assists: 0,
        shots_on_target: 0,
        shots_taken: 0,
      };
    case 'CRICKET':
      return { runs: ownScore, wickets: 0, batting_average: 0 };
    case 'BASKETBALL':
      return {
        points_scored: ownScore,
        shots_taken: 0,
        shots_on_target: 0,
        scoring_efficiency: 0,
      };
    case 'BADMINTON':
      return { match_wins: isWinner ? 1 : 0, points_scored: ownScore };
    case 'TENNIS':
      return { match_wins: isWinner ? 1 : 0, points_scored: ownScore };
    case 'VOLLEYBALL':
      return { spikes: 0, blocks: 0, serves: 0, digs: 0 };
    default:
      return {};
  }
}
