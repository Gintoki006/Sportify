import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';
import { isTeamSport } from '@/lib/sportMetrics';
import { createBulkNotifications } from '@/lib/notifications';

/**
 * PUT /api/matches/[matchId]/score — submit match score (admin only)
 * Body: { scoreA, scoreB }
 *
 * This also:
 * - Advances the winner to the next round
 * - Auto-syncs stats to players who have matching sport profiles
 * - Checks for deduplication (no existing tournament entry for this match)
 * - Marks tournament COMPLETED if final match is done
 */
export async function PUT(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    const body = await req.json();
    const { scoreA, scoreB, playerStats } = body;

    if (scoreA === undefined || scoreB === undefined) {
      return NextResponse.json(
        { error: 'scoreA and scoreB are required' },
        { status: 400 },
      );
    }

    if (
      typeof scoreA !== 'number' ||
      typeof scoreB !== 'number' ||
      scoreA < 0 ||
      scoreB < 0 ||
      !Number.isInteger(scoreA) ||
      !Number.isInteger(scoreB)
    ) {
      return NextResponse.json(
        { error: 'Scores must be non-negative integers' },
        { status: 400 },
      );
    }

    if (scoreA === scoreB) {
      // Ties are only disallowed for tournament matches (bracket advancement needs a winner)
      // For standalone matches, ties are valid (football, basketball, volleyball, etc.)
      // We'll check after loading the match below
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: {
            club: { select: { id: true, adminUserId: true } },
            matches: { orderBy: [{ round: 'asc' }, { createdAt: 'asc' }] },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Reject ties for tournament matches (bracket advancement needs a winner)
    if (scoreA === scoreB && !match.isStandalone) {
      return NextResponse.json(
        {
          error:
            'Scores cannot be tied — a winner must be determined for tournament matches',
        },
        { status: 400 },
      );
    }

    if (match.teamA === 'TBD' || match.teamB === 'TBD') {
      return NextResponse.json(
        { error: 'Cannot score a match with undetermined teams' },
        { status: 400 },
      );
    }

    // Determine winner name and player ID (may be null for ties)
    const winnerIsA = scoreA > scoreB;
    const winner =
      scoreA === scoreB ? null : winnerIsA ? match.teamA : match.teamB;
    const winnerPlayerId =
      scoreA === scoreB ? null : winnerIsA ? match.playerAId : match.playerBId;

    // Auth check
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (match.isStandalone) {
      // Standalone: only creator can score
      if (match.createdByUserId !== dbUser.id) {
        return NextResponse.json(
          { error: 'Only the match creator can submit scores' },
          { status: 403 },
        );
      }
    } else {
      // Tournament: ADMIN or HOST
      const callerMembership = await prisma.clubMember.findUnique({
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
          : callerMembership?.role;
      if (!callerRole || !hasPermission(callerRole, 'enterScores')) {
        return NextResponse.json(
          { error: 'Only Admins and Hosts can submit scores' },
          { status: 403 },
        );
      }
    }

    // Determine sport context
    const sportType = match.isStandalone
      ? match.sportType
      : match.tournament.sportType;
    const statSource = match.isStandalone ? 'STANDALONE' : 'TOURNAMENT';
    const matchNotes = match.isStandalone
      ? 'Standalone Match'
      : `${match.tournament.name} — Round ${match.round}`;

    // Atomically update match score first
    const result = await prisma.match.updateMany({
      where: { id: matchId, completed: false },
      data: { scoreA, scoreB, completed: true },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Match already completed' },
        { status: 400 },
      );
    }

    // Advance winner and update tournament in a transaction
    let advancedNextMatch = null;
    let newTournamentStatus = null;

    await prisma.$transaction(async (tx) => {
      // ── Tournament bracket advancement (skip for standalone) ──
      if (match.tournament) {
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
            const playerField =
              matchIndex % 2 === 0 ? 'playerAId' : 'playerBId';
            const updateData = { [field]: winner };
            // Only propagate player IDs for individual sports
            if (winnerPlayerId && !isTeamSport(sportType)) {
              updateData[playerField] = winnerPlayerId;
            }
            const updated = await tx.match.update({
              where: { id: nextMatch.id },
              data: updateData,
            });
            advancedNextMatch = {
              id: updated.id,
              teamA: updated.teamA,
              teamB: updated.teamB,
              playerAId: updated.playerAId,
              playerBId: updated.playerBId,
            };
          }
        }

        // Check if tournament is complete (final match done)
        if (currentRound === totalRounds) {
          await tx.tournament.update({
            where: { id: match.tournamentId },
            data: { status: 'COMPLETED' },
          });
          newTournamentStatus = 'COMPLETED';
        } else if (match.tournament.status === 'UPCOMING') {
          await tx.tournament.update({
            where: { id: match.tournamentId },
            data: { status: 'IN_PROGRESS' },
          });
          newTournamentStatus = 'IN_PROGRESS';
        }
      }

      // Auto-sync stats to players
      // Primary: use playerAId / playerBId for direct linking
      // Fallback: name-match against club members (tournament matches only)
      const isTeam = isTeamSport(sportType);
      const playerIds = [match.playerAId, match.playerBId];
      const teamNames = [match.teamA, match.teamB];
      const teamScores = [scoreA, scoreB];

      const existingEntries = await tx.statEntry.findMany({
        where: { matchId },
        select: { sportProfileId: true },
      });
      const alreadySynced = new Set(
        existingEntries.map((e) => e.sportProfileId),
      );

      let _cachedClubMembers = null;

      async function getClubMembers() {
        if (_cachedClubMembers) return _cachedClubMembers;
        // Standalone matches have no club — return empty
        if (!match.tournament?.clubId) {
          _cachedClubMembers = [];
          return _cachedClubMembers;
        }
        _cachedClubMembers = await tx.clubMember.findMany({
          where: { clubId: match.tournament.clubId },
          include: {
            user: {
              include: {
                sportProfiles: {
                  where: { sportType },
                  select: { id: true },
                },
              },
            },
          },
        });
        return _cachedClubMembers;
      }

      // ── Per-player stat sync (team sports with playerStats payload) ──
      if (isTeam && Array.isArray(playerStats) && playerStats.length > 0) {
        for (const ps of playerStats) {
          if (!ps.name || !ps.metrics) continue;

          let sportProfileId = null;

          // If userId provided, look up sport profile directly
          if (ps.userId) {
            const profile = await tx.sportProfile.findUnique({
              where: { userId_sportType: { userId: ps.userId, sportType } },
              select: { id: true },
            });
            if (profile) sportProfileId = profile.id;
          }

          // Fallback: name-match against club members
          if (!sportProfileId) {
            const members = await getClubMembers();
            const member = members.find(
              (m) => m.user.name?.toLowerCase() === ps.name.toLowerCase(),
            );
            if (member && member.user.sportProfiles.length > 0) {
              sportProfileId = member.user.sportProfiles[0].id;
            }
          }

          if (!sportProfileId || alreadySynced.has(sportProfileId)) continue;
          alreadySynced.add(sportProfileId);

          const opponent = ps.team === 'A' ? teamNames[1] : teamNames[0];

          await tx.statEntry.create({
            data: {
              sportProfileId,
              date: match.date || new Date(),
              opponent,
              notes: matchNotes,
              metrics: ps.metrics,
              source: statSource,
              matchId,
            },
          });

          // Auto-progress goals
          const goals = await tx.goal.findMany({
            where: { sportProfileId, completed: false },
          });

          for (const goal of goals) {
            const metricValue = ps.metrics[goal.metric];
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
      } else {
        // ── Legacy team-level stat sync (individual sports or no playerStats) ──
        // Resolve sport profiles for each side
        const resolvedPlayers = []; // { sportProfileId, index }

        for (let i = 0; i < 2; i++) {
          let sportProfileId = null;

          if (playerIds[i]) {
            // Direct player ID linking — find sport profile by userId
            const profile = await tx.sportProfile.findUnique({
              where: {
                userId_sportType: {
                  userId: playerIds[i],
                  sportType,
                },
              },
              select: { id: true },
            });
            if (profile) {
              sportProfileId = profile.id;
            }
          }

          // Fallback: name-match against club members (legacy matches without playerIds)
          if (!sportProfileId && !playerIds[i]) {
            const members = await getClubMembers();
            const member = members.find(
              (m) => m.user.name?.toLowerCase() === teamNames[i].toLowerCase(),
            );
            if (member && member.user.sportProfiles.length > 0) {
              sportProfileId = member.user.sportProfiles[0].id;
            }
          }

          if (sportProfileId) {
            resolvedPlayers.push({ sportProfileId, index: i });
          }
        }

        // Create stat entries and advance goals for resolved players
        for (const { sportProfileId, index } of resolvedPlayers) {
          if (alreadySynced.has(sportProfileId)) continue;

          const score = teamScores[index];
          const metrics = buildTournamentMetrics(
            sportType,
            score,
            teamScores[1 - index],
            score > teamScores[1 - index],
          );

          await tx.statEntry.create({
            data: {
              sportProfileId,
              date: match.date || new Date(),
              opponent: teamNames[1 - index],
              notes: matchNotes,
              metrics,
              source: statSource,
              matchId,
            },
          });

          // Auto-progress goals
          const goals = await tx.goal.findMany({
            where: { sportProfileId, completed: false },
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
      } // end else (legacy team-level stat sync)
    });

    // ── Send notifications to linked/invited players ──
    try {
      const notifyUserIds = new Set();
      // Players directly linked to the match
      if (match.playerAId && match.playerAId !== dbUser.id)
        notifyUserIds.add(match.playerAId);
      if (match.playerBId && match.playerBId !== dbUser.id)
        notifyUserIds.add(match.playerBId);

      // Invited players (for standalone matches)
      if (match.isStandalone) {
        const invitedUsers = await prisma.matchInvite.findMany({
          where: { matchId, status: 'ACCEPTED' },
          select: { userId: true },
        });
        for (const inv of invitedUsers) {
          if (inv.userId !== dbUser.id) notifyUserIds.add(inv.userId);
        }
      }

      if (notifyUserIds.size > 0) {
        const matchLink = match.isStandalone
          ? `/dashboard/matches/${matchId}`
          : `/dashboard/clubs/${match.tournament?.clubId}`;
        const matchLabel = match.isStandalone
          ? 'Friendly Match'
          : `${match.tournament?.name || 'Tournament'} Match`;

        const notifications = [...notifyUserIds].map((uid) => ({
          userId: uid,
          type: 'MATCH_SCORED',
          title: 'Match Scored',
          message: `${matchLabel}: ${match.teamA} ${scoreA} — ${scoreB} ${match.teamB}. Your stats have been synced!`,
          linkUrl: matchLink,
          matchId,
        }));
        await createBulkNotifications(notifications);
      }
    } catch (notifErr) {
      console.error(
        '[matches/score] Notification error (non-fatal):',
        notifErr,
      );
    }

    return NextResponse.json({
      success: true,
      winner,
      scoreA,
      scoreB,
      nextMatch: advancedNextMatch,
      tournamentStatus: newTournamentStatus,
      playerStatsSynced: Array.isArray(playerStats) && playerStats.length > 0,
    });
  } catch (err) {
    console.error('[matches/score] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Build tournament-specific metrics based on sport type and match score
 */
function buildTournamentMetrics(sportType, ownScore, opponentScore, isWinner) {
  switch (sportType) {
    case 'FOOTBALL':
      return {
        goals: ownScore,
        assists: 0,
        shots_on_target: 0,
        shots_taken: 0,
      };
    case 'CRICKET':
      return { runs: ownScore, wickets: 0, batting_average: 0 };
    case 'BASKETBALL':
      return {
        points_scored: ownScore,
        shots_taken: 0,
        shots_on_target: 0,
        scoring_efficiency: 0,
      };
    case 'BADMINTON':
      return { match_wins: isWinner ? 1 : 0, points_scored: ownScore };
    case 'TENNIS':
      return { match_wins: isWinner ? 1 : 0, points_scored: ownScore };
    case 'VOLLEYBALL':
      return { spikes: 0, blocks: 0, serves: 0, digs: 0 };
    default:
      return {};
  }
}
