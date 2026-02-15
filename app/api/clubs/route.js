import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/clubs — create a new club
 * Body: { name, description? }
 */
export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Club name is required' },
        { status: 400 },
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Club name must be 100 characters or less' },
        { status: 400 },
      );
    }

    if (
      description &&
      typeof description === 'string' &&
      description.trim().length > 500
    ) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
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

    const club = await prisma.club.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        adminUserId: dbUser.id,
        members: {
          create: { userId: dbUser.id },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        admin: { select: { id: true, name: true } },
        _count: { select: { tournaments: true } },
      },
    });

    return NextResponse.json({ success: true, club }, { status: 201 });
  } catch (err) {
    console.error('[clubs] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/clubs — list clubs the current user is a member of
 */
export async function GET() {
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

    const memberships = await prisma.clubMember.findMany({
      where: { userId: dbUser.id },
      include: {
        club: {
          include: {
            admin: { select: { id: true, name: true } },
            _count: { select: { members: true, tournaments: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const clubs = memberships.map((m) => ({
      id: m.club.id,
      name: m.club.name,
      description: m.club.description,
      adminName: m.club.admin.name,
      isAdmin: m.club.admin.id === dbUser.id,
      memberCount: m.club._count.members,
      tournamentCount: m.club._count.tournaments,
      joinedAt: m.joinedAt.toISOString(),
    }));

    return NextResponse.json({ clubs });
  } catch (err) {
    console.error('[clubs] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
