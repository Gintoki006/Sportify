import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/notifications — list notifications for the current user
 *
 * Query params:
 *   ?unreadOnly=true — only return unread notifications
 *   ?limit=20 — max results (default 20, max 100)
 */
export async function GET(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const limit = Math.min(Math.max(limitParam, 1), 100);

    const where = { userId: dbUser.id };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: dbUser.id, read: false },
      }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        linkUrl: n.linkUrl,
        matchId: n.matchId,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (err) {
    console.error('[notifications] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/notifications — mark notifications as read
 *
 * Body: { notificationIds: string[] }  — mark specific notifications
 *   or  { markAllRead: true }          — mark all as read
 */
export async function PUT(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: dbUser.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, markedAll: true });
    }

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: dbUser.id, // ensure user owns these notifications
        },
        data: { read: true },
      });
      return NextResponse.json({
        success: true,
        markedCount: notificationIds.length,
      });
    }

    return NextResponse.json(
      { error: 'Provide notificationIds or markAllRead' },
      { status: 400 },
    );
  } catch (err) {
    console.error('[notifications] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
