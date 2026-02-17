import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * POST /api/matches/[matchId]/football/setup — initialize a football match
 *
 * Body: {
 *   teamAPlayers: [{ name, playerId?, isStarting? }],
 *   teamBPlayers: [{ name, playerId?, isStarting? }],
 *   halfDuration?: number  // override match/tournament default
 * }
 *
 * Creates FootballMatchData and FootballPlayerEntry records for both teams.
 */
export async function POST(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    const body = await req.json();
    const { teamAPlayers, teamBPlayers, halfDuration } = body;

    // ── Validate player arrays ──
    if (
      !teamAPlayers ||
      !Array.isArray(teamAPlayers) ||
      teamAPlayers.length < 1
    ) {
      return NextResponse.json(
        { error: 'teamAPlayers must have at least 1 player' },
        { status: 400 },
      );
    }

    if (
      !teamBPlayers ||
      !Array.isArray(teamBPlayers) ||
      teamBPlayers.length < 1
    ) {
      return NextResponse.json(
        { error: 'teamBPlayers must have at least 1 player' },
        { status: 400 },
      );
    }

    // Validate each player has a name
    for (const p of [...teamAPlayers, ...teamBPlayers]) {
      if (!p.name || typeof p.name !== 'string' || !p.name.trim()) {
        return NextResponse.json(
          { error: 'Every player must have a name' },
          { status: 400 },
        );
      }
    }

    // Check for duplicate playerIds (linked users)
    const linkedIds = [...teamAPlayers, ...teamBPlayers]
      .filter((p) => p.playerId)
      .map((p) => p.playerId);
    if (new Set(linkedIds).size !== linkedIds.length) {
      return NextResponse.json(
        { error: 'Duplicate player IDs detected' },
        { status: 400 },
      );
    }

    // ── Load match ──
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            club: { select: { id: true, adminUserId: true } },
          },
        },
        footballMatchData: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const matchSportType = match.isStandalone
      ? match.sportType
      : match.tournament?.sportType;
    if (matchSportType !== 'FOOTBALL') {
      return NextResponse.json(
        { error: 'This is not a football match' },
        { status: 400 },
      );
    }

    if (match.completed) {
      return NextResponse.json(
        { error: 'Match is already completed' },
        { status: 400 },
      );
    }

    if (match.footballMatchData) {
      return NextResponse.json(
        { error: 'Football match has already been set up' },
        { status: 400 },
      );
    }

    if (match.teamA === 'TBD' || match.teamB === 'TBD') {
      return NextResponse.json(
        { error: 'Cannot set up match with undetermined teams' },
        { status: 400 },
      );
    }

    // ── Permission check ──
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (match.isStandalone) {
      if (match.createdByUserId !== dbUser.id) {
        return NextResponse.json(
          { error: 'Only the match creator can set up this match' },
          { status: 403 },
        );
      }
    } else {
      const membership = await prisma.clubMember.findUnique({
        where: {
          userId_clubId: {
            userId: dbUser.id,
            clubId: match.tournament.club.id,
          },
        },
        select: { role: true },
      });
      const callerRole =
        match.tournament.club.adminUserId === dbUser.id
          ? 'ADMIN'
          : membership?.role;
      if (!callerRole || !hasPermission(callerRole, 'enterScores')) {
        return NextResponse.json(
          { error: 'Only Admins and Hosts can set up matches' },
          { status: 403 },
        );
      }
    }

    // ── Resolve half duration ──
    // Priority: explicit body param > match config > tournament config > default 45
    const resolvedHalfDuration =
      halfDuration ||
      match.halfDuration ||
      match.tournament?.halfDuration ||
      45;

    // ── Create records in a transaction ──
    const footballMatch = await prisma.$transaction(async (tx) => {
      const matchData = await tx.footballMatchData.create({
        data: {
          matchId,
          halfDuration: resolvedHalfDuration,
          status: 'NOT_STARTED',
          halfTimeScoreA: 0,
          halfTimeScoreB: 0,
          fullTimeScoreA: 0,
          fullTimeScoreB: 0,
        },
      });

      // Create player entries for Team A
      const teamAData = teamAPlayers.map((p) => ({
        footballMatchDataId: matchData.id,
        playerName: p.name.trim(),
        playerId: p.playerId || null,
        team: 'A',
        isStarting: p.isStarting !== false, // default true
        goals: 0,
        assists: 0,
        shotsOnTarget: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0,
      }));

      // Create player entries for Team B
      const teamBData = teamBPlayers.map((p) => ({
        footballMatchDataId: matchData.id,
        playerName: p.name.trim(),
        playerId: p.playerId || null,
        team: 'B',
        isStarting: p.isStarting !== false,
        goals: 0,
        assists: 0,
        shotsOnTarget: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0,
      }));

      await tx.footballPlayerEntry.createMany({
        data: [...teamAData, ...teamBData],
      });

      // Update tournament status to IN_PROGRESS if UPCOMING
      if (match.tournament && match.tournament.status === 'UPCOMING') {
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return matchData;
    });

    // Fetch full match data with players
    const fullMatchData = await prisma.footballMatchData.findUnique({
      where: { id: footballMatch.id },
      include: {
        players: { orderBy: [{ team: 'asc' }, { isStarting: 'desc' }] },
      },
    });

    return NextResponse.json(
      { success: true, footballMatch: fullMatchData },
      { status: 201 },
    );
  } catch (err) {
    console.error('[football/setup] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
