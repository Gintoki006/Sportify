import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import GoalsPageClient from '@/components/goals/GoalsPageClient';

export default async function GoalsPage() {
  const user = await ensureDbUser();
  const userId = user?.id;

  if (!userId) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Please sign in to view your goals.</p>
      </div>
    );
  }

  const sportProfiles = user.sportProfiles || [];
  const sportProfileIds = sportProfiles.map((sp) => sp.id);

  const allGoals = await prisma.goal.findMany({
    where: { sportProfileId: { in: sportProfileIds } },
    orderBy: { createdAt: 'desc' },
    include: {
      sportProfile: { select: { sportType: true } },
    },
  });

  const serialize = (g) => ({
    id: g.id,
    metric: g.metric,
    target: g.target,
    current: g.current,
    completed: g.completed,
    deadline: g.deadline?.toISOString() || null,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    sportType: g.sportProfile.sportType,
  });

  const activeGoals = allGoals.filter((g) => !g.completed).map(serialize);
  const completedGoals = allGoals.filter((g) => g.completed).map(serialize);

  const clientProfiles = sportProfiles.map((sp) => ({
    id: sp.id,
    sportType: sp.sportType,
  }));

  return (
    <GoalsPageClient
      activeGoals={activeGoals}
      completedGoals={completedGoals}
      sportProfiles={clientProfiles}
    />
  );
}
