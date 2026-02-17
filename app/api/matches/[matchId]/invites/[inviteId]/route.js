import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { isTeamSport } from '@/lib/sportMetrics';
import { createNotification } from '@/lib/notifications';

/**
 * PUT /api/matches/[matchId]/invites/[inviteId] — accept or decline an invite
 *
 * Body: { action: "accept" | "decline" }
 *
 * On accept (individual sports): sets playerAId or playerBId on the match.
 * On decline: marks invite as DECLINED.
 */
export async function PUT(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId, inviteId } = await params;

    const invite = await prisma.matchInvite.findUnique({
      where: { id: inviteId },
      include: {
        match: {
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
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.matchId !== matchId) {
      return NextResponse.json(
        { error: 'Invite does not belong to this match' },
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

    // Only the invited user can accept/decline
    if (invite.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Only the invited user can respond to this invite' },
        { status: 403 },
      );
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Invite has already been ${invite.status.toLowerCase()}` },
        { status: 400 },
      );
    }

    if (invite.match.completed) {
      return NextResponse.json(
        { error: 'Match has already been completed' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "accept" or "decline"' },
        { status: 400 },
      );
    }

    if (action === 'decline') {
      const updated = await prisma.matchInvite.update({
        where: { id: inviteId },
        data: { status: 'DECLINED' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // Notify match creator (non-fatal)
      try {
        if (
          invite.match.createdByUserId &&
          invite.match.createdByUserId !== dbUser.id
        ) {
          await createNotification({
            userId: invite.match.createdByUserId,
            type: 'INVITE_DECLINED',
            title: 'Invite Declined',
            message: `${dbUser.name || 'A player'} declined the invite for your match.`,
            linkUrl: `/dashboard/matches/${matchId}`,
            matchId,
          });
        }
      } catch (notifErr) {
        console.error('[invites] Notification error (non-fatal):', notifErr);
      }

      return NextResponse.json({
        success: true,
        invite: {
          id: updated.id,
          matchId: updated.matchId,
          user: updated.user,
          team: updated.team,
          status: updated.status,
        },
      });
    }

    // action === 'accept'
    const isTeam = isTeamSport(invite.match.sportType);

    try {
      await prisma.$transaction(async (tx) => {
        // For individual sports, check slot isn't already occupied (race condition guard)
        if (!isTeam) {
          const currentMatch = await tx.match.findUnique({
            where: { id: matchId },
            select: { playerAId: true, playerBId: true },
          });
          const playerField = invite.team === 'A' ? 'playerAId' : 'playerBId';
          if (
            currentMatch[playerField] &&
            currentMatch[playerField] !== dbUser.id
          ) {
            throw new Error(`SLOT_TAKEN`);
          }
        }

        // Mark invite as accepted
        await tx.matchInvite.update({
          where: { id: inviteId },
          data: { status: 'ACCEPTED' },
        });

        // For individual sports, link player to the match
        if (!isTeam) {
          const playerField = invite.team === 'A' ? 'playerAId' : 'playerBId';
          await tx.match.update({
            where: { id: matchId },
            data: { [playerField]: dbUser.id },
          });
        }
      });
    } catch (txErr) {
      if (txErr.message === 'SLOT_TAKEN') {
        return NextResponse.json(
          { error: `Player slot for Team ${invite.team} is already filled` },
          { status: 409 },
        );
      }
      throw txErr;
    }

    const updatedInvite = await prisma.matchInvite.findUnique({
      where: { id: inviteId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const updatedMatch = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        playerAId: true,
        playerBId: true,
        playerA: { select: { id: true, name: true, avatarUrl: true } },
        playerB: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Notify match creator of acceptance (non-fatal)
    try {
      if (
        invite.match.createdByUserId &&
        invite.match.createdByUserId !== dbUser.id
      ) {
        await createNotification({
          userId: invite.match.createdByUserId,
          type: 'INVITE_ACCEPTED',
          title: 'Invite Accepted',
          message: `${dbUser.name || 'A player'} accepted the invite for your match: ${invite.match.teamA} vs ${invite.match.teamB}`,
          linkUrl: `/dashboard/matches/${matchId}`,
          matchId,
        });
      }
    } catch (notifErr) {
      console.error('[invites] Notification error (non-fatal):', notifErr);
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: updatedInvite.id,
        matchId: updatedInvite.matchId,
        user: updatedInvite.user,
        team: updatedInvite.team,
        status: updatedInvite.status,
      },
      match: {
        playerA: updatedMatch.playerA,
        playerB: updatedMatch.playerB,
      },
    });
  } catch (err) {
    console.error('[matches/[id]/invites/[inviteId]] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/matches/[matchId]/invites/[inviteId] — cancel/remove an invite
 * Only the match creator can remove invites.
 */
export async function DELETE(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId, inviteId } = await params;

    const invite = await prisma.matchInvite.findUnique({
      where: { id: inviteId },
      include: {
        match: {
          select: {
            id: true,
            isStandalone: true,
            createdByUserId: true,
            sportType: true,
            playerAId: true,
            playerBId: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.matchId !== matchId) {
      return NextResponse.json(
        { error: 'Invite does not belong to this match' },
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

    // Only creator can remove invites
    if (invite.match.createdByUserId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Only the match creator can remove invites' },
        { status: 403 },
      );
    }

    const isTeam = isTeamSport(invite.match.sportType);

    await prisma.$transaction(async (tx) => {
      // If invite was accepted and this is an individual sport, unlink the player
      if (invite.status === 'ACCEPTED' && !isTeam) {
        const playerField = invite.team === 'A' ? 'playerAId' : 'playerBId';
        // Only unlink if it's still this user
        if (invite.match[playerField] === invite.userId) {
          await tx.match.update({
            where: { id: matchId },
            data: { [playerField]: null },
          });
        }
      }

      await tx.matchInvite.delete({ where: { id: inviteId } });
    });

    return NextResponse.json({ success: true, deletedInviteId: inviteId });
  } catch (err) {
    console.error('[matches/[id]/invites/[inviteId]] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
