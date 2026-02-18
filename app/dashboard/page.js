import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import GreetingHeader from '@/components/dashboard/GreetingHeader';
import GoalProgressRings from '@/components/dashboard/GoalProgressRings';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import TrendCharts from '@/components/dashboard/TrendCharts';
import UpcomingMatches from '@/components/dashboard/UpcomingMatches';
import RecentMatchResults from '@/components/dashboard/RecentMatchResults';
import FloatingAddButton from '@/components/stats/FloatingAddButton';

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

  const [allEntries, allGoals, upcomingMatches, recentMatches] =
    await Promise.all([
      prisma.statEntry.findMany({
        where: { sportProfileId: { in: sportProfileIds } },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.goal.findMany({
        where: { sportProfileId: { in: sportProfileIds } },
        orderBy: { createdAt: 'desc' },
      }),
      // Upcoming standalone matches (not completed)
      prisma.match.findMany({
        where: {
          isStandalone: true,
          completed: false,
          OR: [
            { createdByUserId: userId },
            { playerAId: userId },
            { playerBId: userId },
            { matchInvites: { some: { userId, status: 'ACCEPTED' } } },
            { matchInvites: { some: { userId, status: 'PENDING' } } },
          ],
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
        take: 5,
        include: {
          matchInvites: {
            where: { userId },
            select: { id: true, status: true },
          },
        },
      }),
      // Recent completed standalone matches
      prisma.match.findMany({
        where: {
          isStandalone: true,
          completed: true,
          OR: [
            { createdByUserId: userId },
            { playerAId: userId },
            { playerBId: userId },
            { matchInvites: { some: { userId } } },
          ],
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        include: {
          statEntries: { select: { id: true }, take: 1 },
        },
      }),
    ]);

  // ── Compute stats ──
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const thisWeekEntries = allEntries.filter(
    (e) => new Date(e.date) >= weekAgo,
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

  // Serialize upcoming matches for client
  const serializedUpcoming = upcomingMatches.map((m) => {
    const userInvite = m.matchInvites?.find((inv) => true);
    return {
      id: m.id,
      sportType: m.sportType,
      teamA: m.teamA,
      teamB: m.teamB,
      date: m.date?.toISOString() || null,
      pendingInvites:
        m.matchInvites?.filter((inv) => inv.status === 'PENDING').length || 0,
      userInviteStatus: userInvite?.status || null,
      userInviteId: userInvite?.id || null,
    };
  });

  // Serialize recent match results for client
  const serializedRecent = recentMatches.map((m) => ({
    id: m.id,
    sportType: m.sportType,
    teamA: m.teamA,
    teamB: m.teamB,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    date: m.date?.toISOString() || null,
    createdAt: m.createdAt.toISOString(),
    statsSynced: m.statEntries?.length > 0,
  }));

  // Serialize sport profiles for FloatingAddButton
  const serializedProfiles = sportProfiles.map((sp) => ({
    id: sp.id,
    sportType: sp.sportType,
  }));

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

      {/* Matches row — upcoming + recent results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingMatches matches={serializedUpcoming} />
        <RecentMatchResults matches={serializedRecent} />
      </div>

      {/* Recent activity */}
      <RecentActivityFeed entries={enrichedEntries.slice(0, 10)} />

      {/* Floating add button — only on dashboard overview */}
      <FloatingAddButton sportProfiles={serializedProfiles} />
    </div>
  );
}
