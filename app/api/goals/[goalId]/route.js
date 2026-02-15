import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { getMetricKeys } from '@/lib/sportMetrics';

/**
 * PUT /api/goals/[goalId] — update goal progress or details
 * Body: { current?, target?, deadline? }
 * Only the goal's owner can update it.
 */
export async function PUT(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await params;

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json(
        { error: 'goalId is required' },
        { status: 400 },
      );
    }

    // Get current user
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { sportProfiles: { select: { id: true } } },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch goal and verify ownership
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { sportProfile: { select: { userId: true, sportType: true } } },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.sportProfile.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { current, target, deadline } = body;

    const updateData = {};

    // Validate current
    if (current !== undefined) {
      if (typeof current !== 'number' || current < 0) {
        return NextResponse.json(
          { error: 'current must be a non-negative number' },
          { status: 400 },
        );
      }
      updateData.current = Math.round(current);
    }

    // Validate target
    if (target !== undefined) {
      if (typeof target !== 'number' || target <= 0) {
        return NextResponse.json(
          { error: 'target must be a positive number' },
          { status: 400 },
        );
      }
      updateData.target = Math.round(target);
    }

    // Validate deadline
    if (deadline !== undefined) {
      if (deadline === null) {
        updateData.deadline = null;
      } else {
        const d = new Date(deadline);
        if (isNaN(d.getTime())) {
          return NextResponse.json(
            { error: 'deadline must be a valid date or null' },
            { status: 400 },
          );
        }
        updateData.deadline = d;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid fields to update (accepts: current, target, deadline)',
        },
        { status: 400 },
      );
    }

    // Determine completed status
    const finalCurrent = updateData.current ?? goal.current;
    const finalTarget = updateData.target ?? goal.target;
    updateData.completed = finalCurrent >= finalTarget;

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      goal: {
        id: updated.id,
        metric: updated.metric,
        target: updated.target,
        current: updated.current,
        completed: updated.completed,
        deadline: updated.deadline?.toISOString() || null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[goals/[goalId]] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/goals/[goalId] — get a single goal by ID
 */
export async function GET(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { sportProfiles: { select: { id: true } } },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { sportProfile: { select: { sportType: true, userId: true } } },
    });

    if (!goal || goal.sportProfile.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({
      goal: {
        id: goal.id,
        metric: goal.metric,
        target: goal.target,
        current: goal.current,
        completed: goal.completed,
        deadline: goal.deadline?.toISOString() || null,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        sportType: goal.sportProfile.sportType,
      },
    });
  } catch (err) {
    console.error('[goals/[goalId]] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
