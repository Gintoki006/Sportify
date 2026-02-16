import { redirect } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import TournamentDetailClient from '@/components/clubs/TournamentDetailClient';
import { hasPermission } from '@/lib/clubPermissions';

export default async function TournamentDetailPage({ params }) {
  const dbUser = await ensureDbUser();
  if (!dbUser) redirect('/sign-in');

  const { clubId, tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
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
      matches: {
        orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
        include: {
          playerA: { select: { id: true, name: true, avatarUrl: true } },
          playerB: { select: { id: true, name: true, avatarUrl: true } },
          statEntries: { select: { id: true }, take: 1 },
        },
      },
    },
  });

  if (!tournament || tournament.club.id !== clubId) {
    redirect(`/dashboard/clubs/${clubId}`);
  }

  const isOwner = tournament.club.adminUserId === dbUser.id;
  const memberRole = tournament.club.members[0]?.role || null;
  const currentUserRole = isOwner ? 'ADMIN' : memberRole;
  const canEnterScores = hasPermission(currentUserRole, 'enterScores');
  const canManageTournament = hasPermission(currentUserRole, 'editTournament');

  // Fetch club members for the "add player" feature (only if user can manage)
  let clubMembers = [];
  if (canManageTournament) {
    const members = await prisma.clubMember.findMany({
      where: { clubId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
    clubMembers = members
      .filter((m) => {
        const effectiveRole =
          m.userId === tournament.club.adminUserId ? 'ADMIN' : m.role;
        return ['ADMIN', 'HOST', 'PARTICIPANT'].includes(effectiveRole);
      })
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
      }));
  }

  const tournamentData = {
    id: tournament.id,
    name: tournament.name,
    sportType: tournament.sportType,
    startDate: tournament.startDate.toISOString(),
    endDate: tournament.endDate?.toISOString() || null,
    status: tournament.status,
    overs: tournament.overs,
    playersPerSide: tournament.playersPerSide,
    club: { id: tournament.club.id, name: tournament.club.name },
    canEnterScores,
    canManageTournament,
    clubMembers,
    matches: tournament.matches.map((m) => ({
      id: m.id,
      round: m.round,
      teamA: m.teamA,
      teamB: m.teamB,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      date: m.date?.toISOString() || null,
      completed: m.completed,
      playerA: m.playerA || null,
      playerB: m.playerB || null,
      statsSynced: m.statEntries?.length > 0,
    })),
  };

  return <TournamentDetailClient tournament={tournamentData} />;
}
