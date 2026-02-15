import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

const VALID_SPORTS = [
  'FOOTBALL',
  'CRICKET',
  'BASKETBALL',
  'BADMINTON',
  'TENNIS',
  'VOLLEYBALL',
];

/**
 * POST /api/tournaments — create a tournament (admin only)
 * Body: { clubId, name, sportType, startDate, endDate?, bracketSize }
 * bracketSize must be power of 2 (2, 4, 8, 16)
 */
export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clubId, name, sportType, startDate, endDate, bracketSize, teams } =
      body;

    if (!clubId || !name?.trim() || !sportType || !startDate || !bracketSize) {
      return NextResponse.json(
        {
          error:
            'clubId, name, sportType, startDate, and bracketSize are required',
        },
        { status: 400 },
      );
    }

    if (!VALID_SPORTS.includes(sportType)) {
      return NextResponse.json(
        { error: 'Invalid sport type' },
        { status: 400 },
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Tournament name must be 100 characters or less' },
        { status: 400 },
      );
    }

    // Validate dates
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'startDate must be a valid date' },
        { status: 400 },
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'endDate must be a valid date' },
          { status: 400 },
        );
      }
      if (end < start) {
        return NextResponse.json(
          { error: 'endDate must be after startDate' },
          { status: 400 },
        );
      }
    }

    // bracketSize must be power of 2
    const validSizes = [2, 4, 8, 16];
    if (!validSizes.includes(bracketSize)) {
      return NextResponse.json(
        { error: 'bracketSize must be 2, 4, 8, or 16' },
        { status: 400 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify admin
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { adminUserId: true },
    });

    if (!club || club.adminUserId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Only the club admin can create tournaments' },
        { status: 403 },
      );
    }

    // Validate team names if provided
    const teamNames =
      teams && Array.isArray(teams) && teams.length === bracketSize
        ? teams.map((t) => t.trim()).filter(Boolean)
        : Array.from({ length: bracketSize }, (_, i) => `Team ${i + 1}`);

    if (teamNames.length !== bracketSize) {
      return NextResponse.json(
        { error: `Exactly ${bracketSize} team names required` },
        { status: 400 },
      );
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        clubId,
        name: name.trim(),
        sportType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'UPCOMING',
      },
    });

    // Generate single-elimination bracket matches
    const totalRounds = Math.log2(bracketSize);
    const matches = [];

    // Round 1: seed teams
    for (let i = 0; i < bracketSize / 2; i++) {
      matches.push({
        tournamentId: tournament.id,
        round: 1,
        teamA: teamNames[i * 2],
        teamB: teamNames[i * 2 + 1],
        date: null,
        completed: false,
      });
    }

    // Subsequent rounds: TBD placeholders
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          tournamentId: tournament.id,
          round,
          teamA: 'TBD',
          teamB: 'TBD',
          date: null,
          completed: false,
        });
      }
    }

    await prisma.match.createMany({ data: matches });

    // Fetch the full tournament
    const fullTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        matches: { orderBy: [{ round: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    return NextResponse.json(
      { success: true, tournament: fullTournament },
      { status: 201 },
    );
  } catch (err) {
    console.error('[tournaments] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
