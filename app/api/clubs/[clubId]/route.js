import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

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
    const isMember = club.members.some((m) => m.user.id === dbUser.id);
    const isAdmin = club.adminUserId === dbUser.id;

    return NextResponse.json({
      club: {
        id: club.id,
        name: club.name,
        description: club.description,
        createdAt: club.createdAt.toISOString(),
        admin: club.admin,
        isAdmin,
        isMember,
        members: club.members.map((m) => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
          email: m.user.email,
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
