import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import MatchesPageClient from '@/components/matches/MatchesPageClient';

export default async function MatchesPage() {
  const user = await ensureDbUser();

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Please sign in to view matches.</p>
      </div>
    );
  }

  const matches = await prisma.match.findMany({
    where: {
      isStandalone: true,
      OR: [
        { createdByUserId: user.id },
        { playerAId: user.id },
        { playerBId: user.id },
        { matchInvites: { some: { userId: user.id } } },
      ],
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 50,
    include: {
      playerA: { select: { id: true, name: true, avatarUrl: true } },
      playerB: { select: { id: true, name: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true, avatarUrl: true } },
      statEntries: { select: { id: true }, take: 1 },
      cricketInnings: {
        orderBy: { inningsNumber: 'asc' },
        select: {
          inningsNumber: true,
          totalRuns: true,
          totalWickets: true,
          totalOvers: true,
          isComplete: true,
          battingTeamName: true,
        },
      },
      matchInvites: {
        select: {
          id: true,
          userId: true,
          team: true,
          status: true,
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  });

  const serialized = matches.map((m) => ({
    id: m.id,
    sportType: m.sportType,
    teamA: m.teamA,
    teamB: m.teamB,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    date: m.date?.toISOString() || null,
    completed: m.completed,
    overs: m.overs,
    playersPerSide: m.playersPerSide,
    playerA: m.playerA,
    playerB: m.playerB,
    createdBy: m.createdBy,
    createdByUserId: m.createdByUserId,
    invites: m.matchInvites || [],
    statsSynced: m.statEntries.length > 0,
    cricketInnings: m.cricketInnings || [],
    createdAt: m.createdAt.toISOString(),
  }));

  return <MatchesPageClient matches={serialized} currentUserId={user.id} />;
}
