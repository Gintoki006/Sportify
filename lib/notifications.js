import prisma from '@/lib/prisma';

/**
 * Create a notification for a user.
 *
 * @param {object} params
 * @param {string} params.userId - target user
 * @param {'MATCH_INVITE'|'MATCH_SCORED'|'INVITE_ACCEPTED'|'INVITE_DECLINED'} params.type
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.linkUrl]
 * @param {string} [params.matchId]
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  linkUrl,
  matchId,
}) {
  try {
    return await prisma.notification.create({
      data: { userId, type, title, message, linkUrl, matchId },
    });
  } catch (err) {
    console.error('[notifications] Create failed:', err);
    return null;
  }
}

/**
 * Create notifications for multiple users at once.
 *
 * @param {Array<{ userId: string, type: string, title: string, message: string, linkUrl?: string, matchId?: string }>} notifications
 */
export async function createBulkNotifications(notifications) {
  if (!notifications.length) return;
  try {
    return await prisma.notification.createMany({
      data: notifications,
    });
  } catch (err) {
    console.error('[notifications] Bulk create failed:', err);
    return null;
  }
}
