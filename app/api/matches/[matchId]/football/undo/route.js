import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * PUT /api/matches/[matchId]/football/undo — undo the last recorded football event
 *
 * Reverses all side effects (goal count, card count, score, substitutions).
 * Cannot undo period-change events (KICK_OFF, HALF_TIME, FULL_TIME).
 * Returns updated match state after undo.
 */

const PERIOD_EVENTS = ['KICK_OFF', 'HALF_TIME', 'FULL_TIME'];

export async function PUT(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;

    // ── Load match + football data ──
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            club: { select: { id: true, adminUserId: true } },
          },
        },
        footballMatchData: {
          include: {
            players: true,
            events: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (!match.footballMatchData) {
      return NextResponse.json(
        { error: 'Football match has not been set up yet' },
        { status: 400 },
      );
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

    const fmd = match.footballMatchData;

    if (fmd.events.length === 0) {
      return NextResponse.json({ error: 'No events to undo' }, { status: 400 });
    }

    // Find the last event (most recent by createdAt — already sorted desc)
    let lastEvent = fmd.events[0];

    // Cannot undo period-change events
    if (PERIOD_EVENTS.includes(lastEvent.eventType)) {
      return NextResponse.json(
        {
          error: `Cannot undo ${lastEvent.eventType} events. These are period markers.`,
        },
        { status: 400 },
      );
    }

    // If last event is an auto red card (from 2nd yellow), we need to undo both
    // The auto red card description contains "automatic red card"
    const isAutoRedCard =
      lastEvent.eventType === 'RED_CARD' &&
      lastEvent.description?.includes('automatic red card');

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
          { error: 'Only the match creator can undo events' },
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
          { error: 'Only Admins and Hosts can undo events' },
          { status: 403 },
        );
      }
    }

    // ── Undo in transaction ──
    const result = await prisma.$transaction(async (tx) => {
      // If this is an auto red card, find the preceding yellow card event
      let yellowCardEvent = null;
      if (isAutoRedCard && fmd.events.length >= 2) {
        yellowCardEvent = fmd.events[1]; // The 2nd most recent event
      }

      // Determine the match status at time of event recording
      // We need this to know which score field to decrement
      // The fmd.status is the *current* status
      const currentStatus = fmd.status;

      // Reverse the last event
      await reverseEvent(tx, fmd, lastEvent, matchId, currentStatus);

      // Delete the event record
      await tx.footballEvent.delete({ where: { id: lastEvent.id } });

      // If auto red card, also reverse and delete the yellow card that triggered it
      if (isAutoRedCard && yellowCardEvent) {
        await reverseEvent(tx, fmd, yellowCardEvent, matchId, currentStatus);
        await tx.footballEvent.delete({ where: { id: yellowCardEvent.id } });
      }

      // Fetch updated match data
      const updatedMatchData = await tx.footballMatchData.findUnique({
        where: { id: fmd.id },
        include: {
          players: { orderBy: [{ team: 'asc' }, { isStarting: 'desc' }] },
          events: { orderBy: { createdAt: 'desc' } },
        },
      });

      const updatedMatch = await tx.match.findUnique({
        where: { id: matchId },
        select: { scoreA: true, scoreB: true },
      });

      return { matchData: updatedMatchData, match: updatedMatch };
    });

    return NextResponse.json({
      success: true,
      undoneEvent: lastEvent,
      matchData: result.matchData,
      matchScore: result.match,
    });
  } catch (err) {
    console.error('[football/undo] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── Reverse a single event's side effects ──
async function reverseEvent(tx, fmd, event, matchId, currentStatus) {
  const { eventType, playerName, team, assistPlayerName } = event;

  switch (eventType) {
    case 'GOAL': {
      // Decrement scorer's goals
      await decrementPlayerStat(tx, fmd.id, playerName, team, 'goals');
      // Decrement assister's assists
      if (assistPlayerName) {
        await decrementPlayerStat(
          tx,
          fmd.id,
          assistPlayerName,
          team,
          'assists',
        );
      }
      // Decrement period score and match score
      const scoreField = getScoreFieldForUndo(currentStatus, team);
      const totalField = team === 'A' ? 'scoreA' : 'scoreB';
      await tx.footballMatchData.update({
        where: { id: fmd.id },
        data: { [scoreField]: { decrement: 1 } },
      });
      await tx.match.update({
        where: { id: matchId },
        data: { [totalField]: { decrement: 1 } },
      });
      break;
    }

    case 'OWN_GOAL': {
      const opposingTeam = team === 'A' ? 'B' : 'A';
      const scoreField = getScoreFieldForUndo(currentStatus, opposingTeam);
      const totalField = opposingTeam === 'A' ? 'scoreA' : 'scoreB';
      await tx.footballMatchData.update({
        where: { id: fmd.id },
        data: { [scoreField]: { decrement: 1 } },
      });
      await tx.match.update({
        where: { id: matchId },
        data: { [totalField]: { decrement: 1 } },
      });
      break;
    }

    case 'YELLOW_CARD': {
      await decrementPlayerStat(tx, fmd.id, playerName, team, 'yellowCards');
      break;
    }

    case 'RED_CARD': {
      await decrementPlayerStat(tx, fmd.id, playerName, team, 'redCards');
      break;
    }

    case 'SUBSTITUTION': {
      // Reverse: clear the outgoing player's minuteSubbedOut
      await tx.footballPlayerEntry.updateMany({
        where: {
          footballMatchDataId: fmd.id,
          playerName: playerName.trim(),
          team,
          minuteSubbedOut: event.minute,
        },
        data: { minuteSubbedOut: null },
      });

      // Find the substituted-in player entry
      // The event description or the sub player can be found by checking
      // for a player entry that was subbed in at this minute
      const subInEntries = await tx.footballPlayerEntry.findMany({
        where: {
          footballMatchDataId: fmd.id,
          team,
          isStarting: false,
          minuteSubbedIn: event.minute,
        },
      });

      for (const subEntry of subInEntries) {
        // If this sub had no stats, delete the entry entirely
        if (
          subEntry.goals === 0 &&
          subEntry.assists === 0 &&
          subEntry.shotsOnTarget === 0 &&
          subEntry.fouls === 0 &&
          subEntry.yellowCards === 0 &&
          subEntry.redCards === 0
        ) {
          await tx.footballPlayerEntry.delete({ where: { id: subEntry.id } });
        } else {
          // Has stats — just clear the sub-in minute
          await tx.footballPlayerEntry.update({
            where: { id: subEntry.id },
            data: { minuteSubbedIn: null },
          });
        }
      }
      break;
    }

    case 'FOUL': {
      await decrementPlayerStat(tx, fmd.id, playerName, team, 'fouls');
      break;
    }

    case 'PENALTY_SCORED': {
      if (currentStatus === 'PENALTIES') {
        const penaltyField = team === 'A' ? 'penaltyScoreA' : 'penaltyScoreB';
        await tx.footballMatchData.update({
          where: { id: fmd.id },
          data: { [penaltyField]: { decrement: 1 } },
        });
      } else {
        // Regular penalty goal — reverse like a goal
        await decrementPlayerStat(tx, fmd.id, playerName, team, 'goals');
        const scoreField = getScoreFieldForUndo(currentStatus, team);
        const totalField = team === 'A' ? 'scoreA' : 'scoreB';
        await tx.footballMatchData.update({
          where: { id: fmd.id },
          data: { [scoreField]: { decrement: 1 } },
        });
        await tx.match.update({
          where: { id: matchId },
          data: { [totalField]: { decrement: 1 } },
        });
      }
      break;
    }

    case 'PENALTY_MISSED':
    case 'CORNER':
    case 'PENALTY_KICK':
    case 'OFFSIDE': {
      // No stat side effects to reverse
      break;
    }

    default:
      break;
  }
}

// ── Helper: decrement a player stat field (don't go below 0) ──
async function decrementPlayerStat(
  tx,
  footballMatchDataId,
  playerName,
  team,
  field,
) {
  const players = await tx.footballPlayerEntry.findMany({
    where: {
      footballMatchDataId,
      playerName: playerName.trim(),
      team,
    },
  });

  if (players.length === 0) return;

  const player = players[players.length - 1];
  const currentVal = player[field] || 0;
  await tx.footballPlayerEntry.update({
    where: { id: player.id },
    data: { [field]: Math.max(0, currentVal - 1) },
  });
}

// ── Helper: determine which score field to decrement based on current match period ──
function getScoreFieldForUndo(status, team) {
  const suffix = team === 'A' ? 'A' : 'B';
  switch (status) {
    case 'FIRST_HALF':
      return `halfTimeScore${suffix}`;
    case 'SECOND_HALF':
    case 'FULL_TIME':
      return `fullTimeScore${suffix}`;
    case 'EXTRA_TIME_FIRST':
    case 'EXTRA_TIME_SECOND':
      return `extraTimeScore${suffix}`;
    case 'PENALTIES':
      return `penaltyScore${suffix}`;
    case 'HALF_TIME':
      // During half time, last event was in first half
      return `halfTimeScore${suffix}`;
    default:
      return `fullTimeScore${suffix}`;
  }
}
