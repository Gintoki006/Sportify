import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { validateMetrics } from '@/lib/sportMetrics';

/**
 * POST /api/stats — create a new stat entry
 * Body: { sportProfileId, date?, opponent?, notes?, metrics: { ... } }
 */
export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sportProfileId, date, opponent, notes, metrics } = body;

    if (!sportProfileId) {
      return NextResponse.json(
        { error: 'sportProfileId is required' },
        { status: 400 },
      );
    }

    if (!metrics || typeof metrics !== 'object') {
      return NextResponse.json(
        { error: 'metrics object is required' },
        { status: 400 },
      );
    }

    // Verify the sport profile belongs to this user
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sportProfile = await prisma.sportProfile.findUnique({
      where: { id: sportProfileId },
      select: { id: true, userId: true, sportType: true },
    });

    if (!sportProfile || sportProfile.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Sport profile not found' },
        { status: 404 },
      );
    }

    // Validate metrics against sport definition
    const validation = validateMetrics(sportProfile.sportType, metrics);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid metrics', details: validation.errors },
        { status: 400 },
      );
    }

    // Create the stat entry and update goals atomically
    const statEntry = await prisma.$transaction(async (tx) => {
      const entry = await tx.statEntry.create({
        data: {
          sportProfileId,
          date: date ? new Date(date) : new Date(),
          opponent: opponent?.trim() || null,
          notes: notes?.trim() || null,
          metrics,
          source: 'MANUAL',
        },
      });

      // Auto-update any matching goals
      const goals = await tx.goal.findMany({
        where: {
          sportProfileId,
          completed: false,
        },
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

      return entry;
    });

    return NextResponse.json({ success: true, statEntry }, { status: 201 });
  } catch (err) {
    console.error('[stats] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/stats?sportProfileId=xxx — list stat entries for a sport profile
 */
export async function GET(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sportProfileId = searchParams.get('sportProfileId');

    if (!sportProfileId) {
      return NextResponse.json(
        { error: 'sportProfileId query param is required' },
        { status: 400 },
      );
    }

    // Verify ownership
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    const sportProfile = await prisma.sportProfile.findUnique({
      where: { id: sportProfileId },
      select: { userId: true },
    });

    if (!dbUser || !sportProfile || sportProfile.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Sport profile not found' },
        { status: 404 },
      );
    }

    const stats = await prisma.statEntry.findMany({
      where: { sportProfileId },
      orderBy: { date: 'desc' },
      take: 50,
    });

    return NextResponse.json({ stats });
  } catch (err) {
    console.error('[stats] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
