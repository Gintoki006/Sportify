import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/profile — get current user's full profile
 */
export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: {
        sportProfiles: {
          include: {
            stats: { orderBy: { date: 'desc' } },
            goals: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (err) {
    console.error('[profile] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/profile — update name, bio, or sport preferences
 * Body: { name?, bio?, addSports?: string[], removeSportProfileIds?: string[] }
 */
export async function PUT(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, addSports, removeSportProfileIds } = body;

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { sportProfiles: { select: { id: true, sportType: true } } },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio.trim() || null;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: updateData,
      });
    }

    // Add new sports
    const validSports = [
      'FOOTBALL',
      'CRICKET',
      'BASKETBALL',
      'BADMINTON',
      'TENNIS',
      'VOLLEYBALL',
    ];
    if (addSports && Array.isArray(addSports)) {
      const existingTypes = dbUser.sportProfiles.map((sp) => sp.sportType);
      const newSports = addSports.filter(
        (s) => validSports.includes(s) && !existingTypes.includes(s),
      );
      if (newSports.length > 0) {
        await prisma.sportProfile.createMany({
          data: newSports.map((sportType) => ({
            userId: dbUser.id,
            sportType,
          })),
        });
      }
    }

    // Remove sport profiles (only if user owns them)
    if (removeSportProfileIds && Array.isArray(removeSportProfileIds)) {
      const ownedIds = dbUser.sportProfiles.map((sp) => sp.id);
      const toRemove = removeSportProfileIds.filter((id) =>
        ownedIds.includes(id),
      );
      if (toRemove.length > 0) {
        await prisma.sportProfile.deleteMany({
          where: { id: { in: toRemove } },
        });
      }
    }

    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: dbUser.id },
      include: { sportProfiles: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('[profile] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
