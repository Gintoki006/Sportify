import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';
import { isTeamSport } from '@/lib/sportMetrics';

/**
 * POST /api/matches/[matchId]/football/status — change match period
 *
 * Body: {
 *   status: 'FIRST_HALF' | 'HALF_TIME' | 'SECOND_HALF' | 'FULL_TIME' |
 *           'EXTRA_TIME_FIRST' | 'EXTRA_TIME_SECOND' | 'PENALTIES' | 'COMPLETED'
 * }
 *
 * Handles period transitions and match completion with bracket advancement,
 * per-player stat sync, and goal auto-progression.
 */

const VALID_TRANSITIONS = {
  NOT_STARTED: ['FIRST_HALF'],
  FIRST_HALF: ['HALF_TIME'],
  HALF_TIME: ['SECOND_HALF'],
  SECOND_HALF: ['FULL_TIME'],
  FULL_TIME: ['EXTRA_TIME_FIRST', 'COMPLETED'],
  EXTRA_TIME_FIRST: ['EXTRA_TIME_SECOND'],
  EXTRA_TIME_SECOND: ['PENALTIES', 'COMPLETED'],
  PENALTIES: ['COMPLETED'],
};

export async function POST(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: 'status is required' },
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
            events: { orderBy: { minute: 'asc' } },
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

    // ── Validate transition ──
    const allowedTransitions = VALID_TRANSITIONS[fmd.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${fmd.status} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
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
          { error: 'Only the match creator can change match status' },
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
          { error: 'Only Admins and Hosts can change match status' },
          { status: 403 },
        );
      }
    }

    // ── Handle transition ──
    let matchCompleted = false;
    let advancedNextMatch = null;
    let newTournamentStatus = null;
    let promptExtraTime = false;
    let statsSynced = 0;

    const result = await prisma.$transaction(async (tx) => {
      // ── HALF_TIME: snapshot first half scores into halftime fields ──
      if (newStatus === 'HALF_TIME') {
        // halfTimeScoreA/B are already being updated in real-time by event recording
        // Just update status — clear periodStartedAt (not an active period)
        await tx.footballMatchData.update({
          where: { id: fmd.id },
          data: { status: 'HALF_TIME', periodStartedAt: null },
        });
      }

      // ── FULL_TIME: check if scores are tied for tournament knockout ──
      else if (newStatus === 'FULL_TIME') {
        // Calculate full-time scores (first half + second half goals)
        const fullScoreA = fmd.halfTimeScoreA + fmd.fullTimeScoreA;
        const fullScoreB = fmd.halfTimeScoreB + fmd.fullTimeScoreB;

        await tx.footballMatchData.update({
          where: { id: fmd.id },
          data: {
            status: 'FULL_TIME',
            fullTimeScoreA: fullScoreA,
            fullTimeScoreB: fullScoreB,
            periodStartedAt: null,
          },
        });

        // If tournament match and scores are tied, prompt for extra time
        if (match.tournament && fullScoreA === fullScoreB) {
          promptExtraTime = true;
        }
      }

      // ── COMPLETED: finalize the match ──
      else if (newStatus === 'COMPLETED') {
        // Determine final scores based on current state
        let finalScoreA, finalScoreB;

        if (fmd.status === 'PENALTIES') {
          // After penalties — full-time score stays, penalty winner advances
          finalScoreA = fmd.fullTimeScoreA;
          finalScoreB = fmd.fullTimeScoreB;
        } else if (fmd.status === 'EXTRA_TIME_SECOND') {
          // After extra time
          finalScoreA = fmd.fullTimeScoreA + (fmd.extraTimeScoreA || 0);
          finalScoreB = fmd.fullTimeScoreB + (fmd.extraTimeScoreB || 0);
        } else {
          // After regular time (FULL_TIME → COMPLETED)
          // fullTimeScoreA/B was already set to the total (HT + 2nd half) during the FULL_TIME transition
          finalScoreA = fmd.fullTimeScoreA;
          finalScoreB = fmd.fullTimeScoreB;
        }

        // Determine winner
        let winner = null;
        if (fmd.status === 'PENALTIES') {
          // Penalty winner
          const penA = fmd.penaltyScoreA || 0;
          const penB = fmd.penaltyScoreB || 0;
          winner = penA > penB ? match.teamA : penB > penA ? match.teamB : null;
        } else if (finalScoreA !== finalScoreB) {
          winner = finalScoreA > finalScoreB ? match.teamA : match.teamB;
        }

        // Update football match data
        await tx.footballMatchData.update({
          where: { id: fmd.id },
          data: { status: 'COMPLETED', periodStartedAt: null },
        });

        // Update Match record
        await tx.match.update({
          where: { id: matchId },
          data: {
            scoreA: finalScoreA,
            scoreB: finalScoreB,
            completed: true,
          },
        });
        matchCompleted = true;

        // ── Tournament bracket advancement ──
        if (match.tournament && winner) {
          const allMatches = match.tournament.matches;
          const totalRounds = Math.max(...allMatches.map((m) => m.round));
          const currentRound = match.round;

          if (currentRound < totalRounds) {
            const roundMatches = allMatches.filter(
              (m) => m.round === currentRound,
            );
            const matchIndex = roundMatches.findIndex((m) => m.id === matchId);
            const nextRoundMatchIndex = Math.floor(matchIndex / 2);
            const nextRoundMatches = allMatches.filter(
              (m) => m.round === currentRound + 1,
            );

            if (nextRoundMatches[nextRoundMatchIndex]) {
              const nextMatch = nextRoundMatches[nextRoundMatchIndex];
              const field = matchIndex % 2 === 0 ? 'teamA' : 'teamB';
              // Football is a team sport — don't propagate playerAId/playerBId
              const updated = await tx.match.update({
                where: { id: nextMatch.id },
                data: { [field]: winner },
              });
              advancedNextMatch = {
                id: updated.id,
                teamA: updated.teamA,
                teamB: updated.teamB,
              };
            }
          }

          // Update tournament status
          if (currentRound === totalRounds) {
            await tx.tournament.update({
              where: { id: match.tournamentId },
              data: { status: 'COMPLETED' },
            });
            newTournamentStatus = 'COMPLETED';
          }
        }

        // ── Per-player stat sync ──
        const statSource = match.isStandalone ? 'STANDALONE' : 'TOURNAMENT';
        const players = fmd.players;
        const events = fmd.events || [];

        // Calculate minutesPlayed for each player
        const halfDur = fmd.halfDuration || 45;
        const totalRegularMinutes = halfDur * 2;

        // Pre-compute per-player corners and offsides from events
        const playerCorners = {};
        const playerOffsides = {};
        for (const ev of events) {
          if (ev.eventType === 'CORNER' && ev.playerId) {
            playerCorners[ev.playerId] = (playerCorners[ev.playerId] || 0) + 1;
          }
          if (ev.eventType === 'OFFSIDE' && ev.playerId) {
            playerOffsides[ev.playerId] =
              (playerOffsides[ev.playerId] || 0) + 1;
          }
        }

        // Determine clean sheet eligibility (team conceded 0 goals)
        const teamAConceded = finalScoreB; // goals conceded by team A = opponent's score
        const teamBConceded = finalScoreA;

        for (const player of players) {
          // Calculate minutes played
          const startMin = player.isStarting ? 0 : player.minuteSubbedIn || 0;
          const endMin = player.minuteSubbedOut || totalRegularMinutes;
          const minutesPlayed = Math.max(0, endMin - startMin);

          // Update minutesPlayed on the player entry
          await tx.footballPlayerEntry.update({
            where: { id: player.id },
            data: { minutesPlayed },
          });

          // Skip stat sync for players without a linked userId
          if (!player.playerId) continue;

          // Check if stat already synced for this match+player
          const existing = await tx.statEntry.findFirst({
            where: {
              matchId,
              sportProfile: { userId: player.playerId, sportType: 'FOOTBALL' },
            },
          });
          if (existing) continue;

          // Find sport profile
          const profile = await tx.sportProfile.findUnique({
            where: {
              userId_sportType: {
                userId: player.playerId,
                sportType: 'FOOTBALL',
              },
            },
            select: { id: true },
          });
          if (!profile) continue;

          const opponent = player.team === 'A' ? match.teamB : match.teamA;
          const teamScore = player.team === 'A' ? finalScoreA : finalScoreB;
          const oppScore = player.team === 'A' ? finalScoreB : finalScoreA;
          const isWinner = teamScore > oppScore;
          const conceded = player.team === 'A' ? teamAConceded : teamBConceded;
          const cleanSheet = conceded === 0 && minutesPlayed > 0 ? 1 : 0;

          const metrics = {
            goals: player.goals,
            assists: player.assists,
            shots_on_target: player.shotsOnTarget,
            shots_taken: 0,
            fouls: player.fouls,
            yellow_cards: player.yellowCards,
            red_cards: player.redCards,
            clean_sheets: cleanSheet,
            minutes_played: minutesPlayed,
            corners_won: player.playerId
              ? playerCorners[player.playerId] || 0
              : 0,
            offsides: player.playerId
              ? playerOffsides[player.playerId] || 0
              : 0,
            match_result: isWinner ? 1 : 0,
          };

          await tx.statEntry.create({
            data: {
              sportProfileId: profile.id,
              date: match.date || new Date(),
              opponent,
              notes: `Football match: ${match.teamA} vs ${match.teamB} (${finalScoreA}-${finalScoreB})`,
              metrics,
              source: statSource,
              matchId,
            },
          });
          statsSynced++;

          // ── Auto-progress goals ──
          const goals = await tx.goal.findMany({
            where: { sportProfileId: profile.id, completed: false },
          });

          for (const goal of goals) {
            const metricValue = metrics[goal.metric];
            if (metricValue !== undefined && typeof metricValue === 'number') {
              const newCurrent = goal.current + metricValue;
              await tx.goal.update({
                where: { id: goal.id },
                data: {
                  current: newCurrent,
                  completed: newCurrent >= goal.target,
                },
              });
            }
          }
        }
      }

      // ── Other transitions ──
      else {
        const extraTimeData = {};
        if (newStatus === 'EXTRA_TIME_FIRST') {
          extraTimeData.extraTime = true;
          extraTimeData.extraTimeScoreA = 0;
          extraTimeData.extraTimeScoreB = 0;
        }
        if (newStatus === 'PENALTIES') {
          extraTimeData.penaltyShootout = true;
          extraTimeData.penaltyScoreA = 0;
          extraTimeData.penaltyScoreB = 0;
        }

        // Active periods get periodStartedAt set to now
        const isActivePeriod = [
          'FIRST_HALF',
          'SECOND_HALF',
          'EXTRA_TIME_FIRST',
          'EXTRA_TIME_SECOND',
          'PENALTIES',
        ].includes(newStatus);
        await tx.footballMatchData.update({
          where: { id: fmd.id },
          data: {
            status: newStatus,
            ...extraTimeData,
            periodStartedAt: isActivePeriod ? new Date() : null,
          },
        });
      }

      // Fetch updated data
      const updatedMatchData = await tx.footballMatchData.findUnique({
        where: { id: fmd.id },
        include: {
          players: { orderBy: [{ team: 'asc' }, { isStarting: 'desc' }] },
          events: { orderBy: { minute: 'asc' } },
        },
      });

      // Fetch updated match-level scores
      const updatedMatch = await tx.match.findUnique({
        where: { id: matchId },
        select: { scoreA: true, scoreB: true },
      });

      return {
        matchData: updatedMatchData,
        matchScoreA: updatedMatch?.scoreA ?? 0,
        matchScoreB: updatedMatch?.scoreB ?? 0,
      };
    });

    return NextResponse.json({
      success: true,
      matchData: result.matchData,
      matchScoreA: result.matchScoreA,
      matchScoreB: result.matchScoreB,
      matchCompleted,
      advancedNextMatch,
      newTournamentStatus,
      promptExtraTime,
      statsSynced,
    });
  } catch (err) {
    console.error('[football/status] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
