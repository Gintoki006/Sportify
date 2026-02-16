import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission, ROLE_HIERARCHY } from '@/lib/clubPermissions';

/**
 * POST /api/clubs/[clubId]/role-requests — request a role upgrade
 * Body: { requestedRole: 'PARTICIPANT' | 'HOST' }
 */
export async function POST(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clubId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Must be a member
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: dbUser.id, clubId } },
      select: { role: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this club' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { requestedRole } = body;

    // Validate requested role is higher than current
    const validUpgrades = ['HOST', 'PARTICIPANT'];
    if (!requestedRole || !validUpgrades.includes(requestedRole)) {
      return NextResponse.json(
        { error: 'Invalid role. You can request: HOST or PARTICIPANT' },
        { status: 400 },
      );
    }

    const currentRank = ROLE_HIERARCHY.indexOf(membership.role);
    const requestedRank = ROLE_HIERARCHY.indexOf(requestedRole);

    if (requestedRank >= currentRank) {
      return NextResponse.json(
        { error: 'You can only request a role higher than your current role' },
        { status: 400 },
      );
    }

    // Check for existing pending request
    const existingPending = await prisma.roleUpgradeRequest.findFirst({
      where: {
        userId: dbUser.id,
        clubId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: 'You already have a pending role upgrade request' },
        { status: 400 },
      );
    }

    const request = await prisma.roleUpgradeRequest.create({
      data: {
        userId: dbUser.id,
        clubId,
        requestedRole,
      },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    console.error('[role-requests] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/clubs/[clubId]/role-requests — list pending requests (admin only)
 */
export async function GET(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clubId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permission — admin or host can view requests
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const callerMembership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: dbUser.id, clubId } },
      select: { role: true },
    });

    const callerRole =
      club.adminUserId === dbUser.id ? 'ADMIN' : callerMembership?.role;

    if (!callerRole || !hasPermission(callerRole, 'manageMembers')) {
      return NextResponse.json(
        { error: 'You do not have permission to view role requests' },
        { status: 403 },
      );
    }

    const requests = await prisma.roleUpgradeRequest.findMany({
      where: { clubId, status: 'PENDING' },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (err) {
    console.error('[role-requests] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
