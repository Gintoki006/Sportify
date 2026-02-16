import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * PUT /api/matches/[matchId] — edit a match (swap teams, change players)
 * Body: { teamA?, teamB?, playerAId?, playerBId? }
 * Only allowed on matches that haven't been completed yet.
 */
export async function PUT(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            club: { select: { id: true, adminUserId: true } },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.completed) {
      return NextResponse.json(
        { error: 'Cannot edit a completed match. Reset its score first.' },
        { status: 400 },
      );
    }

    // Auth check
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const membership = await prisma.clubMember.findUnique({
      where: {
        userId_clubId: {
          userId: dbUser.id,
          clubId: match.tournament.club.id,
        },
      },
      select: { role: true },
    });
    const role =
      match.tournament.club.adminUserId === dbUser.id
        ? 'ADMIN'
        : membership?.role;

    if (!role || !hasPermission(role, 'editTournament')) {
      return NextResponse.json(
        { error: 'Only Admins and Hosts can edit matches' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const data = {};

    if (body.teamA !== undefined) {
      const t = String(body.teamA).trim();
      if (!t) {
        return NextResponse.json(
          { error: 'teamA cannot be empty' },
          { status: 400 },
        );
      }
      data.teamA = t;
    }

    if (body.teamB !== undefined) {
      const t = String(body.teamB).trim();
      if (!t) {
        return NextResponse.json(
          { error: 'teamB cannot be empty' },
          { status: 400 },
        );
      }
      data.teamB = t;
    }

    if (body.playerAId !== undefined) {
      data.playerAId = body.playerAId || null;
    }

    if (body.playerBId !== undefined) {
      data.playerBId = body.playerBId || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data,
      include: {
        playerA: { select: { id: true, name: true, avatarUrl: true } },
        playerB: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ success: true, match: updated });
  } catch (err) {
    console.error('[matches/[id]] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
