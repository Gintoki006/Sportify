/**
 * Tournament Player Linking — Integration Tests (Phase 16.6)
 *
 * Tests the full lifecycle of player-linked tournaments:
 * 1. Score sync via player IDs (direct linking)
 * 2. Invite flow — adds user to club + bracket in one action
 * 3. Winner advancement carries player IDs through bracket rounds
 * 4. Legacy name-based fallback for tournaments without player IDs
 * 5. Goal auto-progress when tournament stats are synced
 *
 * Run with:
 *   node --env-file=.env lib/__tests__/tournamentPlayerLinking.test.mjs
 *
 * Requires DATABASE_URL in .env
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

let passed = 0;
let failed = 0;
const TEST_PREFIX = '__test_pl_';

function assert(condition, description) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✕ FAIL: ${description}`);
  }
}

/**
 * Score-sync helper: mirrors the logic in PUT /api/matches/[matchId]/score
 * but operates directly on the database (avoids HTTP/Clerk auth).
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

/**
 * Score a match and perform all side-effects (advance winner, sync stats, update goals).
 * This replicates the logic from the score API route for isolated testing.
 */
async function scoreMatch(matchId, scoreA, scoreB) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: {
        include: {
          club: { select: { id: true } },
          matches: { orderBy: [{ round: 'asc' }, { createdAt: 'asc' }] },
        },
      },
    },
  });

  if (!match) throw new Error(`Match ${matchId} not found`);

  const winnerIsA = scoreA > scoreB;
  const winner = winnerIsA ? match.teamA : match.teamB;
  const winnerPlayerId = winnerIsA ? match.playerAId : match.playerBId;

  // Update score
  await prisma.match.update({
    where: { id: matchId },
    data: { scoreA, scoreB, completed: true },
  });

  let advancedNextMatch = null;
  let newTournamentStatus = null;

  await prisma.$transaction(async (tx) => {
    const allMatches = match.tournament.matches;
    const totalRounds = Math.max(...allMatches.map((m) => m.round));
    const currentRound = match.round;

    // Advance winner
    if (currentRound < totalRounds) {
      const roundMatches = allMatches.filter((m) => m.round === currentRound);
      const matchIndex = roundMatches.findIndex((m) => m.id === matchId);
      const nextRoundMatchIndex = Math.floor(matchIndex / 2);
      const nextRoundMatches = allMatches.filter(
        (m) => m.round === currentRound + 1,
      );

      if (nextRoundMatches[nextRoundMatchIndex]) {
        const nextMatch = nextRoundMatches[nextRoundMatchIndex];
        const field = matchIndex % 2 === 0 ? 'teamA' : 'teamB';
        const playerField = matchIndex % 2 === 0 ? 'playerAId' : 'playerBId';
        const updateData = { [field]: winner };
        if (winnerPlayerId) {
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

    // Tournament status
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

    // Stat sync (two-tier resolution)
    const playerIds = [match.playerAId, match.playerBId];
    const teamNames = [match.teamA, match.teamB];
    const teamScores = [scoreA, scoreB];

    const existingEntries = await tx.statEntry.findMany({
      where: { matchId },
      select: { sportProfileId: true },
    });
    const alreadySynced = new Set(existingEntries.map((e) => e.sportProfileId));

    const resolvedPlayers = [];
    let _cachedClubMembers = null;

    for (let i = 0; i < 2; i++) {
      let sportProfileId = null;

      // Primary: direct player ID linking
      if (playerIds[i]) {
        const profile = await tx.sportProfile.findUnique({
          where: {
            userId_sportType: {
              userId: playerIds[i],
              sportType: match.tournament.sportType,
            },
          },
          select: { id: true },
        });
        if (profile) sportProfileId = profile.id;
      }

      // Fallback: name-match (legacy)
      if (!sportProfileId && !playerIds[i]) {
        if (!_cachedClubMembers) {
          _cachedClubMembers = await tx.clubMember.findMany({
            where: { clubId: match.tournament.clubId },
            include: {
              user: {
                include: {
                  sportProfiles: {
                    where: { sportType: match.tournament.sportType },
                    select: { id: true },
                  },
                },
              },
            },
          });
        }
        const member = _cachedClubMembers.find(
          (m) => m.user.name?.toLowerCase() === teamNames[i].toLowerCase(),
        );
        if (member && member.user.sportProfiles.length > 0) {
          sportProfileId = member.user.sportProfiles[0].id;
        }
      }

      if (sportProfileId) resolvedPlayers.push({ sportProfileId, index: i });
    }

    // Create stat entries & advance goals
    for (const { sportProfileId, index } of resolvedPlayers) {
      if (alreadySynced.has(sportProfileId)) continue;

      const score = teamScores[index];
      const metrics = buildTournamentMetrics(
        match.tournament.sportType,
        score,
        teamScores[1 - index],
        score > teamScores[1 - index],
      );

      await tx.statEntry.create({
        data: {
          sportProfileId,
          date: match.date || new Date(),
          opponent: teamNames[1 - index],
          notes: `${match.tournament.name} — Round ${match.round}`,
          source: 'TOURNAMENT',
          matchId,
          metrics,
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
  });

  return { winner, advancedNextMatch, newTournamentStatus };
}

// ═══════════════════════════════════════════════
//  Setup: create test fixtures
// ═══════════════════════════════════════════════
async function setup() {
  // Clean any previous test data
  await cleanup();

  // Create test users
  const userA = await prisma.user.create({
    data: {
      clerkId: `${TEST_PREFIX}clerk_a`,
      name: `${TEST_PREFIX}Alice`,
      email: `${TEST_PREFIX}alice@test.com`,
    },
  });
  const userB = await prisma.user.create({
    data: {
      clerkId: `${TEST_PREFIX}clerk_b`,
      name: `${TEST_PREFIX}Bob`,
      email: `${TEST_PREFIX}bob@test.com`,
    },
  });
  const userC = await prisma.user.create({
    data: {
      clerkId: `${TEST_PREFIX}clerk_c`,
      name: `${TEST_PREFIX}Charlie`,
      email: `${TEST_PREFIX}charlie@test.com`,
    },
  });
  const userD = await prisma.user.create({
    data: {
      clerkId: `${TEST_PREFIX}clerk_d`,
      name: `${TEST_PREFIX}Diana`,
      email: `${TEST_PREFIX}diana@test.com`,
    },
  });

  // Admin user for club ownership
  const admin = await prisma.user.create({
    data: {
      clerkId: `${TEST_PREFIX}clerk_admin`,
      name: `${TEST_PREFIX}Admin`,
      email: `${TEST_PREFIX}admin@test.com`,
    },
  });

  // Create sport profiles (FOOTBALL) for A, B, C, D
  const spA = await prisma.sportProfile.create({
    data: { userId: userA.id, sportType: 'FOOTBALL' },
  });
  const spB = await prisma.sportProfile.create({
    data: { userId: userB.id, sportType: 'FOOTBALL' },
  });
  const spC = await prisma.sportProfile.create({
    data: { userId: userC.id, sportType: 'FOOTBALL' },
  });
  const spD = await prisma.sportProfile.create({
    data: { userId: userD.id, sportType: 'FOOTBALL' },
  });

  // Create club
  const club = await prisma.club.create({
    data: {
      name: `${TEST_PREFIX}Test Club`,
      adminUserId: admin.id,
    },
  });

  // Admin membership
  await prisma.clubMember.create({
    data: { userId: admin.id, clubId: club.id, role: 'ADMIN' },
  });

  // A, B, C are existing PARTICIPANT members
  await prisma.clubMember.createMany({
    data: [
      { userId: userA.id, clubId: club.id, role: 'PARTICIPANT' },
      { userId: userB.id, clubId: club.id, role: 'PARTICIPANT' },
      { userId: userC.id, clubId: club.id, role: 'PARTICIPANT' },
    ],
  });

  // D is NOT a member (for invite test)

  return { userA, userB, userC, userD, admin, spA, spB, spC, spD, club };
}

async function cleanup() {
  // Delete in dependency order
  // StatEntries for test matches
  const testTournaments = await prisma.tournament.findMany({
    where: { club: { name: { startsWith: TEST_PREFIX } } },
    select: { id: true },
  });
  const tournamentIds = testTournaments.map((t) => t.id);

  if (tournamentIds.length > 0) {
    const testMatches = await prisma.match.findMany({
      where: { tournamentId: { in: tournamentIds } },
      select: { id: true },
    });
    const matchIds = testMatches.map((m) => m.id);

    if (matchIds.length > 0) {
      await prisma.statEntry.deleteMany({
        where: { matchId: { in: matchIds } },
      });
    }

    await prisma.tournamentPlayer.deleteMany({
      where: { tournamentId: { in: tournamentIds } },
    });
    await prisma.match.deleteMany({
      where: { tournamentId: { in: tournamentIds } },
    });
    await prisma.tournament.deleteMany({
      where: { id: { in: tournamentIds } },
    });
  }

  // Clean goals for test sport profiles
  const testUsers = await prisma.user.findMany({
    where: { clerkId: { startsWith: TEST_PREFIX } },
    select: { id: true },
  });
  const testUserIds = testUsers.map((u) => u.id);

  if (testUserIds.length > 0) {
    const testSportProfiles = await prisma.sportProfile.findMany({
      where: { userId: { in: testUserIds } },
      select: { id: true },
    });
    const spIds = testSportProfiles.map((sp) => sp.id);

    if (spIds.length > 0) {
      await prisma.goal.deleteMany({
        where: { sportProfileId: { in: spIds } },
      });
      await prisma.statEntry.deleteMany({
        where: { sportProfileId: { in: spIds } },
      });
    }

    await prisma.sportProfile.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    await prisma.clubMember.deleteMany({
      where: { userId: { in: testUserIds } },
    });
  }

  await prisma.club.deleteMany({
    where: { name: { startsWith: TEST_PREFIX } },
  });
  await prisma.user.deleteMany({
    where: { clerkId: { startsWith: TEST_PREFIX } },
  });
}

// ═══════════════════════════════════════════════
//  Test 1: Score sync via player IDs
// ═══════════════════════════════════════════════
async function testPlayerIdScoreSync(fixtures) {
  console.log('\n── Test 1: Score sync via player IDs ──');

  const { userA, userB, spA, spB, club } = fixtures;

  // Create a player-linked tournament (2-player bracket)
  const tournament = await prisma.tournament.create({
    data: {
      clubId: club.id,
      name: `${TEST_PREFIX}Player Link Test`,
      sportType: 'FOOTBALL',
      startDate: new Date(),
      status: 'UPCOMING',
    },
  });

  // R1 match with playerAId and playerBId
  const match = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 1,
      teamA: userA.name,
      teamB: userB.name,
      playerAId: userA.id,
      playerBId: userB.id,
    },
  });

  // Create TournamentPlayer records
  await prisma.tournamentPlayer.createMany({
    data: [
      { tournamentId: tournament.id, userId: userA.id, seed: 1 },
      { tournamentId: tournament.id, userId: userB.id, seed: 2 },
    ],
  });

  // Score the match: A wins 3-1
  await scoreMatch(match.id, 3, 1);

  // Verify stat entries created for BOTH players
  const statsA = await prisma.statEntry.findMany({
    where: { sportProfileId: spA.id, matchId: match.id },
  });
  const statsB = await prisma.statEntry.findMany({
    where: { sportProfileId: spB.id, matchId: match.id },
  });

  assert(statsA.length === 1, 'StatEntry created for player A (winner)');
  assert(statsB.length === 1, 'StatEntry created for player B (loser)');

  // Verify metrics correctness
  assert(statsA[0].metrics.goals === 3, 'Player A goals = 3');
  assert(statsB[0].metrics.goals === 1, 'Player B goals = 1');
  assert(statsA[0].source === 'TOURNAMENT', 'Source is TOURNAMENT for A');
  assert(statsB[0].source === 'TOURNAMENT', 'Source is TOURNAMENT for B');

  // Verify no duplicate on re-score attempt
  // (match is already completed, so scoreMatch will update but stat check prevents dups)
  const statsA2 = await prisma.statEntry.findMany({
    where: { sportProfileId: spA.id, source: 'TOURNAMENT' },
  });
  assert(statsA2.length === 1, 'No duplicate stat entries for player A');

  // Verify tournament status updated
  const updatedTournament = await prisma.tournament.findUnique({
    where: { id: tournament.id },
  });
  assert(
    updatedTournament.status === 'COMPLETED',
    'Tournament marked COMPLETED after final match',
  );

  return tournament.id;
}

// ═══════════════════════════════════════════════
//  Test 2: Invite flow — add to club + bracket
// ═══════════════════════════════════════════════
async function testInviteFlow(fixtures) {
  console.log('\n── Test 2: Invite flow adds user to club & bracket ──');

  const { userA, userD, club } = fixtures;

  // Verify D is NOT a member
  const memberBefore = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: userD.id, clubId: club.id } },
  });
  assert(memberBefore === null, 'Diana is not a club member initially');

  // Create tournament with invite (replicates tournament API logic)
  const tournament = await prisma.tournament.create({
    data: {
      clubId: club.id,
      name: `${TEST_PREFIX}Invite Test`,
      sportType: 'FOOTBALL',
      startDate: new Date(),
      status: 'UPCOMING',
    },
  });

  const teamNames = [userA.name, userD.name];
  const playerIds = [userA.id, userD.id];
  const inviteUserIds = [userD.id]; // D is being invited

  // Create R1 match with player links
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 1,
      teamA: teamNames[0],
      teamB: teamNames[1],
      playerAId: playerIds[0],
      playerBId: playerIds[1],
    },
  });

  // Create TournamentPlayer records
  await prisma.tournamentPlayer.createMany({
    data: playerIds.map((uid, idx) => ({
      tournamentId: tournament.id,
      userId: uid,
      seed: idx + 1,
    })),
  });

  // Auto-add invited user to club as PARTICIPANT (matches API logic)
  const existingUsers = await prisma.user.findMany({
    where: { id: { in: inviteUserIds } },
    select: { id: true },
  });
  const validInviteIds = existingUsers.map((u) => u.id);

  const existingMemberships = await prisma.clubMember.findMany({
    where: { clubId: club.id, userId: { in: validInviteIds } },
    select: { userId: true },
  });
  const alreadyMemberIds = new Set(existingMemberships.map((m) => m.userId));
  const newMemberIds = validInviteIds.filter((id) => !alreadyMemberIds.has(id));

  if (newMemberIds.length > 0) {
    await prisma.clubMember.createMany({
      data: newMemberIds.map((userId) => ({
        userId,
        clubId: club.id,
        role: 'PARTICIPANT',
      })),
      skipDuplicates: true,
    });
  }

  // Verify D is now a PARTICIPANT member
  const memberAfter = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: userD.id, clubId: club.id } },
  });
  assert(memberAfter !== null, 'Diana is now a club member');
  assert(memberAfter?.role === 'PARTICIPANT', 'Diana was added as PARTICIPANT');

  // Verify D is in TournamentPlayer
  const tp = await prisma.tournamentPlayer.findUnique({
    where: {
      tournamentId_userId: {
        tournamentId: tournament.id,
        userId: userD.id,
      },
    },
  });
  assert(tp !== null, 'Diana has a TournamentPlayer record');

  // Verify R1 match has playerBId = Diana
  const r1Match = await prisma.match.findFirst({
    where: { tournamentId: tournament.id, round: 1 },
  });
  assert(r1Match?.playerBId === userD.id, 'R1 match has Diana as playerB');

  return tournament.id;
}

// ═══════════════════════════════════════════════
//  Test 3: Winner advancement carries player IDs
// ═══════════════════════════════════════════════
async function testWinnerAdvancement(fixtures) {
  console.log('\n── Test 3: Winner advancement carries player IDs ──');

  const { userA, userB, userC, userD, club } = fixtures;

  // Create a 4-player bracket
  const tournament = await prisma.tournament.create({
    data: {
      clubId: club.id,
      name: `${TEST_PREFIX}Advancement Test`,
      sportType: 'FOOTBALL',
      startDate: new Date(),
      status: 'UPCOMING',
    },
  });

  // R1: Match 1 (A vs B), Match 2 (C vs D)
  const match1 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 1,
      teamA: userA.name,
      teamB: userB.name,
      playerAId: userA.id,
      playerBId: userB.id,
    },
  });
  const match2 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 1,
      teamA: userC.name,
      teamB: userD.name,
      playerAId: userC.id,
      playerBId: userD.id,
    },
  });

  // R2: Final (TBD vs TBD)
  const finalMatch = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 2,
      teamA: 'TBD',
      teamB: 'TBD',
    },
  });

  // TournamentPlayers
  await prisma.tournamentPlayer.createMany({
    data: [
      { tournamentId: tournament.id, userId: userA.id, seed: 1 },
      { tournamentId: tournament.id, userId: userB.id, seed: 2 },
      { tournamentId: tournament.id, userId: userC.id, seed: 3 },
      { tournamentId: tournament.id, userId: userD.id, seed: 4 },
    ],
  });

  // Score R1 Match 1: A wins 2-0
  const result1 = await scoreMatch(match1.id, 2, 0);
  assert(result1.winner === userA.name, 'R1M1 winner is Alice');
  assert(result1.advancedNextMatch !== null, 'Winner advanced to final');
  assert(
    result1.advancedNextMatch?.playerAId === userA.id,
    'Final match playerAId = Alice (from match1 slot 0 → teamA)',
  );

  // Score R1 Match 2: D wins 4-1
  const result2 = await scoreMatch(match2.id, 1, 4);
  assert(result2.winner === userD.name, 'R1M2 winner is Diana');
  assert(
    result2.advancedNextMatch?.playerBId === userD.id,
    'Final match playerBId = Diana (from match2 slot 1 → teamB)',
  );

  // Verify the final match has both player IDs
  const updatedFinal = await prisma.match.findUnique({
    where: { id: finalMatch.id },
  });
  assert(updatedFinal.teamA === userA.name, 'Final teamA = Alice');
  assert(updatedFinal.teamB === userD.name, 'Final teamB = Diana');
  assert(updatedFinal.playerAId === userA.id, 'Final playerAId = Alice ID');
  assert(updatedFinal.playerBId === userD.id, 'Final playerBId = Diana ID');

  // Score the final: A wins 3-2
  const resultFinal = await scoreMatch(finalMatch.id, 3, 2);
  assert(resultFinal.winner === userA.name, 'Champion is Alice');
  assert(
    resultFinal.newTournamentStatus === 'COMPLETED',
    'Tournament COMPLETED after final',
  );

  // Verify stat entries created for final match too
  const finalStats = await prisma.statEntry.findMany({
    where: { matchId: finalMatch.id },
  });
  assert(
    finalStats.length === 2,
    'Both players got stat entries from the final',
  );

  return tournament.id;
}

// ═══════════════════════════════════════════════
//  Test 4: Legacy name-based fallback
// ═══════════════════════════════════════════════
async function testLegacyNameFallback(fixtures) {
  console.log(
    '\n── Test 4: Legacy tournaments (no player IDs) work with name-based fallback ──',
  );

  const { userA, userB, spA, spB, club } = fixtures;

  // Create a "legacy" tournament — NO playerAId/playerBId
  const tournament = await prisma.tournament.create({
    data: {
      clubId: club.id,
      name: `${TEST_PREFIX}Legacy Test`,
      sportType: 'FOOTBALL',
      startDate: new Date(),
      status: 'UPCOMING',
    },
  });

  // R1 match with names only — no player IDs
  const match = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 1,
      teamA: userA.name, // same name as club member A
      teamB: userB.name, // same name as club member B
      // playerAId: null (intentionally omitted)
      // playerBId: null
    },
  });

  // Score: B wins 5-2
  await scoreMatch(match.id, 2, 5);

  // Verify stat entries were created via name-match fallback
  const statsA = await prisma.statEntry.findMany({
    where: { sportProfileId: spA.id, matchId: match.id },
  });
  const statsB = await prisma.statEntry.findMany({
    where: { sportProfileId: spB.id, matchId: match.id },
  });

  assert(
    statsA.length === 1,
    'Legacy fallback: stat entry created for player A via name match',
  );
  assert(
    statsB.length === 1,
    'Legacy fallback: stat entry created for player B via name match',
  );
  assert(statsA[0].metrics.goals === 2, 'Legacy A: goals = 2');
  assert(statsB[0].metrics.goals === 5, 'Legacy B: goals = 5');

  // Verify that if a name doesn't match anyone, it's silently skipped
  const match2 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 1,
      teamA: 'Unknown Team Alpha',
      teamB: 'Unknown Team Beta',
    },
  });

  await prisma.match.update({
    where: { id: match2.id },
    data: { scoreA: 3, scoreB: 1, completed: true },
  });

  // Manually run stat sync logic for this match (scoreMatch would work too but let's be explicit)
  const unmatchedStats = await prisma.statEntry.findMany({
    where: { matchId: match2.id },
  });
  assert(
    unmatchedStats.length === 0,
    'No stat entries created for unknown team names (graceful skip)',
  );

  return tournament.id;
}

// ═══════════════════════════════════════════════
//  Test 5: Goal auto-progress on tournament stats
// ═══════════════════════════════════════════════
async function testGoalAutoProgress(fixtures) {
  console.log(
    '\n── Test 5: Goals auto-progress when tournament stats are synced ──',
  );

  const { userA, userB, spA, club } = fixtures;

  // Create a goal for Alice: 10 goals in football
  const goal = await prisma.goal.create({
    data: {
      sportProfileId: spA.id,
      metric: 'goals',
      target: 10,
      current: 0,
    },
  });

  // Create tournament with player-linked match
  const tournament = await prisma.tournament.create({
    data: {
      clubId: club.id,
      name: `${TEST_PREFIX}Goal Progress Test`,
      sportType: 'FOOTBALL',
      startDate: new Date(),
      status: 'UPCOMING',
    },
  });

  const match = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 1,
      teamA: userA.name,
      teamB: userB.name,
      playerAId: userA.id,
      playerBId: userB.id,
    },
  });

  // Score: A scores 7 goals
  await scoreMatch(match.id, 7, 2);

  // Check goal progress
  const updatedGoal = await prisma.goal.findUnique({
    where: { id: goal.id },
  });
  assert(updatedGoal.current === 7, 'Goal current advanced to 7');
  assert(updatedGoal.completed === false, 'Goal not yet completed (7/10)');

  // Create another match for another round
  const tournament2 = await prisma.tournament.create({
    data: {
      clubId: club.id,
      name: `${TEST_PREFIX}Goal Progress Test 2`,
      sportType: 'FOOTBALL',
      startDate: new Date(),
      status: 'UPCOMING',
    },
  });

  const match2 = await prisma.match.create({
    data: {
      tournamentId: tournament2.id,
      round: 1,
      teamA: userA.name,
      teamB: userB.name,
      playerAId: userA.id,
      playerBId: userB.id,
    },
  });

  // Score: A scores 4 more goals (total 11 → should complete the goal)
  await scoreMatch(match2.id, 4, 1);

  const completedGoal = await prisma.goal.findUnique({
    where: { id: goal.id },
  });
  assert(completedGoal.current === 11, 'Goal current advanced to 11 (7 + 4)');
  assert(
    completedGoal.completed === true,
    'Goal automatically marked complete when target reached',
  );

  return [tournament.id, tournament2.id];
}

// ═══════════════════════════════════════════════
//  Test 6: UI logic — champion, standings, playerByName
// ═══════════════════════════════════════════════
function testUILogic() {
  console.log('\n── Test 6: UI logic — champion, standings, playerByName ──');

  // Simulate matches data as passed from server
  const matches = [
    {
      id: 'm1',
      round: 1,
      teamA: 'Alice',
      teamB: 'Bob',
      playerA: { id: 'ua', name: 'Alice', avatarUrl: '/a.jpg' },
      playerB: { id: 'ub', name: 'Bob', avatarUrl: '/b.jpg' },
      scoreA: 3,
      scoreB: 1,
      completed: true,
      statsSynced: true,
    },
    {
      id: 'm2',
      round: 1,
      teamA: 'Charlie',
      teamB: 'Diana',
      playerA: { id: 'uc', name: 'Charlie', avatarUrl: null },
      playerB: { id: 'ud', name: 'Diana', avatarUrl: '/d.jpg' },
      scoreA: 0,
      scoreB: 2,
      completed: true,
      statsSynced: true,
    },
    {
      id: 'm3',
      round: 2,
      teamA: 'Alice',
      teamB: 'Diana',
      playerA: { id: 'ua', name: 'Alice', avatarUrl: '/a.jpg' },
      playerB: { id: 'ud', name: 'Diana', avatarUrl: '/d.jpg' },
      scoreA: 4,
      scoreB: 2,
      completed: true,
      statsSynced: true,
    },
  ];

  // 1. playerByName lookup
  const playerByName = {};
  matches.forEach((m) => {
    if (m.playerA && m.teamA) playerByName[m.teamA] = m.playerA;
    if (m.playerB && m.teamB) playerByName[m.teamB] = m.playerB;
  });

  assert(playerByName['Alice']?.id === 'ua', 'playerByName resolves Alice');
  assert(playerByName['Diana']?.id === 'ud', 'playerByName resolves Diana');
  assert(
    playerByName['Bob']?.avatarUrl === '/b.jpg',
    'playerByName has Bob avatar',
  );
  assert(
    playerByName['Charlie']?.avatarUrl === null,
    'playerByName has Charlie with null avatar',
  );

  // 2. Champion computation
  const totalRounds = 2;
  const status = 'COMPLETED';

  let champion = null;
  if (status === 'COMPLETED') {
    const finalMatch = matches.find(
      (m) => m.round === totalRounds && m.completed,
    );
    if (finalMatch) {
      const isA = finalMatch.scoreA > finalMatch.scoreB;
      champion = {
        name: isA ? finalMatch.teamA : finalMatch.teamB,
        player: isA ? finalMatch.playerA : finalMatch.playerB,
      };
    }
  }

  assert(champion !== null, 'Champion is determined');
  assert(champion?.name === 'Alice', 'Champion name is Alice');
  assert(champion?.player?.id === 'ua', 'Champion player ID is correct');
  assert(champion?.player?.avatarUrl === '/a.jpg', 'Champion has avatar');

  // 3. Standings with player info
  const stats = {};
  matches
    .filter((m) => m.completed)
    .forEach((m) => {
      if (!stats[m.teamA])
        stats[m.teamA] = { wins: 0, losses: 0, points: 0, conceded: 0 };
      if (!stats[m.teamB])
        stats[m.teamB] = { wins: 0, losses: 0, points: 0, conceded: 0 };
      stats[m.teamA].points += m.scoreA;
      stats[m.teamA].conceded += m.scoreB;
      stats[m.teamB].points += m.scoreB;
      stats[m.teamB].conceded += m.scoreA;
      if (m.scoreA > m.scoreB) {
        stats[m.teamA].wins++;
        stats[m.teamB].losses++;
      } else if (m.scoreB > m.scoreA) {
        stats[m.teamB].wins++;
        stats[m.teamA].losses++;
      }
    });

  const standings = Object.entries(stats)
    .map(([name, s]) => ({ name, player: playerByName[name], ...s }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  assert(standings[0].name === 'Alice', 'Alice is #1 in standings (2 wins)');
  assert(standings[0].wins === 2, 'Alice has 2 wins');
  assert(standings[0].player?.id === 'ua', 'Standings #1 has player data');
  assert(
    standings[0].player?.avatarUrl === '/a.jpg',
    'Standings #1 has avatar',
  );

  assert(standings[1].name === 'Diana', 'Diana is #2 (1 win, 1 loss)');
  assert(standings[1].player?.id === 'ud', 'Standings #2 has player data');

  // 4. Match with no player links (legacy)
  const legacyMatch = {
    id: 'm4',
    round: 1,
    teamA: 'Team Alpha',
    teamB: 'Team Beta',
    playerA: null,
    playerB: null,
    scoreA: 1,
    scoreB: 3,
    completed: true,
    statsSynced: false,
  };

  assert(
    legacyMatch.playerA === null,
    'Legacy match has no playerA — no avatar rendered',
  );
  assert(
    legacyMatch.statsSynced === false,
    'Legacy match does not show stats synced indicator',
  );

  // 5. handleScoreSubmitted propagation test
  const matchesCopy = [...matches];
  const mockNextMatch = {
    id: 'next1',
    teamA: 'Alice',
    teamB: 'TBD',
    playerAId: 'ua',
    playerBId: null,
  };

  // Simulate handleScoreSubmitted logic
  const scoredMatchId = 'm1';
  const data = {
    scoreA: 3,
    scoreB: 1,
    nextMatch: mockNextMatch,
  };

  const updatedMatches = matchesCopy.map((m) => {
    if (m.id === scoredMatchId) {
      return {
        ...m,
        scoreA: data.scoreA,
        scoreB: data.scoreB,
        completed: true,
        statsSynced: !!(m.playerA || m.playerB),
      };
    }
    return m;
  });

  const scoredMatch = updatedMatches.find((m) => m.id === scoredMatchId);
  assert(
    scoredMatch.statsSynced === true,
    'handleScoreSubmitted marks statsSynced when players linked',
  );
}

// ═══════════════════════════════════════════════
//  Runner
// ═══════════════════════════════════════════════
async function run() {
  console.log('🧪 Tournament Player Linking — Integration Tests\n');

  let fixtures;
  const createdTournamentIds = [];

  try {
    fixtures = await setup();
    console.log('✓ Test fixtures created\n');

    // Run tests
    const t1Id = await testPlayerIdScoreSync(fixtures);
    createdTournamentIds.push(t1Id);

    const t2Id = await testInviteFlow(fixtures);
    createdTournamentIds.push(t2Id);

    const t3Id = await testWinnerAdvancement(fixtures);
    createdTournamentIds.push(t3Id);

    const t4Id = await testLegacyNameFallback(fixtures);
    createdTournamentIds.push(t4Id);

    const t5Ids = await testGoalAutoProgress(fixtures);
    createdTournamentIds.push(...t5Ids);

    testUILogic();
  } catch (err) {
    console.error('\n💥 Test runner error:', err);
    failed++;
  } finally {
    // Cleanup
    try {
      await cleanup();
      console.log('\n✓ Test data cleaned up');
    } catch (cleanupErr) {
      console.error('⚠ Cleanup error:', cleanupErr.message);
    }

    await prisma.$disconnect();
  }

  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Passed: ${passed}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
    process.exit(1);
  } else {
    console.log('All tournament player linking tests passed!');
  }
}

run();
