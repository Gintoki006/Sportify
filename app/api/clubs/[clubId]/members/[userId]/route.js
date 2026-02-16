import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/clubs/[clubId]/members/[userId] — admin removes a member
 */
export async function DELETE(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clubId, userId } = await params;

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admin can remove members
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { adminUserId: true },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.adminUserId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Only the club admin can remove members' },
        { status: 403 },
      );
    }

    // Prevent admin from removing themselves
    if (userId === dbUser.id) {
      return NextResponse.json(
        { error: 'Admin cannot remove themselves from the club' },
        { status: 400 },
      );
    }

    // Find membership
    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'User is not a member of this club' },
        { status: 404 },
      );
    }

    await prisma.clubMember.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[clubs/[clubId]/members/[userId]] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
