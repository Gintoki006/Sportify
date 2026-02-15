import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ClubsPageClient from '@/components/clubs/ClubsPageClient';

export default async function ClubsPage() {
  const user = await ensureDbUser();

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Please sign in to view clubs.</p>
      </div>
    );
  }

  const memberships = await prisma.clubMember.findMany({
    where: { userId: user.id },
    include: {
      club: {
        include: {
          admin: { select: { id: true, name: true } },
          _count: { select: { members: true, tournaments: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const clubs = memberships.map((m) => ({
    id: m.club.id,
    name: m.club.name,
    description: m.club.description,
    adminName: m.club.admin.name,
    isAdmin: m.club.admin.id === user.id,
    memberCount: m.club._count.members,
    tournamentCount: m.club._count.tournaments,
    joinedAt: m.joinedAt.toISOString(),
  }));

  return <ClubsPageClient clubs={clubs} />;
}
