import { redirect } from 'next/navigation';
import { ensureDbUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import TournamentDetailClient from '@/components/clubs/TournamentDetailClient';

export default async function TournamentDetailPage({ params }) {
  const dbUser = await ensureDbUser();
  if (!dbUser) redirect('/sign-in');

  const { clubId, tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      club: { select: { id: true, name: true, adminUserId: true } },
      matches: { orderBy: [{ round: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  if (!tournament || tournament.club.id !== clubId) {
    redirect(`/dashboard/clubs/${clubId}`);
  }

  const isAdmin = tournament.club.adminUserId === dbUser.id;

  const tournamentData = {
    id: tournament.id,
    name: tournament.name,
    sportType: tournament.sportType,
    startDate: tournament.startDate.toISOString(),
    endDate: tournament.endDate?.toISOString() || null,
    status: tournament.status,
    club: { id: tournament.club.id, name: tournament.club.name },
    isAdmin,
    matches: tournament.matches.map((m) => ({
      id: m.id,
      round: m.round,
      teamA: m.teamA,
      teamB: m.teamB,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      date: m.date?.toISOString() || null,
      completed: m.completed,
    })),
  };

  return <TournamentDetailClient tournament={tournamentData} />;
}
