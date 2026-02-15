import { redirect } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ClubDetailClient from '@/components/clubs/ClubDetailClient';

export default async function ClubDetailPage({ params }) {
  const dbUser = await ensureDbUser();
  if (!dbUser) redirect('/sign-in');

  const { clubId } = await params;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      admin: { select: { id: true, name: true, avatarUrl: true } },
      members: {
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, email: true },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      tournaments: {
        orderBy: { startDate: 'desc' },
        include: { _count: { select: { matches: true } } },
      },
    },
  });

  if (!club) redirect('/dashboard/clubs');

  const isAdmin = club.adminUserId === dbUser.id;
  const isMember = club.members.some((m) => m.user.id === dbUser.id);

  const clubData = {
    id: club.id,
    name: club.name,
    description: club.description,
    createdAt: club.createdAt.toISOString(),
    admin: club.admin,
    isAdmin,
    isMember,
    members: club.members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      email: m.user.email,
      joinedAt: m.joinedAt.toISOString(),
    })),
    tournaments: club.tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      sportType: t.sportType,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate?.toISOString() || null,
      status: t.status,
      matchCount: t._count.matches,
    })),
  };

  return <ClubDetailClient club={clubData} currentUserId={dbUser.id} />;
}
