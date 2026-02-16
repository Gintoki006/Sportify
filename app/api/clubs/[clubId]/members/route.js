import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/clubs/[clubId]/members — admin adds a member by userId
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

    // Only admin can add members
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { adminUserId: true },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.adminUserId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Only the club admin can add members' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    // Check user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this club' },
        { status: 400 },
      );
    }

    const membership = await prisma.clubMember.create({
      data: { userId, clubId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
    });

    return NextResponse.json(
      {
        member: {
          id: membership.id,
          userId: membership.user.id,
          name: membership.user.name,
          avatarUrl: membership.user.avatarUrl,
          email: membership.user.email,
          joinedAt: membership.joinedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[clubs/[clubId]/members] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/clubs/[clubId]/members/search?q=query — search users to add
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

    // Only admin can search for members to add
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.adminUserId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Only the club admin can search for members' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Get existing member user IDs to exclude
    const existingMemberIds = club.members.map((m) => m.userId);

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: existingMemberIds },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error('[clubs/[clubId]/members] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
