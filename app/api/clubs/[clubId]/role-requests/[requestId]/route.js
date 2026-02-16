import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * PUT /api/clubs/[clubId]/role-requests/[requestId] — approve or reject a role request
 * Body: { action: 'approve' | 'reject' }
 */
export async function PUT(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clubId, requestId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permission
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
        { error: 'You do not have permission to manage role requests' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 },
      );
    }

    const request = await prisma.roleUpgradeRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!request || request.clubId !== clubId) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 },
      );
    }

    if (action === 'approve') {
      // Update the request status and member role in a transaction
      await prisma.$transaction([
        prisma.roleUpgradeRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        }),
        prisma.clubMember.update({
          where: {
            userId_clubId: { userId: request.userId, clubId },
          },
          data: { role: request.requestedRole },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `${request.user.name}'s role upgraded to ${request.requestedRole}`,
      });
    } else {
      // Reject
      await prisma.roleUpgradeRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });

      return NextResponse.json({
        success: true,
        message: `${request.user.name}'s role request rejected`,
      });
    }
  } catch (err) {
    console.error('[role-requests/[requestId]] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
