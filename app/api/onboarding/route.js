import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/onboarding
 * Body: { sports: string[], profile: { name, bio }, goal?: { sportType, metric, target, deadline } }
 */
export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create DB user
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!dbUser) {
      const email =
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        `${clerkUser.id}@unknown`;
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          name:
            [clerkUser.firstName, clerkUser.lastName]
              .filter(Boolean)
              .join(' ') || 'User',
          avatarUrl: clerkUser.imageUrl || null,
        },
      });
    }

    const { sports, profile, goal } = await req.json();

    // ── Validate ──
    if (!sports || !Array.isArray(sports) || sports.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one sport' },
        { status: 400 },
      );
    }

    const validSports = [
      'FOOTBALL',
      'CRICKET',
      'BASKETBALL',
      'BADMINTON',
      'TENNIS',
      'VOLLEYBALL',
    ];
    for (const s of sports) {
      if (!validSports.includes(s)) {
        return NextResponse.json(
          { error: `Invalid sport: ${s}` },
          { status: 400 },
        );
      }
    }

    // ── Update user profile ──
    const updateData = {};
    if (profile?.name?.trim()) updateData.name = profile.name.trim();
    if (profile?.bio?.trim()) updateData.bio = profile.bio.trim();

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: updateData,
      });
    }

    // ── Create sport profiles (skip duplicates) ──
    const existing = await prisma.sportProfile.findMany({
      where: { userId: dbUser.id },
      select: { sportType: true },
    });
    const existingSet = new Set(existing.map((e) => e.sportType));

    const newSports = sports.filter((s) => !existingSet.has(s));
    if (newSports.length > 0) {
      await prisma.sportProfile.createMany({
        data: newSports.map((sportType) => ({
          userId: dbUser.id,
          sportType,
        })),
      });
    }

    // ── Create initial goal (if provided) ──
    if (goal?.sportType && goal?.metric && goal?.target) {
      const parsedTarget = Number(goal.target);
      if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
        return NextResponse.json(
          { error: 'Goal target must be a positive number' },
          { status: 400 },
        );
      }

      const sportProfile = await prisma.sportProfile.findUnique({
        where: {
          userId_sportType: {
            userId: dbUser.id,
            sportType: goal.sportType,
          },
        },
      });

      if (sportProfile) {
        await prisma.goal.create({
          data: {
            sportProfileId: sportProfile.id,
            metric: goal.metric,
            target: Math.round(parsedTarget),
            deadline: goal.deadline ? new Date(goal.deadline) : null,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[onboarding] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
