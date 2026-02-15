import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { getMetricKeys } from '@/lib/sportMetrics';

/**
 * POST /api/goals — create a new goal
 * Body: { sportProfileId, metric, target, deadline? }
 */
export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sportProfileId, metric, target, deadline } = body;

    if (!sportProfileId || !metric || !target) {
      return NextResponse.json(
        { error: 'sportProfileId, metric, and target are required' },
        { status: 400 },
      );
    }

    if (typeof target !== 'number' || target <= 0) {
      return NextResponse.json(
        { error: 'target must be a positive number' },
        { status: 400 },
      );
    }

    // Verify ownership
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

    // Validate metric exists for this sport
    const validKeys = getMetricKeys(sportProfile.sportType);
    if (!validKeys.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric "${metric}" for ${sportProfile.sportType}` },
        { status: 400 },
      );
    }

    // Calculate current progress from existing stat entries
    const entries = await prisma.statEntry.findMany({
      where: { sportProfileId },
      select: { metrics: true },
    });

    let currentTotal = 0;
    for (const entry of entries) {
      const val = entry.metrics?.[metric];
      if (typeof val === 'number') {
        currentTotal += val;
      }
    }

    const goal = await prisma.goal.create({
      data: {
        sportProfileId,
        metric,
        target: Math.round(target),
        current: currentTotal,
        completed: currentTotal >= target,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return NextResponse.json({ success: true, goal }, { status: 201 });
  } catch (err) {
    console.error('[goals] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/goals?filter=active|completed|all (default: all)
 * Returns all goals for the current user across all sport profiles.
 */
export async function GET(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { sportProfiles: { select: { id: true } } },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const spIds = dbUser.sportProfiles.map((sp) => sp.id);

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    let where = { sportProfileId: { in: spIds } };
    if (filter === 'active') where.completed = false;
    else if (filter === 'completed') where.completed = true;

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sportProfile: { select: { sportType: true } },
      },
    });

    const enriched = goals.map((g) => ({
      id: g.id,
      metric: g.metric,
      target: g.target,
      current: g.current,
      completed: g.completed,
      deadline: g.deadline?.toISOString() || null,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      sportType: g.sportProfile.sportType,
    }));

    return NextResponse.json({ goals: enriched });
  } catch (err) {
    console.error('[goals] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/goals — delete a goal
 * Body: { goalId }
 */
export async function DELETE(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { goalId } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { sportProfiles: { select: { id: true } } },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const spIds = dbUser.sportProfiles.map((sp) => sp.id);

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal || !spIds.includes(goal.sportProfileId)) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    await prisma.goal.delete({ where: { id: goalId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[goals] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
