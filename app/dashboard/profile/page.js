import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ProfilePageClient from '@/components/profile/ProfilePageClient';

export default async function ProfilePage() {
  const user = await ensureDbUser();

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Please sign in to view your profile.</p>
      </div>
    );
  }

  // Fetch full profile with sport data, entries, and goals
  const sportProfiles = await prisma.sportProfile.findMany({
    where: { userId: user.id },
    include: {
      stats: { orderBy: { date: 'desc' } },
      goals: { orderBy: { createdAt: 'desc' } },
    },
  });

  // Count total entries across all sports
  const totalEntries = sportProfiles.reduce(
    (sum, sp) => sum + sp.stats.length,
    0,
  );

  // Serialize for client
  const clientUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    sportCount: sportProfiles.length,
    totalEntries,
  };

  const sportData = sportProfiles.map((sp) => ({
    profileId: sp.id,
    sportType: sp.sportType,
    entries: sp.stats.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      opponent: e.opponent,
      notes: e.notes,
      metrics: e.metrics,
      source: e.source,
    })),
    goals: sp.goals.map((g) => ({
      id: g.id,
      metric: g.metric,
      target: g.target,
      current: g.current,
      completed: g.completed,
      deadline: g.deadline?.toISOString() || null,
    })),
  }));

  return <ProfilePageClient user={clientUser} sportData={sportData} />;
}
