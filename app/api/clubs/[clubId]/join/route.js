import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/clubs/[clubId]/join — join a club
 */
export async function POST(req, { params }) {
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
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: dbUser.id, clubId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 });
    }

    await prisma.clubMember.create({
      data: { userId: dbUser.id, clubId },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[clubs/join] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/clubs/[clubId]/join — leave a club
 */
export async function DELETE(req, { params }) {
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

    // Admins can't leave their own club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { adminUserId: true },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.adminUserId === dbUser.id) {
      return NextResponse.json(
        { error: 'Admin cannot leave their own club' },
        { status: 400 },
      );
    }

    const membership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: dbUser.id, clubId } },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this club' },
        { status: 404 },
      );
    }

    await prisma.clubMember.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[clubs/join] DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
