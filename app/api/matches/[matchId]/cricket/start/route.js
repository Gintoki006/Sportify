import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * POST /api/matches/[matchId]/cricket/start — initialize a cricket innings
 *
 * Body: {
 *   battingTeam: 'A' | 'B',            // which side bats first
 *   battingLineup: [{ name, playerId? }],  // batting order
 *   bowler: { name, playerId? }            // opening bowler
 * }
 *
 * Creates CricketInnings, BattingEntry records, and the first BowlingEntry.
 * If 1st innings already exists but is complete, starts the 2nd innings.
 */
export async function POST(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    const body = await req.json();
    const { battingTeam, battingLineup, bowler, bowlingLineup } = body;

    if (!battingTeam || !['A', 'B'].includes(battingTeam)) {
      return NextResponse.json(
        { error: 'battingTeam must be "A" or "B"' },
        { status: 400 },
      );
    }

    if (
      !battingLineup ||
      !Array.isArray(battingLineup) ||
      battingLineup.length < 2
    ) {
      return NextResponse.json(
        { error: 'battingLineup must have at least 2 batsmen' },
        { status: 400 },
      );
    }

    if (!bowler || !bowler.name) {
      return NextResponse.json(
        { error: 'Opening bowler is required' },
        { status: 400 },
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            club: { select: { id: true, adminUserId: true } },
          },
        },
        cricketInnings: { orderBy: { inningsNumber: 'asc' } },
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

    if (match.completed) {
      return NextResponse.json(
        { error: 'Match is already completed' },
        { status: 400 },
      );
    }

    if (match.teamA === 'TBD' || match.teamB === 'TBD') {
      return NextResponse.json(
        { error: 'Cannot start scoring with undetermined teams' },
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

    if (match.isStandalone) {
      if (match.createdByUserId !== dbUser.id) {
        return NextResponse.json(
          { error: 'Only the match creator can score this match' },
          { status: 403 },
        );
      }
    } else {
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
          { error: 'Only Admins and Hosts can score matches' },
          { status: 403 },
        );
      }
    }

    // Determine innings number
    const existingInnings = match.cricketInnings;
    let inningsNumber;

    if (existingInnings.length === 0) {
      inningsNumber = 1;
    } else if (existingInnings.length === 1 && existingInnings[0].isComplete) {
      inningsNumber = 2;
    } else if (existingInnings.length === 1 && !existingInnings[0].isComplete) {
      return NextResponse.json(
        { error: '1st innings is still in progress' },
        { status: 400 },
      );
    } else if (existingInnings.length >= 2) {
      return NextResponse.json(
        { error: 'Both innings already exist' },
        { status: 400 },
      );
    }

    const battingTeamName = battingTeam === 'A' ? match.teamA : match.teamB;
    const bowlingTeamName = battingTeam === 'A' ? match.teamB : match.teamA;

    // Create innings + batting entries + first bowling entry in a transaction
    const innings = await prisma.$transaction(async (tx) => {
      const newInnings = await tx.cricketInnings.create({
        data: {
          matchId,
          inningsNumber,
          battingTeamName,
          bowlingTeamName,
          totalRuns: 0,
          totalWickets: 0,
          totalOvers: 0,
          extras: 0,
          isComplete: false,
        },
      });

      // Create batting entries for the lineup
      const battingData = battingLineup.map((b, idx) => ({
        inningsId: newInnings.id,
        playerName: b.name,
        playerId: b.playerId || null,
        battingOrder: idx + 1,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
      }));

      await tx.battingEntry.createMany({ data: battingData });

      // Create bowling entries — full lineup if provided, otherwise just the opening bowler
      if (
        bowlingLineup &&
        Array.isArray(bowlingLineup) &&
        bowlingLineup.length > 0
      ) {
        const bowlingData = bowlingLineup.map((b, idx) => ({
          inningsId: newInnings.id,
          playerName: b.name,
          playerId: b.playerId || null,
          bowlingOrder: idx + 1,
          oversBowled: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          economy: 0,
          extras: 0,
          noBalls: 0,
          wides: 0,
        }));
        await tx.bowlingEntry.createMany({ data: bowlingData });
      } else {
        // Legacy fallback: create just the opening bowler
        await tx.bowlingEntry.create({
          data: {
            inningsId: newInnings.id,
            playerName: bowler.name,
            playerId: bowler.playerId || null,
            bowlingOrder: 1,
            oversBowled: 0,
            maidens: 0,
            runsConceded: 0,
            wickets: 0,
            economy: 0,
            extras: 0,
            noBalls: 0,
            wides: 0,
          },
        });
      }

      // Update tournament status to IN_PROGRESS if UPCOMING
      if (match.tournament && match.tournament.status === 'UPCOMING') {
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return newInnings;
    });

    // Fetch the full innings with entries
    const fullInnings = await prisma.cricketInnings.findUnique({
      where: { id: innings.id },
      include: {
        battingEntries: { orderBy: { battingOrder: 'asc' } },
        bowlingEntries: { orderBy: { bowlingOrder: 'asc' } },
      },
    });

    return NextResponse.json(
      { success: true, innings: fullInnings },
      { status: 201 },
    );
  } catch (err) {
    console.error('[cricket/start] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
