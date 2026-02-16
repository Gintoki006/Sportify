import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * PUT /api/clubs/[clubId] — update club details (admin only)
 */
export async function PUT(req, { params }) {
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

    if (!callerRole || !hasPermission(callerRole, 'editClub')) {
      return NextResponse.json(
        { error: 'You do not have permission to edit club details' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Club name is required' },
        { status: 400 },
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Club name must be 100 characters or fewer' },
        { status: 400 },
      );
    }

    if (
      description &&
      typeof description === 'string' &&
      description.length > 500
    ) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or fewer' },
        { status: 400 },
      );
    }

    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return NextResponse.json({ club: updated });
  } catch (err) {
    console.error('[clubs/[clubId]] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/clubs/[clubId] — delete club (admin only)
 */
export async function DELETE(req, { params }) {
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

    if (!callerRole || !hasPermission(callerRole, 'deleteClub')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this club' },
        { status: 403 },
      );
    }

    // Cascading delete handled by Prisma schema (onDelete: Cascade on tournaments, members)
    await prisma.club.delete({ where: { id: clubId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[clubs/[clubId]] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/clubs/[clubId] — get club details
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

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        admin: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, email: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        tournaments: {
          orderBy: { startDate: 'desc' },
          include: { _count: { select: { matches: true } } },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check if current user is a member
    const currentMembership = club.members.find((m) => m.user.id === dbUser.id);
    const isMember = !!currentMembership;
    const isAdmin = club.adminUserId === dbUser.id;
    const currentUserRole = isAdmin ? 'ADMIN' : currentMembership?.role || null;

    return NextResponse.json({
      club: {
        id: club.id,
        name: club.name,
        description: club.description,
        createdAt: club.createdAt.toISOString(),
        admin: club.admin,
        isAdmin,
        isMember,
        currentUserRole,
        members: club.members.map((m) => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
        })),
        tournaments: club.tournaments.map((t) => ({
          id: t.id,
          name: t.name,
          sportType: t.sportType,
          startDate: t.startDate.toISOString(),
          endDate: t.endDate?.toISOString() || null,
          status: t.status,
          matchCount: t._count.matches,
        })),
      },
    });
  } catch (err) {
    console.error('[clubs/[clubId]] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
