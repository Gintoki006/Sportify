import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * POST /api/matches/[matchId]/football/event — record a football match event
 *
 * Body: {
 *   eventType: FootballEventType,
 *   minute: number,
 *   addedTime?: number,
 *   playerName: string,
 *   playerId?: string,
 *   assistPlayerName?: string,
 *   assistPlayerId?: string,
 *   team: 'A' | 'B',
 *   description?: string,
 *   // For SUBSTITUTION:
 *   subInPlayerName?: string,
 *   subInPlayerId?: string,
 * }
 */

const VALID_EVENT_TYPES = [
  'GOAL',
  'YELLOW_CARD',
  'RED_CARD',
  'SUBSTITUTION',
  'CORNER',
  'PENALTY_KICK',
  'PENALTY_SCORED',
  'PENALTY_MISSED',
  'OWN_GOAL',
  'OFFSIDE',
  'FOUL',
  'HALF_TIME',
  'FULL_TIME',
  'KICK_OFF',
];

const ACTIVE_PERIODS = [
  'FIRST_HALF',
  'SECOND_HALF',
  'EXTRA_TIME_FIRST',
  'EXTRA_TIME_SECOND',
  'PENALTIES',
];

export async function POST(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    const body = await req.json();
    const {
      eventType,
      minute,
      addedTime,
      playerName,
      playerId,
      assistPlayerName,
      assistPlayerId,
      team,
      description,
      subInPlayerName,
      subInPlayerId,
    } = body;

    // ── Validation ──
    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json(
        {
          error: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (
      minute === undefined ||
      minute === null ||
      typeof minute !== 'number' ||
      minute < 0
    ) {
      return NextResponse.json(
        { error: 'minute is required and must be a non-negative number' },
        { status: 400 },
      );
    }

    if (!team || !['A', 'B'].includes(team)) {
      return NextResponse.json(
        { error: 'team must be "A" or "B"' },
        { status: 400 },
      );
    }

    if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
      return NextResponse.json(
        { error: 'playerName is required' },
        { status: 400 },
      );
    }

    // ── Load match + football data ──
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            club: { select: { id: true, adminUserId: true } },
            matches: true,
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
        {
          error:
            'Football match has not been set up yet. Call /football/setup first.',
        },
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

    // Match must be in an active period to record events (except KICK_OFF which starts it)
    if (eventType !== 'KICK_OFF' && !ACTIVE_PERIODS.includes(fmd.status)) {
      return NextResponse.json(
        {
          error: `Cannot record events when match status is ${fmd.status}. Start the match first.`,
        },
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
          { error: 'Only the match creator can record events' },
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
          { error: 'Only Admins and Hosts can record events' },
          { status: 403 },
        );
      }
    }

    // ── Process event in transaction ──
    const result = await prisma.$transaction(async (tx) => {
      let autoRedCard = null;

      // Create the event record
      const event = await tx.footballEvent.create({
        data: {
          footballMatchDataId: fmd.id,
          eventType,
          minute,
          addedTime: addedTime || null,
          playerName: playerName.trim(),
          playerId: playerId || null,
          assistPlayerName: assistPlayerName?.trim() || null,
          assistPlayerId: assistPlayerId || null,
          team,
          description: description || null,
        },
      });

      // ── Handle event side effects ──
      switch (eventType) {
        case 'GOAL': {
          // Increment scorer's goals
          await incrementPlayerStat(tx, fmd.id, playerName, team, 'goals', 1);
          // Increment assister's assists
          if (assistPlayerName) {
            await incrementPlayerStat(
              tx,
              fmd.id,
              assistPlayerName,
              team,
              'assists',
              1,
            );
          }
          // Update match data score for the correct period
          const scoreField = getScoreField(fmd.status, team);
          const totalField = team === 'A' ? 'scoreA' : 'scoreB';
          await tx.footballMatchData.update({
            where: { id: fmd.id },
            data: { [scoreField]: { increment: 1 } },
          });
          // Update overall Match.scoreA/scoreB
          await tx.match.update({
            where: { id: matchId },
            data: { [totalField]: { increment: 1 } },
          });
          break;
        }

        case 'OWN_GOAL': {
          // Own goal: credited to opposing team's score
          const opposingTeam = team === 'A' ? 'B' : 'A';
          const scoreField = getScoreField(fmd.status, opposingTeam);
          const totalField = opposingTeam === 'A' ? 'scoreA' : 'scoreB';
          await tx.footballMatchData.update({
            where: { id: fmd.id },
            data: { [scoreField]: { increment: 1 } },
          });
          await tx.match.update({
            where: { id: matchId },
            data: { [totalField]: { increment: 1 } },
          });
          break;
        }

        case 'YELLOW_CARD': {
          const player = await incrementPlayerStat(
            tx,
            fmd.id,
            playerName,
            team,
            'yellowCards',
            1,
          );
          // If 2nd yellow → auto-create RED_CARD event
          if (player && player.yellowCards >= 2) {
            autoRedCard = await tx.footballEvent.create({
              data: {
                footballMatchDataId: fmd.id,
                eventType: 'RED_CARD',
                minute,
                addedTime: addedTime || null,
                playerName: playerName.trim(),
                playerId: playerId || null,
                team,
                description: 'Second yellow card — automatic red card',
              },
            });
            await incrementPlayerStat(
              tx,
              fmd.id,
              playerName,
              team,
              'redCards',
              1,
            );
          }
          break;
        }

        case 'RED_CARD': {
          await incrementPlayerStat(
            tx,
            fmd.id,
            playerName,
            team,
            'redCards',
            1,
          );
          break;
        }

        case 'SUBSTITUTION': {
          if (!subInPlayerName) {
            throw new Error(
              'subInPlayerName is required for SUBSTITUTION events',
            );
          }
          // Mark the outgoing player's sub-out minute
          await tx.footballPlayerEntry.updateMany({
            where: {
              footballMatchDataId: fmd.id,
              playerName: playerName.trim(),
              team,
              minuteSubbedOut: null,
            },
            data: { minuteSubbedOut: minute },
          });
          // Check if incoming player already exists (came on as sub before)
          const existingSub = await tx.footballPlayerEntry.findFirst({
            where: {
              footballMatchDataId: fmd.id,
              playerName: subInPlayerName.trim(),
              team,
            },
          });
          if (existingSub) {
            // Update existing entry
            await tx.footballPlayerEntry.update({
              where: { id: existingSub.id },
              data: { minuteSubbedIn: minute, minuteSubbedOut: null },
            });
          } else {
            // Create new player entry for the sub
            await tx.footballPlayerEntry.create({
              data: {
                footballMatchDataId: fmd.id,
                playerName: subInPlayerName.trim(),
                playerId: subInPlayerId || null,
                team,
                isStarting: false,
                minuteSubbedIn: minute,
              },
            });
          }
          break;
        }

        case 'FOUL': {
          await incrementPlayerStat(tx, fmd.id, playerName, team, 'fouls', 1);
          break;
        }

        case 'PENALTY_SCORED': {
          // For penalty shootout
          if (fmd.status === 'PENALTIES') {
            const penaltyField =
              team === 'A' ? 'penaltyScoreA' : 'penaltyScoreB';
            await tx.footballMatchData.update({
              where: { id: fmd.id },
              data: { [penaltyField]: { increment: 1 } },
            });
          } else {
            // Regular penalty goal during play — treated as a goal
            await incrementPlayerStat(tx, fmd.id, playerName, team, 'goals', 1);
            const scoreField = getScoreField(fmd.status, team);
            const totalField = team === 'A' ? 'scoreA' : 'scoreB';
            await tx.footballMatchData.update({
              where: { id: fmd.id },
              data: { [scoreField]: { increment: 1 } },
            });
            await tx.match.update({
              where: { id: matchId },
              data: { [totalField]: { increment: 1 } },
            });
          }
          break;
        }

        case 'PENALTY_MISSED': {
          // Just record the event, no score change
          break;
        }

        case 'KICK_OFF': {
          // Change status to FIRST_HALF if NOT_STARTED
          if (fmd.status === 'NOT_STARTED') {
            await tx.footballMatchData.update({
              where: { id: fmd.id },
              data: { status: 'FIRST_HALF' },
            });
            // Initialize Match scores to 0 if null
            await tx.match.update({
              where: { id: matchId },
              data: {
                scoreA: match.scoreA ?? 0,
                scoreB: match.scoreB ?? 0,
              },
            });
          }
          break;
        }

        case 'CORNER':
        case 'PENALTY_KICK':
        case 'OFFSIDE':
        case 'HALF_TIME':
        case 'FULL_TIME': {
          // These are informational/period events — no stat side effects
          // Period changes are handled via /football/status endpoint
          break;
        }

        default:
          break;
      }

      // Fetch updated match data
      const updatedMatchData = await tx.footballMatchData.findUnique({
        where: { id: fmd.id },
        include: {
          players: { orderBy: [{ team: 'asc' }, { isStarting: 'desc' }] },
        },
      });

      // Also fetch updated match-level scores
      const updatedMatch = await tx.match.findUnique({
        where: { id: matchId },
        select: { scoreA: true, scoreB: true },
      });

      return {
        event,
        autoRedCard,
        matchData: updatedMatchData,
        matchScoreA: updatedMatch?.scoreA ?? 0,
        matchScoreB: updatedMatch?.scoreB ?? 0,
      };
    });

    return NextResponse.json(
      {
        success: true,
        event: result.event,
        autoRedCard: result.autoRedCard,
        matchData: result.matchData,
        matchScoreA: result.matchScoreA,
        matchScoreB: result.matchScoreB,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[football/event] POST error:', err);
    const message = err.message || 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('required') ? 400 : 500 },
    );
  }
}

// ── Helper: increment a player stat field ──
async function incrementPlayerStat(
  tx,
  footballMatchDataId,
  playerName,
  team,
  field,
  amount,
) {
  const players = await tx.footballPlayerEntry.findMany({
    where: {
      footballMatchDataId,
      playerName: playerName.trim(),
      team,
    },
  });

  if (players.length === 0) return null;

  // Use the most recent entry for this player (handles subs)
  const player = players[players.length - 1];
  const updated = await tx.footballPlayerEntry.update({
    where: { id: player.id },
    data: { [field]: { increment: amount } },
  });

  return updated;
}

// ── Helper: determine which score field to update based on match period ──
function getScoreField(status, team) {
  const suffix = team === 'A' ? 'A' : 'B';
  switch (status) {
    case 'FIRST_HALF':
      return `halfTimeScore${suffix}`;
    case 'SECOND_HALF':
      return `fullTimeScore${suffix}`;
    case 'EXTRA_TIME_FIRST':
    case 'EXTRA_TIME_SECOND':
      return `extraTimeScore${suffix}`;
    case 'PENALTIES':
      return `penaltyScore${suffix}`;
    default:
      return `fullTimeScore${suffix}`;
  }
}
