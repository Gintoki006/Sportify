/**
 * Backfill Script — Link existing matches to User records
 *
 * For each match that has no playerAId/playerBId, attempts to find
 * a club member whose name matches teamA/teamB (case-insensitive).
 * Also creates TournamentPlayer records for linked users.
 *
 * Usage: node prisma/backfill-player-links.mjs
 * Requires DATABASE_URL in .env
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔗 Backfilling player links on existing matches…\n');

  // Get all tournaments with their matches and club members
  const tournaments = await prisma.tournament.findMany({
    include: {
      matches: {
        where: {
          OR: [{ playerAId: null }, { playerBId: null }],
        },
      },
      club: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  let matchesUpdated = 0;
  let playersCreated = 0;

  for (const tournament of tournaments) {
    if (tournament.matches.length === 0) continue;

    // Build a name → userId map for this club (case-insensitive)
    const nameToUserId = {};
    for (const member of tournament.club.members) {
      if (member.user.name) {
        nameToUserId[member.user.name.toLowerCase()] = member.user.id;
      }
    }

    // Track linked users for TournamentPlayer creation
    const linkedUserIds = new Set();

    // Get existing TournamentPlayer records
    const existingPlayers = await prisma.tournamentPlayer.findMany({
      where: { tournamentId: tournament.id },
      select: { userId: true },
    });
    const existingPlayerIds = new Set(existingPlayers.map((p) => p.userId));

    for (const match of tournament.matches) {
      const updates = {};

      // Try matching teamA to a user
      if (!match.playerAId && match.teamA && match.teamA !== 'TBD') {
        const userId = nameToUserId[match.teamA.toLowerCase()];
        if (userId) {
          updates.playerAId = userId;
          linkedUserIds.add(userId);
        }
      }

      // Try matching teamB to a user
      if (!match.playerBId && match.teamB && match.teamB !== 'TBD') {
        const userId = nameToUserId[match.teamB.toLowerCase()];
        if (userId) {
          updates.playerBId = userId;
          linkedUserIds.add(userId);
        }
      }

      if (Object.keys(updates).length > 0) {
        await prisma.match.update({
          where: { id: match.id },
          data: updates,
        });
        matchesUpdated++;
        console.log(
          `  ✓ Match ${match.id} (R${match.round}: ${match.teamA} vs ${match.teamB}) — linked ${Object.keys(updates).join(', ')}`,
        );
      }
    }

    // Create TournamentPlayer records for newly linked users
    // Assign seeds based on first-round match slot positions
    const round1Matches = tournament.matches
      .filter((m) => m.round === 1)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    let seedCounter = 0;
    // Get max seed already taken
    if (existingPlayers.length > 0) {
      const maxSeed = await prisma.tournamentPlayer.findFirst({
        where: { tournamentId: tournament.id },
        orderBy: { seed: 'desc' },
        select: { seed: true },
      });
      seedCounter = (maxSeed?.seed ?? -1) + 1;
    }

    for (const userId of linkedUserIds) {
      if (existingPlayerIds.has(userId)) continue;

      try {
        await prisma.tournamentPlayer.create({
          data: {
            tournamentId: tournament.id,
            userId,
            seed: seedCounter++,
          },
        });
        playersCreated++;
      } catch (err) {
        // Unique constraint violation — already exists
        if (err.code === 'P2002') continue;
        throw err;
      }
    }
  }

  console.log(`\n✅ Backfill complete!`);
  console.log(`   Matches updated: ${matchesUpdated}`);
  console.log(`   TournamentPlayers created: ${playersCreated}`);
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
