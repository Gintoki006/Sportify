import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { isTeamSport } from '@/lib/sportMetrics';

const VALID_SPORTS = [
  'FOOTBALL',
  'CRICKET',
  'BASKETBALL',
  'BADMINTON',
  'TENNIS',
  'VOLLEYBALL',
];

/**
 * POST /api/matches — create a standalone match (no tournament/club required)
 *
 * Body: {
 *   sportType: string (required),
 *   teamA: string (required),
 *   teamB: string (required),
 *   date?: string (ISO),
 *   playerAId?: string (individual sports — link opponent),
 *   playerBId?: string (individual sports — link opponent),
 *   overs?: number (cricket only),
 *   playersPerSide?: number (cricket only),
 * }
 */
export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      sportType,
      teamA,
      teamB,
      date,
      playerAId,
      playerBId,
      overs,
      playersPerSide,
      halfDuration,
      squadSize,
    } = body;

    // Validate sport type
    if (!sportType || !VALID_SPORTS.includes(sportType)) {
      return NextResponse.json(
        { error: `sportType must be one of: ${VALID_SPORTS.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate team names
    const trimA = String(teamA || '').trim();
    const trimB = String(teamB || '').trim();
    if (!trimA || !trimB) {
      return NextResponse.json(
        { error: 'teamA and teamB are required' },
        { status: 400 },
      );
    }

    // Cricket-specific validation
    if (sportType === 'CRICKET') {
      if (overs !== undefined) {
        const o = Number(overs);
        if (!Number.isInteger(o) || o < 1 || o > 50) {
          return NextResponse.json(
            { error: 'overs must be an integer between 1 and 50' },
            { status: 400 },
          );
        }
      }
      if (playersPerSide !== undefined) {
        const p = Number(playersPerSide);
        if (!Number.isInteger(p) || p < 2 || p > 11) {
          return NextResponse.json(
            { error: 'playersPerSide must be an integer between 2 and 11' },
            { status: 400 },
          );
        }
      }
    }

    // Football-specific validation
    if (sportType === 'FOOTBALL') {
      if (halfDuration !== undefined) {
        const h = Number(halfDuration);
        if (!Number.isInteger(h) || h < 5 || h > 90) {
          return NextResponse.json(
            { error: 'halfDuration must be an integer between 5 and 90' },
            { status: 400 },
          );
        }
      }
      if (squadSize !== undefined) {
        const s = Number(squadSize);
        if (!Number.isInteger(s) || s < 3 || s > 11) {
          return NextResponse.json(
            { error: 'squadSize must be an integer between 3 and 11' },
            { status: 400 },
          );
        }
      }
    }

    // For individual sports, validate playerAId / playerBId if provided
    const isTeam = isTeamSport(sportType);
    const matchData = {
      teamA: trimA,
      teamB: trimB,
      sportType,
      isStandalone: true,
      createdByUserId: dbUser.id,
      date: date ? new Date(date) : null,
      overs: sportType === 'CRICKET' && overs ? Number(overs) : null,
      playersPerSide:
        sportType === 'CRICKET' && playersPerSide
          ? Number(playersPerSide)
          : null,
      halfDuration:
        sportType === 'FOOTBALL' && halfDuration ? Number(halfDuration) : null,
      squadSize:
        sportType === 'FOOTBALL' && squadSize ? Number(squadSize) : null,
    };

    // Individual sports can link players at creation
    if (!isTeam) {
      if (playerAId && playerBId && playerAId === playerBId) {
        return NextResponse.json(
          { error: 'playerAId and playerBId cannot be the same user' },
          { status: 400 },
        );
      }
      if (playerAId) {
        const userA = await prisma.user.findUnique({
          where: { id: playerAId },
          select: { id: true },
        });
        if (!userA) {
          return NextResponse.json(
            { error: 'playerAId does not match any user' },
            { status: 400 },
          );
        }
        matchData.playerAId = playerAId;
      }
      if (playerBId) {
        const userB = await prisma.user.findUnique({
          where: { id: playerBId },
          select: { id: true },
        });
        if (!userB) {
          return NextResponse.json(
            { error: 'playerBId does not match any user' },
            { status: 400 },
          );
        }
        matchData.playerBId = playerBId;
      }
    }

    const match = await prisma.match.create({
      data: matchData,
      include: {
        playerA: { select: { id: true, name: true, avatarUrl: true } },
        playerB: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ success: true, match }, { status: 201 });
  } catch (err) {
    console.error('[matches] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/matches — list standalone matches for the current user
 *
 * Returns matches the user created OR is linked to as playerA/playerB.
 * Query params:
 *   ?sport=CRICKET — filter by sport type
 *   ?status=completed|upcoming — filter by completion status
 *   ?limit=20 — max results (default 20, max 100)
 */
export async function GET(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport')?.toUpperCase();
    const status = searchParams.get('status')?.toLowerCase();
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const limit = Math.min(Math.max(limitParam, 1), 100);

    // Build where clause
    const where = {
      isStandalone: true,
      OR: [
        { createdByUserId: dbUser.id },
        { playerAId: dbUser.id },
        { playerBId: dbUser.id },
        {
          matchInvites: {
            some: { userId: dbUser.id, status: { not: 'DECLINED' } },
          },
        },
      ],
    };

    if (sport && VALID_SPORTS.includes(sport)) {
      where.sportType = sport;
    }

    if (status === 'completed') {
      where.completed = true;
    } else if (status === 'upcoming') {
      where.completed = false;
    }

    const matches = await prisma.match.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        playerA: { select: { id: true, name: true, avatarUrl: true } },
        playerB: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        statEntries: { select: { id: true }, take: 1 },
        matchInvites: {
          select: {
            id: true,
            userId: true,
            team: true,
            status: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    const formatted = matches.map((m) => ({
      id: m.id,
      sportType: m.sportType,
      teamA: m.teamA,
      teamB: m.teamB,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      date: m.date?.toISOString() || null,
      completed: m.completed,
      isStandalone: true,
      overs: m.overs,
      playersPerSide: m.playersPerSide,
      playerA: m.playerA,
      playerB: m.playerB,
      createdBy: m.createdBy,
      invites: m.matchInvites || [],
      statsSynced: m.statEntries.length > 0,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ matches: formatted });
  } catch (err) {
    console.error('[matches] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
