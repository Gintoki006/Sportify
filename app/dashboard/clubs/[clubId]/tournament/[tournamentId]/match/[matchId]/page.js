import { redirect } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';
import CricketMatchClient from '@/components/clubs/CricketMatchClient';

export default async function CricketMatchPage({ params }) {
  const dbUser = await ensureDbUser();
  if (!dbUser) redirect('/sign-in');

  const { clubId, tournamentId, matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          sportType: true,
          overs: true,
          playersPerSide: true,
          clubId: true,
          status: true,
          club: {
            select: {
              id: true,
              name: true,
              adminUserId: true,
              members: {
                where: { userId: dbUser.id },
                select: { role: true },
              },
            },
          },
        },
      },
      playerA: { select: { id: true, name: true, avatarUrl: true } },
      playerB: { select: { id: true, name: true, avatarUrl: true } },
      cricketInnings: {
        orderBy: { inningsNumber: 'asc' },
        include: {
          battingEntries: { orderBy: { battingOrder: 'asc' } },
          bowlingEntries: { orderBy: { bowlingOrder: 'asc' } },
          ballEvents: {
            orderBy: [
              { overNumber: 'asc' },
              { ballNumber: 'asc' },
              { timestamp: 'asc' },
            ],
          },
        },
      },
    },
  });

  if (
    !match ||
    match.tournament.clubId !== clubId ||
    match.tournament.id !== tournamentId ||
    match.tournament.sportType !== 'CRICKET'
  ) {
    redirect(`/dashboard/clubs/${clubId}/tournament/${tournamentId}`);
  }

  const isOwner = match.tournament.club.adminUserId === dbUser.id;
  const memberRole = match.tournament.club.members[0]?.role || null;
  const currentUserRole = isOwner ? 'ADMIN' : memberRole;
  const canScore = hasPermission(currentUserRole, 'enterScores');

  // Fetch all club members for member-linking autocomplete
  const clubMembers = await prisma.clubMember.findMany({
    where: { clubId },
    select: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  const membersData = clubMembers.map((cm) => ({
    id: cm.user.id,
    name: cm.user.name,
    avatarUrl: cm.user.avatarUrl,
  }));

  // Compute fall of wickets and over summaries for each innings
  const inningsData = match.cricketInnings.map((inn) => {
    const fallOfWickets = [];
    let runningTotal = 0;
    let wicketCount = 0;

    for (const ball of inn.ballEvents) {
      runningTotal += ball.runsScored + ball.extraRuns;
      if (ball.isWicket && ball.dismissalType !== 'RETIRED') {
        wicketCount++;
        fallOfWickets.push({
          wicketNumber: wicketCount,
          runs: runningTotal,
          overs: `${ball.overNumber}.${ball.ballNumber}`,
          batsmanName: ball.batsmanName,
          dismissalType: ball.dismissalType,
        });
      }
    }

    const overSummaries = [];
    const maxOver =
      inn.ballEvents.length > 0
        ? Math.max(...inn.ballEvents.map((b) => b.overNumber))
        : 0;

    for (let o = 1; o <= maxOver; o++) {
      const overBalls = inn.ballEvents.filter((b) => b.overNumber === o);
      const overRuns = overBalls.reduce(
        (sum, b) => sum + b.runsScored + b.extraRuns,
        0,
      );
      overSummaries.push({
        over: o,
        runs: overRuns,
        wickets: overBalls.filter((b) => b.isWicket).length,
        balls: overBalls.map((b) => ({
          runs: b.runsScored,
          extraType: b.extraType,
          extraRuns: b.extraRuns,
          isWicket: b.isWicket,
          commentary: b.commentary,
        })),
      });
    }

    return {
      id: inn.id,
      inningsNumber: inn.inningsNumber,
      battingTeamName: inn.battingTeamName,
      bowlingTeamName: inn.bowlingTeamName,
      totalRuns: inn.totalRuns,
      totalWickets: inn.totalWickets,
      totalOvers: inn.totalOvers,
      extras: inn.extras,
      isComplete: inn.isComplete,
      battingEntries: inn.battingEntries.map((b) => ({
        id: b.id,
        playerName: b.playerName,
        playerId: b.playerId,
        runs: b.runs,
        ballsFaced: b.ballsFaced,
        fours: b.fours,
        sixes: b.sixes,
        strikeRate: b.strikeRate,
        isOut: b.isOut,
        dismissalType: b.dismissalType,
        bowlerName: b.bowlerName,
        fielderName: b.fielderName,
        battingOrder: b.battingOrder,
      })),
      bowlingEntries: inn.bowlingEntries.map((b) => ({
        id: b.id,
        playerName: b.playerName,
        playerId: b.playerId,
        oversBowled: b.oversBowled,
        maidens: b.maidens,
        runsConceded: b.runsConceded,
        wickets: b.wickets,
        economy: b.economy,
        extras: b.extras,
        noBalls: b.noBalls,
        wides: b.wides,
        bowlingOrder: b.bowlingOrder,
      })),
      fallOfWickets,
      overSummaries,
    };
  });

  const matchData = {
    id: match.id,
    teamA: match.teamA,
    teamB: match.teamB,
    playerA: match.playerA,
    playerB: match.playerB,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    completed: match.completed,
    round: match.round,
    tournament: {
      id: match.tournament.id,
      name: match.tournament.name,
      overs: match.tournament.overs || 20,
      playersPerSide: match.tournament.playersPerSide || 11,
      clubId: match.tournament.clubId,
    },
    club: {
      id: match.tournament.club.id,
      name: match.tournament.club.name,
    },
    innings: inningsData,
    canScore,
  };

  return <CricketMatchClient match={matchData} members={membersData} />;
}
