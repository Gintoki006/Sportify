import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { cache } from 'react';

/**
 * Ensure the current Clerk user exists in the database.
 * Call this in server components or API routes when you need the DB user.
 *
 * Wrapped with React.cache() to deduplicate within a single request.
 *
 * - If the user already exists, returns the existing record.
 * - If not, creates a new record from Clerk data.
 *
 * @returns {Promise<Object|null>} The database User record, or null if not signed in.
 */
export const ensureDbUser = cache(async () => {
  const clerkUser = await currentUser();

  if (!clerkUser) return null;

  // Try to find existing user
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    include: { sportProfiles: true },
  });

  // If not found, create one
  if (!dbUser) {
    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress || `${clerkUser.id}@unknown`;
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      'User';

    dbUser = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: email,
        name: name,
        avatarUrl: clerkUser.imageUrl || null,
      },
      include: { sportProfiles: true },
    });
  }

  return dbUser;
});
