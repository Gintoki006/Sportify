import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

const VALID_SPORTS = [
  'FOOTBALL',
  'CRICKET',
  'BASKETBALL',
  'BADMINTON',
  'TENNIS',
  'VOLLEYBALL',
];

/* ─── helpers ─── */
async function resolveCallerRole(clerkUser, clubId) {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  });
  if (!dbUser) return { dbUser: null, role: null, club: null };

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true, adminUserId: true },
  });
  if (!club) return { dbUser, role: null, club: null };

  const membership = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: dbUser.id, clubId } },
    select: { role: true },
  });
  const role = club.adminUserId === dbUser.id ? 'ADMIN' : membership?.role;
  return { dbUser, role, club };
}

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

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        sportType: tournament.sportType,
        startDate: tournament.startDate.toISOString(),
        endDate: tournament.endDate?.toISOString() || null,
        status: tournament.status,
        overs: tournament.overs,
        playersPerSide: tournament.playersPerSide,
        club: tournament.club,
        isAdmin: tournament.club.adminUserId === dbUser.id,
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

/**
 * PUT /api/tournaments/[tournamentId] — edit tournament details
 * Body (all optional): { name, sportType, startDate, endDate, status }
 */
export async function PUT(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, clubId: true, status: true },
    });
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    const { role } = await resolveCallerRole(clerkUser, tournament.clubId);
    if (!role || !hasPermission(role, 'editTournament')) {
      return NextResponse.json(
        { error: 'Only Admins and Hosts can edit tournaments' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const data = {};

    // Name
    if (body.name !== undefined) {
      const trimmed = String(body.name).trim();
      if (!trimmed || trimmed.length > 100) {
        return NextResponse.json(
          { error: 'Name must be 1–100 characters' },
          { status: 400 },
        );
      }
      data.name = trimmed;
    }

    // Sport type
    if (body.sportType !== undefined) {
      if (!VALID_SPORTS.includes(body.sportType)) {
        return NextResponse.json(
          { error: 'Invalid sport type' },
          { status: 400 },
        );
      }
      data.sportType = body.sportType;
    }

    // Start date
    if (body.startDate !== undefined) {
      const d = new Date(body.startDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate' },
          { status: 400 },
        );
      }
      data.startDate = d;
    }

    // End date
    if (body.endDate !== undefined) {
      if (body.endDate === null) {
        data.endDate = null;
      } else {
        const d = new Date(body.endDate);
        if (isNaN(d.getTime())) {
          return NextResponse.json(
            { error: 'Invalid endDate' },
            { status: 400 },
          );
        }
        data.endDate = d;
      }
    }

    // Status
    if (body.status !== undefined) {
      const validStatuses = ['UPCOMING', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      data.status = body.status;
    }

    // Overs (cricket-only)
    if (body.overs !== undefined) {
      if (body.overs === null) {
        data.overs = null;
      } else {
        const o = Number(body.overs);
        if (!Number.isInteger(o) || o < 1 || o > 50) {
          return NextResponse.json(
            { error: 'Overs must be between 1 and 50' },
            { status: 400 },
          );
        }
        data.overs = o;
      }
    }

    // Players per side (cricket-only)
    if (body.playersPerSide !== undefined) {
      if (body.playersPerSide === null) {
        data.playersPerSide = null;
      } else {
        const p = Number(body.playersPerSide);
        if (!Number.isInteger(p) || p < 2 || p > 11) {
          return NextResponse.json(
            { error: 'Players per side must be between 2 and 11' },
            { status: 400 },
          );
        }
        data.playersPerSide = p;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data,
      include: {
        matches: { orderBy: [{ round: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    return NextResponse.json({ success: true, tournament: updated });
  } catch (err) {
    console.error('[tournaments/[id]] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tournaments/[tournamentId] — delete tournament & all matches
 */
export async function DELETE(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, clubId: true },
    });
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    const { role } = await resolveCallerRole(clerkUser, tournament.clubId);
    if (!role || !hasPermission(role, 'deleteTournament')) {
      return NextResponse.json(
        { error: 'Only Admins and Hosts can delete tournaments' },
        { status: 403 },
      );
    }

    // Cascade: Prisma schema has onDelete: Cascade on Match → Tournament
    // and TournamentPlayer → Tournament, so deleting the tournament removes everything.
    await prisma.tournament.delete({ where: { id: tournamentId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[tournaments/[id]] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
