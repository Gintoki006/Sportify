import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * POST /api/matches/[matchId]/reset — reset a completed match score
 *
 * This will:
 * 1. Clear scoreA, scoreB and mark completed = false
 * 2. Cascade-clear any downstream matches that depend on this winner
 * 3. Delete any auto-synced stat entries for this match
 * 4. Revert tournament status from COMPLETED back to IN_PROGRESS if needed
 */
export async function POST(req, { params }) {
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
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (!match.completed) {
      return NextResponse.json(
        { error: 'Match has not been scored yet' },
        { status: 400 },
      );
    }

    // Auth check
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
    const role =
      match.tournament.club.adminUserId === dbUser.id
        ? 'ADMIN'
        : membership?.role;

    if (!role || !hasPermission(role, 'editTournament')) {
      return NextResponse.json(
        { error: 'Only Admins and Hosts can reset scores' },
        { status: 403 },
      );
    }

    const allMatches = match.tournament.matches;
    const totalRounds = Math.max(...allMatches.map((m) => m.round));

    // Determine the winner name from this match
    const winnerIsA = match.scoreA > match.scoreB;
    const winnerName = winnerIsA ? match.teamA : match.teamB;

    // Find which downstream match slot this winner was placed into.
    // In a single-elimination bracket: round 1 match index i feeds into
    // round 2 match index floor(i/2), alternating teamA/teamB.
    // We need to cascade-clear forward from this match's round.
    const matchesInRound = (round) =>
      allMatches
        .filter((m) => m.round === round)
        .sort((a, b) => a.createdAt - b.createdAt);

    const resetIds = [match.id];
    const clearDownstreamUpdates = [];

    // Walk forward through rounds and clear any slots that were populated
    // by the winner of this match (or winners of downstream matches that
    // also need clearing).
    let currentRound = match.round;
    let namesToClear = new Set([winnerName]);

    while (currentRound < totalRounds) {
      const nextRoundMatches = matchesInRound(currentRound + 1);

      for (const nm of nextRoundMatches) {
        let teamACleared = false;
        let teamBCleared = false;

        if (namesToClear.has(nm.teamA)) {
          teamACleared = true;
        }
        if (namesToClear.has(nm.teamB)) {
          teamBCleared = true;
        }

        if (teamACleared || teamBCleared) {
          const updateData = {};
          if (teamACleared) {
            updateData.teamA = 'TBD';
            updateData.playerAId = null;
          }
          if (teamBCleared) {
            updateData.teamB = 'TBD';
            updateData.playerBId = null;
          }

          // If this downstream match was also completed, we need to reset it
          // and propagate its winner to clear further downstream
          if (nm.completed) {
            const nmWinnerIsA = nm.scoreA > nm.scoreB;
            const nmWinner = nmWinnerIsA ? nm.teamA : nm.teamB;
            namesToClear.add(nmWinner);
            resetIds.push(nm.id);
            updateData.scoreA = null;
            updateData.scoreB = null;
            updateData.completed = false;
          }

          clearDownstreamUpdates.push({ id: nm.id, data: updateData });
        }
      }

      currentRound++;
    }

    // Execute all updates in a transaction
    await prisma.$transaction(async (tx) => {
      // Reset the original match
      await tx.match.update({
        where: { id: match.id },
        data: { scoreA: null, scoreB: null, completed: false },
      });

      // Clear downstream matches
      for (const upd of clearDownstreamUpdates) {
        await tx.match.update({
          where: { id: upd.id },
          data: upd.data,
        });
      }

      // Delete stat entries for all reset matches
      if (resetIds.length > 0) {
        await tx.statEntry.deleteMany({
          where: { matchId: { in: resetIds } },
        });
      }

      // If tournament was COMPLETED, revert to IN_PROGRESS
      if (match.tournament.status === 'COMPLETED') {
        await tx.tournament.update({
          where: { id: match.tournament.id },
          data: { status: 'IN_PROGRESS' },
        });
      }
    });

    // Return updated matches
    const updatedMatches = await prisma.match.findMany({
      where: { tournamentId: match.tournament.id },
      orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
      include: {
        playerA: { select: { id: true, name: true, avatarUrl: true } },
        playerB: { select: { id: true, name: true, avatarUrl: true } },
        statEntries: { select: { id: true }, take: 1 },
      },
    });

    const tournament = await prisma.tournament.findUnique({
      where: { id: match.tournament.id },
      select: { status: true },
    });

    return NextResponse.json({
      success: true,
      resetMatchIds: resetIds,
      tournamentStatus: tournament.status,
      matches: updatedMatches.map((m) => ({
        id: m.id,
        round: m.round,
        teamA: m.teamA,
        teamB: m.teamB,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        date: m.date?.toISOString() || null,
        completed: m.completed,
        playerA: m.playerA || null,
        playerB: m.playerB || null,
        statsSynced: m.statEntries?.length > 0,
      })),
    });
  } catch (err) {
    console.error('[matches/[id]/reset] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
