import { redirect } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import MatchDetailClient from '@/components/matches/MatchDetailClient';

export default async function MatchDetailPage({ params }) {
  const dbUser = await ensureDbUser();
  if (!dbUser) redirect('/sign-in');

  const { matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId, isStandalone: true },
    include: {
      playerA: { select: { id: true, name: true, avatarUrl: true } },
      playerB: { select: { id: true, name: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true, avatarUrl: true } },
      statEntries: { select: { id: true, sportProfileId: true }, take: 10 },
      cricketInnings: {
        orderBy: { inningsNumber: 'asc' },
        include: {
          battingEntries: { orderBy: { battingOrder: 'asc' } },
          bowlingEntries: { orderBy: { id: 'asc' } },
          ballEvents: {
            orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }],
          },
        },
      },
      matchInvites: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!match) redirect('/dashboard/matches');

  // Verify access: creator, linked player, or invited
  const isCreator = match.createdByUserId === dbUser.id;
  const isPlayerA = match.playerAId === dbUser.id;
  const isPlayerB = match.playerBId === dbUser.id;
  const isInvited = match.matchInvites?.some((inv) => inv.userId === dbUser.id);

  if (!isCreator && !isPlayerA && !isPlayerB && !isInvited) {
    redirect('/dashboard/matches');
  }

  // Build members list from accepted invites (for cricket member autocomplete)
  const invitedMembers = (match.matchInvites || [])
    .filter((inv) => inv.status === 'ACCEPTED')
    .map((inv) => ({
      userId: inv.user.id,
      name: inv.user.name,
      avatarUrl: inv.user.avatarUrl,
      team: inv.team,
    }));

  // If the creator is not in the invites, add them
  if (isCreator && !invitedMembers.find((m) => m.userId === dbUser.id)) {
    invitedMembers.unshift({
      userId: dbUser.id,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      team: null,
    });
  }

  // Serialize match data
  const serializedMatch = {
    id: match.id,
    sportType: match.sportType,
    teamA: match.teamA,
    teamB: match.teamB,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    date: match.date?.toISOString() || null,
    completed: match.completed,
    isStandalone: true,
    overs: match.sportType === 'CRICKET' ? (match.overs || 20) : null,
    playersPerSide: match.sportType === 'CRICKET' ? (match.playersPerSide || 11) : null,
    playerA: match.playerA,
    playerB: match.playerB,
    playerAId: match.playerAId,
    playerBId: match.playerBId,
    createdBy: match.createdBy,
    createdByUserId: match.createdByUserId,
    statsSynced: match.statEntries.length > 0,
    canScore: isCreator,
    // Provide a tournament-like shape for CricketMatchClient compatibility
    tournament: match.sportType === 'CRICKET' ? {
      id: null,
      name: 'Standalone Match',
      overs: match.overs || 20,
      playersPerSide: match.playersPerSide || 11,
    } : null,
    club: match.sportType === 'CRICKET' ? { id: null } : null,
    innings: (match.cricketInnings || []).map((inn) => ({
      id: inn.id,
      inningsNumber: inn.inningsNumber,
      battingTeamName: inn.battingTeamName,
      bowlingTeamName: inn.bowlingTeamName,
      totalRuns: inn.totalRuns,
      totalWickets: inn.totalWickets,
      totalOvers: inn.totalOvers,
      extras: inn.extras,
      isComplete: inn.isComplete,
      battingEntries: inn.battingEntries.map((be) => ({
        ...be,
        createdAt: be.createdAt?.toISOString?.() || null,
      })),
      bowlingEntries: inn.bowlingEntries.map((bwl) => ({
        ...bwl,
        createdAt: bwl.createdAt?.toISOString?.() || null,
      })),
      ballEvents: inn.ballEvents.map((ev) => ({
        ...ev,
        timestamp: ev.timestamp?.toISOString?.() || null,
      })),
    })),
    invites: (match.matchInvites || []).map((inv) => ({
      id: inv.id,
      user: inv.user,
      userId: inv.userId,
      team: inv.team,
      status: inv.status,
    })),
    createdAt: match.createdAt.toISOString(),
  };

  return (
    <MatchDetailClient
      match={serializedMatch}
      currentUserId={dbUser.id}
      members={invitedMembers}
    />
  );
}
