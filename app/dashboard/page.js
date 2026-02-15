import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import GreetingHeader from '@/components/dashboard/GreetingHeader';
import GoalProgressRings from '@/components/dashboard/GoalProgressRings';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import TrendCharts from '@/components/dashboard/TrendCharts';

export default async function DashboardPage() {
  const user = await ensureDbUser();
  const userId = user?.id;

  if (!userId) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  // ── Fetch all data in parallel ──
  const sportProfiles = user.sportProfiles || [];
  const sportProfileIds = sportProfiles.map((sp) => sp.id);

  const [allEntries, allGoals] = await Promise.all([
    prisma.statEntry.findMany({
      where: { sportProfileId: { in: sportProfileIds } },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.goal.findMany({
      where: { sportProfileId: { in: sportProfileIds } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // ── Compute stats ──
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const thisWeekEntries = allEntries.filter(
    (e) => new Date(e.date) >= weekAgo
  ).length;

  const activeGoals = allGoals.filter((g) => !g.completed);

  // Map sport profile id → sportType for entries
  const sportProfileMap = {};
  for (const sp of sportProfiles) {
    sportProfileMap[sp.id] = sp.sportType;
  }

  // Enrich entries with sportType for components
  const enrichedEntries = allEntries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    opponent: e.opponent,
    notes: e.notes,
    metrics: e.metrics,
    source: e.source,
    sportType: sportProfileMap[e.sportProfileId],
  }));

  // Enrich goals with sportType
  const enrichedGoals = allGoals
    .filter((g) => !g.completed)
    .map((g) => ({
      id: g.id,
      metric: g.metric,
      target: g.target,
      current: g.current,
      deadline: g.deadline?.toISOString() || null,
      completed: g.completed,
      sportType: sportProfileMap[g.sportProfileId],
    }));

  const sportTypes = sportProfiles.map((sp) => sp.sportType);

  const summaryStats = {
    activeSports: sportProfiles.length,
    totalEntries: allEntries.length,
    thisWeekEntries,
    activeGoals: activeGoals.length,
  };

  return (
    <div className="space-y-6">
      {/* Greeting + summary cards */}
      <GreetingHeader userName={user.name} stats={summaryStats} />

      {/* Charts + Goals row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <TrendCharts entries={enrichedEntries} sportTypes={sportTypes} />
        </div>
        <div className="lg:col-span-2">
          <GoalProgressRings goals={enrichedGoals} />
        </div>
      </div>

      {/* Recent activity */}
      <RecentActivityFeed entries={enrichedEntries.slice(0, 10)} />
    </div>
  );
}
