import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/matches/[matchId]/football/live — lightweight live score endpoint
 *
 * Returns: current score, match period, minute, recent events (last 10),
 * team lineups with current stats, cards summary.
 *
 * Public read — no auth required (spectators can poll this).
 */
export async function GET(req, { params }) {
  try {
    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        teamA: true,
        teamB: true,
        scoreA: true,
        scoreB: true,
        completed: true,
        isStandalone: true,
        sportType: true,
        tournament: {
          select: { sportType: true },
        },
        footballMatchData: {
          include: {
            players: {
              select: {
                id: true,
                playerName: true,
                playerId: true,
                team: true,
                isStarting: true,
                minuteSubbedIn: true,
                minuteSubbedOut: true,
                goals: true,
                assists: true,
                yellowCards: true,
                redCards: true,
                shotsOnTarget: true,
                fouls: true,
                minutesPlayed: true,
              },
              orderBy: [{ team: 'asc' }, { isStarting: 'desc' }],
            },
            events: {
              select: {
                id: true,
                eventType: true,
                minute: true,
                addedTime: true,
                playerName: true,
                assistPlayerName: true,
                team: true,
                description: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
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

    if (!match.footballMatchData) {
      return NextResponse.json(
        { error: 'Football match has not been set up yet' },
        { status: 400 },
      );
    }

    const fmd = match.footballMatchData;

    // Build cards summary
    const cardsSummary = {
      teamA: { yellow: 0, red: 0, players: [] },
      teamB: { yellow: 0, red: 0, players: [] },
    };

    for (const player of fmd.players) {
      const teamKey = player.team === 'A' ? 'teamA' : 'teamB';
      if (player.yellowCards > 0 || player.redCards > 0) {
        cardsSummary[teamKey].players.push({
          name: player.playerName,
          yellowCards: player.yellowCards,
          redCards: player.redCards,
        });
      }
      cardsSummary[teamKey].yellow += player.yellowCards;
      cardsSummary[teamKey].red += player.redCards;
    }

    // Determine last event minute for "current minute" estimate
    const lastEvent = fmd.events.length > 0 ? fmd.events[0] : null;
    const lastMinute = lastEvent
      ? lastEvent.minute + (lastEvent.addedTime || 0)
      : 0;

    return NextResponse.json({
      matchId: match.id,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      completed: match.completed,
      status: fmd.status,
      periodStartedAt: fmd.periodStartedAt,
      halfDuration: fmd.halfDuration,
      halfTimeScoreA: fmd.halfTimeScoreA,
      halfTimeScoreB: fmd.halfTimeScoreB,
      fullTimeScoreA: fmd.fullTimeScoreA,
      fullTimeScoreB: fmd.fullTimeScoreB,
      extraTimeScoreA: fmd.extraTimeScoreA,
      extraTimeScoreB: fmd.extraTimeScoreB,
      penaltyScoreA: fmd.penaltyScoreA,
      penaltyScoreB: fmd.penaltyScoreB,
      lastMinute,
      recentEvents: fmd.events,
      players: fmd.players,
      cardsSummary,
    });
  } catch (err) {
    console.error('[football/live] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
