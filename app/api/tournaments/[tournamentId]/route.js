import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/tournaments/[tournamentId] — get tournament with full bracket
 */
export async function GET(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        club: { select: { id: true, name: true, adminUserId: true } },
        matches: { orderBy: [{ round: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        sportType: tournament.sportType,
        startDate: tournament.startDate.toISOString(),
        endDate: tournament.endDate?.toISOString() || null,
        status: tournament.status,
        club: tournament.club,
        isAdmin: tournament.club.adminUserId === dbUser?.id,
        matches: tournament.matches.map((m) => ({
          id: m.id,
          round: m.round,
          teamA: m.teamA,
          teamB: m.teamB,
          scoreA: m.scoreA,
          scoreB: m.scoreB,
          date: m.date?.toISOString() || null,
          completed: m.completed,
        })),
      },
    });
  } catch (err) {
    console.error('[tournaments/[id]] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
