import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/matches/[matchId]/football — full football match data endpoint
 *
 * Returns: match data, both team lineups with all stats, all events sorted
 * chronologically, half-wise scores, cards summary, substitutions.
 *
 * Public read — no auth required.
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
        date: true,
        completed: true,
        isStandalone: true,
        sportType: true,
        createdByUserId: true,
        tournament: {
          select: {
            id: true,
            name: true,
            sportType: true,
            clubId: true,
          },
        },
        footballMatchData: {
          include: {
            players: {
              orderBy: [{ team: 'asc' }, { isStarting: 'desc' }],
            },
            events: {
              orderBy: { minute: 'asc' },
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
      return NextResponse.json({
        match: {
          id: match.id,
          teamA: match.teamA,
          teamB: match.teamB,
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          date: match.date,
          completed: match.completed,
          isStandalone: match.isStandalone,
          tournament: match.tournament,
        },
        footballData: null,
      });
    }

    const fmd = match.footballMatchData;

    // ── Separate players by team ──
    const teamAPlayers = fmd.players.filter((p) => p.team === 'A');
    const teamBPlayers = fmd.players.filter((p) => p.team === 'B');

    // ── Cards summary ──
    const cardsSummary = {
      teamA: { yellow: 0, red: 0, cards: [] },
      teamB: { yellow: 0, red: 0, cards: [] },
    };

    for (const player of fmd.players) {
      const teamKey = player.team === 'A' ? 'teamA' : 'teamB';
      cardsSummary[teamKey].yellow += player.yellowCards;
      cardsSummary[teamKey].red += player.redCards;
      if (player.yellowCards > 0 || player.redCards > 0) {
        cardsSummary[teamKey].cards.push({
          playerName: player.playerName,
          playerId: player.playerId,
          yellowCards: player.yellowCards,
          redCards: player.redCards,
        });
      }
    }

    // ── Card events with minutes ──
    const cardEvents = fmd.events
      .filter((e) => ['YELLOW_CARD', 'RED_CARD'].includes(e.eventType))
      .map((e) => ({
        eventType: e.eventType,
        minute: e.minute,
        addedTime: e.addedTime,
        playerName: e.playerName,
        team: e.team,
        description: e.description,
      }));

    // ── Substitutions ──
    const substitutions = fmd.events
      .filter((e) => e.eventType === 'SUBSTITUTION')
      .map((e) => ({
        minute: e.minute,
        addedTime: e.addedTime,
        playerOut: e.playerName,
        playerIn: e.description?.replace('Substitution: ', '') || 'Unknown',
        team: e.team,
      }));

    // Build substitutions from player entries (more reliable)
    const subEvents = [];
    for (const player of fmd.players) {
      if (!player.isStarting && player.minuteSubbedIn != null) {
        subEvents.push({
          minute: player.minuteSubbedIn,
          playerIn: player.playerName,
          team: player.team,
        });
      }
      if (player.minuteSubbedOut != null) {
        subEvents.push({
          minute: player.minuteSubbedOut,
          playerOut: player.playerName,
          team: player.team,
        });
      }
    }

    // ── Match stats summary (team-level aggregates) ──
    const matchStats = {
      teamA: {
        goals: fmd.players
          .filter((p) => p.team === 'A')
          .reduce((s, p) => s + p.goals, 0),
        shotsOnTarget: fmd.players
          .filter((p) => p.team === 'A')
          .reduce((s, p) => s + p.shotsOnTarget, 0),
        fouls: fmd.players
          .filter((p) => p.team === 'A')
          .reduce((s, p) => s + p.fouls, 0),
        yellowCards: cardsSummary.teamA.yellow,
        redCards: cardsSummary.teamA.red,
        corners: fmd.events.filter(
          (e) => e.eventType === 'CORNER' && e.team === 'A',
        ).length,
        offsides: fmd.events.filter(
          (e) => e.eventType === 'OFFSIDE' && e.team === 'A',
        ).length,
      },
      teamB: {
        goals: fmd.players
          .filter((p) => p.team === 'B')
          .reduce((s, p) => s + p.goals, 0),
        shotsOnTarget: fmd.players
          .filter((p) => p.team === 'B')
          .reduce((s, p) => s + p.shotsOnTarget, 0),
        fouls: fmd.players
          .filter((p) => p.team === 'B')
          .reduce((s, p) => s + p.fouls, 0),
        yellowCards: cardsSummary.teamB.yellow,
        redCards: cardsSummary.teamB.red,
        corners: fmd.events.filter(
          (e) => e.eventType === 'CORNER' && e.team === 'B',
        ).length,
        offsides: fmd.events.filter(
          (e) => e.eventType === 'OFFSIDE' && e.team === 'B',
        ).length,
      },
    };

    // ── Goal scorers ──
    const goalEvents = fmd.events
      .filter((e) =>
        ['GOAL', 'OWN_GOAL', 'PENALTY_SCORED'].includes(e.eventType),
      )
      .map((e) => ({
        eventType: e.eventType,
        minute: e.minute,
        addedTime: e.addedTime,
        playerName: e.playerName,
        assistPlayerName: e.assistPlayerName,
        team: e.team,
        description: e.description,
      }));

    // ── Half-wise scores ──
    const scores = {
      halfTime: {
        teamA: fmd.halfTimeScoreA,
        teamB: fmd.halfTimeScoreB,
      },
      fullTime: {
        teamA: fmd.fullTimeScoreA,
        teamB: fmd.fullTimeScoreB,
      },
      extraTime: fmd.extraTime
        ? {
            teamA: fmd.extraTimeScoreA,
            teamB: fmd.extraTimeScoreB,
          }
        : null,
      penalties: fmd.penaltyShootout
        ? {
            teamA: fmd.penaltyScoreA,
            teamB: fmd.penaltyScoreB,
          }
        : null,
      total: {
        teamA: match.scoreA,
        teamB: match.scoreB,
      },
    };

    return NextResponse.json({
      match: {
        id: match.id,
        teamA: match.teamA,
        teamB: match.teamB,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        date: match.date,
        completed: match.completed,
        isStandalone: match.isStandalone,
        tournament: match.tournament,
      },
      footballData: {
        id: fmd.id,
        status: fmd.status,
        halfDuration: fmd.halfDuration,
        extraTime: fmd.extraTime,
        penaltyShootout: fmd.penaltyShootout,
        scores,
        teamAPlayers,
        teamBPlayers,
        events: fmd.events,
        goalEvents,
        cardEvents,
        cardsSummary,
        substitutions: subEvents,
        matchStats,
        createdAt: fmd.createdAt,
        updatedAt: fmd.updatedAt,
      },
    });
  } catch (err) {
    console.error('[football] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
