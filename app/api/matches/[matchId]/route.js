import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

// ────────────────────────────────────────────────────────────
// GET /api/matches/[matchId] — standalone match detail
// ────────────────────────────────────────────────────────────
export async function GET(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        playerA: { select: { id: true, name: true, avatarUrl: true } },
        playerB: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        statEntries: { select: { id: true }, take: 1 },
        cricketInnings: {
          orderBy: { inningsNumber: 'asc' },
          select: {
            id: true,
            inningsNumber: true,
            battingTeamName: true,
            bowlingTeamName: true,
            totalRuns: true,
            totalWickets: true,
            totalOvers: true,
            isComplete: true,
          },
        },
        matchInvites: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        tournament: {
          select: { id: true, name: true, sportType: true, clubId: true },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // For standalone matches, verify access (creator, linked player, or invited)
    if (match.isStandalone) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
        select: { id: true },
      });
      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isCreator = match.createdByUserId === dbUser.id;
      const isPlayerA = match.playerAId === dbUser.id;
      const isPlayerB = match.playerBId === dbUser.id;
      const isInvited = match.matchInvites?.some(
        (inv) => inv.userId === dbUser.id,
      );

      if (!isCreator && !isPlayerA && !isPlayerB && !isInvited) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({
      match: {
        id: match.id,
        sportType: match.sportType || match.tournament?.sportType,
        teamA: match.teamA,
        teamB: match.teamB,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        date: match.date?.toISOString() || null,
        completed: match.completed,
        round: match.round,
        isStandalone: match.isStandalone,
        overs: match.overs,
        playersPerSide: match.playersPerSide,
        playerA: match.playerA,
        playerB: match.playerB,
        createdBy: match.createdBy,
        createdByUserId: match.createdByUserId,
        tournamentId: match.tournamentId,
        tournament: match.tournament,
        statsSynced: match.statEntries.length > 0,
        cricketInnings: match.cricketInnings,
        invites:
          match.matchInvites?.map((inv) => ({
            id: inv.id,
            user: inv.user,
            team: inv.team,
            role: inv.role,
            status: inv.status,
          })) || [],
        createdAt: match.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[matches/[id]] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────────────────
// PUT /api/matches/[matchId] — edit a match
// Supports both tournament matches (ADMIN/HOST) and standalone
// matches (creator only, before scoring starts).
// Body: { teamA?, teamB?, playerAId?, playerBId?, date?,
//         overs?, playersPerSide? }
// ────────────────────────────────────────────────────────────
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

    if (match.isStandalone) {
      // Standalone: only creator can edit
      if (match.createdByUserId !== dbUser.id) {
        return NextResponse.json(
          { error: 'Only the match creator can edit this match' },
          { status: 403 },
        );
      }
    } else {
      // Tournament: ADMIN or HOST
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

    // Standalone-only editable fields
    if (match.isStandalone) {
      if (body.date !== undefined) {
        data.date = body.date ? new Date(body.date) : null;
      }
      if (body.overs !== undefined) {
        const o = Number(body.overs);
        if (body.overs === null) {
          data.overs = null;
        } else if (!Number.isInteger(o) || o < 1 || o > 50) {
          return NextResponse.json(
            { error: 'overs must be an integer between 1 and 50' },
            { status: 400 },
          );
        } else {
          data.overs = o;
        }
      }
      if (body.playersPerSide !== undefined) {
        const p = Number(body.playersPerSide);
        if (body.playersPerSide === null) {
          data.playersPerSide = null;
        } else if (!Number.isInteger(p) || p < 2 || p > 11) {
          return NextResponse.json(
            { error: 'playersPerSide must be an integer between 2 and 11' },
            { status: 400 },
          );
        } else {
          data.playersPerSide = p;
        }
      }
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
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
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

// ────────────────────────────────────────────────────────────
// DELETE /api/matches/[matchId] — delete standalone match
// Creator only. Cascades: cricket innings, stat entries, invites.
// ────────────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        isStandalone: true,
        createdByUserId: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (!match.isStandalone) {
      return NextResponse.json(
        {
          error:
            'Only standalone matches can be deleted directly. Use tournament management to remove tournament matches.',
        },
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

    if (match.createdByUserId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Only the match creator can delete this match' },
        { status: 403 },
      );
    }

    // Cascade delete in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete stat entries linked to this match
      await tx.statEntry.deleteMany({ where: { matchId } });

      // Delete match invites
      await tx.matchInvite.deleteMany({ where: { matchId } });

      // Delete cricket data (innings cascade deletes batting/bowling/ball entries)
      await tx.cricketInnings.deleteMany({ where: { matchId } });

      // Delete football data (events + players + match data)
      const footballData = await tx.footballMatchData.findUnique({
        where: { matchId },
        select: { id: true },
      });
      if (footballData) {
        await tx.footballEvent.deleteMany({
          where: { footballMatchDataId: footballData.id },
        });
        await tx.footballPlayerEntry.deleteMany({
          where: { footballMatchDataId: footballData.id },
        });
        await tx.footballMatchData.delete({
          where: { id: footballData.id },
        });
      }

      // Delete the match itself
      await tx.match.delete({ where: { id: matchId } });
    });

    return NextResponse.json({ success: true, deletedMatchId: matchId });
  } catch (err) {
    console.error('[matches/[id]] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
