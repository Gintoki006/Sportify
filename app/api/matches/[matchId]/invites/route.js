import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { isTeamSport } from '@/lib/sportMetrics';
import { createNotification } from '@/lib/notifications';

/**
 * GET /api/matches/[matchId]/invites — list invites for a match
 */
export async function GET(req, { params }) {
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
        playerAId: true,
        playerBId: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only creator, linked players, or invited users can view invites
    const invites = await prisma.matchInvite.findMany({
      where: { matchId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
      orderBy: [{ team: 'asc' }, { createdAt: 'asc' }],
    });

    const isCreator = match.createdByUserId === dbUser.id;
    const isPlayer =
      match.playerAId === dbUser.id || match.playerBId === dbUser.id;
    const isInvited = invites.some((inv) => inv.userId === dbUser.id);

    if (!isCreator && !isPlayer && !isInvited) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      invites: invites.map((inv) => ({
        id: inv.id,
        matchId: inv.matchId,
        user: inv.user,
        team: inv.team,
        status: inv.status,
        createdAt: inv.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('[matches/[id]/invites] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/matches/[matchId]/invites — invite a player to a standalone match
 *
 * Body: {
 *   userId: string (required) — the user to invite,
 *   team: "A" | "B" (required) — which team/side they're invited to,
 * }
 *
 * For individual sports: also sets playerAId/playerBId on the match.
 * For team sports: adds to team roster (used during scoring).
 */
export async function POST(req, { params }) {
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
        sportType: true,
        teamA: true,
        teamB: true,
        playerAId: true,
        playerBId: true,
        completed: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (!match.isStandalone) {
      return NextResponse.json(
        { error: 'Invites are only supported for standalone matches' },
        { status: 400 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true, name: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only creator can invite
    if (match.createdByUserId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Only the match creator can send invites' },
        { status: 403 },
      );
    }

    if (match.completed) {
      return NextResponse.json(
        { error: 'Cannot invite players to a completed match' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { userId, team } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    if (!team || !['A', 'B'].includes(team)) {
      return NextResponse.json(
        { error: 'team must be "A" or "B"' },
        { status: 400 },
      );
    }

    // Can't invite yourself
    if (userId === dbUser.id) {
      return NextResponse.json(
        { error: 'You cannot invite yourself' },
        { status: 400 },
      );
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true, email: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already invited to this match
    const existingInvite = await prisma.matchInvite.findUnique({
      where: { matchId_userId: { matchId, userId } },
    });
    if (existingInvite) {
      return NextResponse.json(
        { error: 'User has already been invited to this match' },
        { status: 400 },
      );
    }

    // For individual sports, check if the slot is already taken
    const isTeam = isTeamSport(match.sportType);
    if (!isTeam) {
      const playerField = team === 'A' ? 'playerAId' : 'playerBId';
      if (match[playerField] && match[playerField] !== userId) {
        return NextResponse.json(
          { error: `Player slot for Team ${team} is already filled` },
          { status: 400 },
        );
      }
    }

    const invite = await prisma.matchInvite.create({
      data: { matchId, userId, team },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
    });

    // Send notification to the invited user (non-fatal)
    try {
      const creatorName = dbUser.name || 'Someone';
      await createNotification({
        userId,
        type: 'MATCH_INVITE',
        title: 'Match Invite',
        message: `${creatorName} invited you to a ${match.sportType?.toLowerCase() || ''} match: ${match.teamA || 'Team A'} vs ${match.teamB || 'Team B'}`,
        linkUrl: `/dashboard/matches/${matchId}`,
        matchId,
      });
    } catch (notifErr) {
      console.error('[invites] Notification error (non-fatal):', notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        invite: {
          id: invite.id,
          matchId: invite.matchId,
          user: invite.user,
          team: invite.team,
          status: invite.status,
          createdAt: invite.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[matches/[id]/invites] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
