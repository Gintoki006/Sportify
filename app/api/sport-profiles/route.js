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
 * POST /api/sport-profiles — add a sport to the current user
 * Body: { sportType: string }
 */
export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sportType } = body;

    if (!sportType || typeof sportType !== 'string') {
      return NextResponse.json(
        { error: 'sportType is required' },
        { status: 400 },
      );
    }

    if (!VALID_SPORTS.includes(sportType)) {
      return NextResponse.json(
        {
          error: `Invalid sportType. Must be one of: ${VALID_SPORTS.join(', ')}`,
        },
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

    // Check for existing profile (unique constraint: userId + sportType)
    const existing = await prisma.sportProfile.findUnique({
      where: {
        userId_sportType: {
          userId: dbUser.id,
          sportType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Sport profile already exists for this sport' },
        { status: 409 },
      );
    }

    const sportProfile = await prisma.sportProfile.create({
      data: {
        userId: dbUser.id,
        sportType,
      },
    });

    return NextResponse.json({ success: true, sportProfile }, { status: 201 });
  } catch (err) {
    console.error('[sport-profiles] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/sport-profiles?userId=xxx — list sport profiles for a user
 * If no userId, returns current user's sport profiles.
 */
export async function GET(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let targetUserId = searchParams.get('userId');

    // Default to current user
    if (!targetUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
        select: { id: true },
      });
      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      targetUserId = dbUser.id;
    }

    const sportProfiles = await prisma.sportProfile.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { stats: true, goals: true } },
      },
    });

    return NextResponse.json({
      sportProfiles: sportProfiles.map((sp) => ({
        id: sp.id,
        sportType: sp.sportType,
        createdAt: sp.createdAt.toISOString(),
        statCount: sp._count.stats,
        goalCount: sp._count.goals,
      })),
    });
  } catch (err) {
    console.error('[sport-profiles] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
