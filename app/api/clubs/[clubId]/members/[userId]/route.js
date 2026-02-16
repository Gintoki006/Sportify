import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission, ASSIGNABLE_ROLES } from '@/lib/clubPermissions';

/**
 * PUT /api/clubs/[clubId]/members/[userId] — change a member's role (admin only)
 * Body: { role: 'HOST' | 'PARTICIPANT' | 'SPECTATOR' }
 */
export async function PUT(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clubId, userId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admin can change roles
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

    if (!callerRole || !hasPermission(callerRole, 'manageRoles')) {
      return NextResponse.json(
        { error: 'You do not have permission to change member roles' },
        { status: 403 },
      );
    }

    // Cannot change admin's own role
    if (userId === club.adminUserId) {
      return NextResponse.json(
        { error: "Cannot change the admin's role" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { role } = body;

    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Must be one of: ${ASSIGNABLE_ROLES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Find membership
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this club' },
        { status: 404 },
      );
    }

    const updated = await prisma.clubMember.update({
      where: { id: membership.id },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
    });

    return NextResponse.json({
      member: {
        id: updated.id,
        userId: updated.user.id,
        name: updated.user.name,
        avatarUrl: updated.user.avatarUrl,
        email: updated.user.email,
        role: updated.role,
        joinedAt: updated.joinedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[clubs/[clubId]/members/[userId]] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/clubs/[clubId]/members/[userId] — admin removes a member
 */
export async function DELETE(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clubId, userId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions — only ADMIN can remove members
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
        { error: 'You do not have permission to remove members' },
        { status: 403 },
      );
    }

    // Prevent admin from removing themselves
    if (userId === dbUser.id) {
      return NextResponse.json(
        { error: 'Admin cannot remove themselves from the club' },
        { status: 400 },
      );
    }

    // Find membership
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this club' },
        { status: 404 },
      );
    }

    await prisma.clubMember.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[clubs/[clubId]/members/[userId]] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
