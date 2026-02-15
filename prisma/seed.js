/**
 * Seed Script — Sportify
 *
 * Populates the database with demo data for development/testing.
 * Usage: node prisma/seed.js
 *
 * Requires DATABASE_URL in .env
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── Helpers ──
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Main ──
async function main() {
  console.log('🌱 Seeding Sportify database…');

  // 1. Create demo users
  const user1 = await prisma.user.upsert({
    where: { email: 'alex@demo.sportify.app' },
    update: {},
    create: {
      clerkId: 'demo_clerk_alex',
      name: 'Alex Johnson',
      email: 'alex@demo.sportify.app',
      bio: 'Weekend warrior. Football and basketball enthusiast.',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'priya@demo.sportify.app' },
    update: {},
    create: {
      clerkId: 'demo_clerk_priya',
      name: 'Priya Sharma',
      email: 'priya@demo.sportify.app',
      bio: 'Cricket lover. Always chasing the next century.',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'sam@demo.sportify.app' },
    update: {},
    create: {
      clerkId: 'demo_clerk_sam',
      name: 'Sam Lee',
      email: 'sam@demo.sportify.app',
      bio: 'Badminton & tennis player.',
    },
  });

  console.log('  ✓ Users created');

  // 2. Sport Profiles
  const sp1Football = await prisma.sportProfile.upsert({
    where: { userId_sportType: { userId: user1.id, sportType: 'FOOTBALL' } },
    update: {},
    create: { userId: user1.id, sportType: 'FOOTBALL' },
  });

  const sp1Basketball = await prisma.sportProfile.upsert({
    where: {
      userId_sportType: { userId: user1.id, sportType: 'BASKETBALL' },
    },
    update: {},
    create: { userId: user1.id, sportType: 'BASKETBALL' },
  });

  const sp2Cricket = await prisma.sportProfile.upsert({
    where: { userId_sportType: { userId: user2.id, sportType: 'CRICKET' } },
    update: {},
    create: { userId: user2.id, sportType: 'CRICKET' },
  });

  const sp3Badminton = await prisma.sportProfile.upsert({
    where: { userId_sportType: { userId: user3.id, sportType: 'BADMINTON' } },
    update: {},
    create: { userId: user3.id, sportType: 'BADMINTON' },
  });

  const sp3Tennis = await prisma.sportProfile.upsert({
    where: { userId_sportType: { userId: user3.id, sportType: 'TENNIS' } },
    update: {},
    create: { userId: user3.id, sportType: 'TENNIS' },
  });

  console.log('  ✓ Sport profiles created');

  // 3. Stat Entries (10 per profile)
  const footballEntries = [];
  for (let i = 0; i < 10; i++) {
    footballEntries.push({
      sportProfileId: sp1Football.id,
      date: daysAgo(i * 3),
      opponent: ['City FC', 'United', 'Rovers', 'Athletic', 'Wanderers'][i % 5],
      metrics: {
        goals: randomInt(0, 3),
        assists: randomInt(0, 2),
        shots_on_target: randomInt(1, 6),
        shots_taken: randomInt(3, 10),
      },
      source: 'MANUAL',
    });
  }

  const basketballEntries = [];
  for (let i = 0; i < 10; i++) {
    basketballEntries.push({
      sportProfileId: sp1Basketball.id,
      date: daysAgo(i * 3 + 1),
      opponent: ['Hawks', 'Bulls', 'Celtics', 'Lakers', 'Nets'][i % 5],
      metrics: {
        points_scored: randomInt(8, 32),
        rebounds: randomInt(2, 12),
        assists: randomInt(1, 8),
        steals: randomInt(0, 4),
      },
      source: 'MANUAL',
    });
  }

  const cricketEntries = [];
  for (let i = 0; i < 10; i++) {
    cricketEntries.push({
      sportProfileId: sp2Cricket.id,
      date: daysAgo(i * 4),
      opponent: ['Warriors', 'Knights', 'Titans', 'Kings', 'Chargers'][i % 5],
      metrics: {
        runs: randomInt(10, 100),
        wickets: randomInt(0, 4),
        catches: randomInt(0, 3),
        run_rate: +(Math.random() * 6 + 3).toFixed(2),
      },
      source: 'MANUAL',
    });
  }

  const badmintonEntries = [];
  for (let i = 0; i < 8; i++) {
    badmintonEntries.push({
      sportProfileId: sp3Badminton.id,
      date: daysAgo(i * 3),
      opponent: ['Lin', 'Chen', 'Park', 'Viktor'][i % 4],
      metrics: {
        points_won: randomInt(15, 21),
        smashes: randomInt(5, 15),
        net_shots: randomInt(3, 12),
        rallies_won: randomInt(10, 25),
      },
      source: 'MANUAL',
    });
  }

  const tennisEntries = [];
  for (let i = 0; i < 8; i++) {
    tennisEntries.push({
      sportProfileId: sp3Tennis.id,
      date: daysAgo(i * 4 + 2),
      opponent: ['Novak', 'Rafael', 'Roger', 'Carlos'][i % 4],
      metrics: {
        aces: randomInt(2, 12),
        double_faults: randomInt(0, 5),
        winners: randomInt(8, 25),
        unforced_errors: randomInt(5, 20),
      },
      source: 'MANUAL',
    });
  }

  await prisma.statEntry.createMany({
    data: [
      ...footballEntries,
      ...basketballEntries,
      ...cricketEntries,
      ...badmintonEntries,
      ...tennisEntries,
    ],
    skipDuplicates: true,
  });

  console.log('  ✓ Stat entries created');

  // 4. Goals
  const goalsData = [
    {
      sportProfileId: sp1Football.id,
      metric: 'goals',
      target: 25,
      current: 14,
      deadline: daysAgo(-30),
    },
    {
      sportProfileId: sp1Football.id,
      metric: 'assists',
      target: 15,
      current: 15,
      completed: true,
    },
    {
      sportProfileId: sp1Basketball.id,
      metric: 'points_scored',
      target: 200,
      current: 142,
      deadline: daysAgo(-60),
    },
    {
      sportProfileId: sp2Cricket.id,
      metric: 'runs',
      target: 500,
      current: 320,
      deadline: daysAgo(-45),
    },
    {
      sportProfileId: sp2Cricket.id,
      metric: 'wickets',
      target: 20,
      current: 20,
      completed: true,
    },
    {
      sportProfileId: sp3Badminton.id,
      metric: 'smashes',
      target: 100,
      current: 67,
    },
    {
      sportProfileId: sp3Tennis.id,
      metric: 'aces',
      target: 50,
      current: 38,
      deadline: daysAgo(-20),
    },
  ];

  for (const g of goalsData) {
    await prisma.goal.create({ data: g });
  }

  console.log('  ✓ Goals created');

  // 5. Clubs
  const club1 = await prisma.club.create({
    data: {
      name: 'Weekend Warriors',
      description: 'Casual weekend sports club for all levels.',
      adminUserId: user1.id,
    },
  });

  const club2 = await prisma.club.create({
    data: {
      name: 'Pro League',
      description: 'Competitive players only. Serious matches.',
      adminUserId: user2.id,
    },
  });

  console.log('  ✓ Clubs created');

  // 6. Club Members
  await prisma.clubMember.createMany({
    data: [
      { userId: user1.id, clubId: club1.id },
      { userId: user2.id, clubId: club1.id },
      { userId: user3.id, clubId: club1.id },
      { userId: user2.id, clubId: club2.id },
      { userId: user3.id, clubId: club2.id },
    ],
    skipDuplicates: true,
  });

  console.log('  ✓ Club members added');

  // 7. Tournaments
  const tournament1 = await prisma.tournament.create({
    data: {
      clubId: club1.id,
      name: 'Summer Football Cup',
      sportType: 'FOOTBALL',
      startDate: daysAgo(14),
      endDate: daysAgo(-7),
      status: 'IN_PROGRESS',
    },
  });

  const tournament2 = await prisma.tournament.create({
    data: {
      clubId: club2.id,
      name: 'Badminton Open',
      sportType: 'BADMINTON',
      startDate: daysAgo(7),
      endDate: daysAgo(-14),
      status: 'UPCOMING',
    },
  });

  console.log('  ✓ Tournaments created');

  // 8. Matches (4-team bracket for tournament1)
  await prisma.match.createMany({
    data: [
      // Semi-finals
      {
        tournamentId: tournament1.id,
        round: 1,
        teamA: 'Team Alpha',
        teamB: 'Team Beta',
        scoreA: 3,
        scoreB: 1,
        completed: true,
        date: daysAgo(10),
      },
      {
        tournamentId: tournament1.id,
        round: 1,
        teamA: 'Team Gamma',
        teamB: 'Team Delta',
        scoreA: 2,
        scoreB: 2,
        completed: false,
        date: daysAgo(10),
      },
      // Final
      {
        tournamentId: tournament1.id,
        round: 2,
        teamA: 'Team Alpha',
        teamB: 'TBD',
        completed: false,
        date: daysAgo(3),
      },
      // Badminton Open matches
      {
        tournamentId: tournament2.id,
        round: 1,
        teamA: 'Player A',
        teamB: 'Player B',
        date: daysAgo(-2),
        completed: false,
      },
      {
        tournamentId: tournament2.id,
        round: 1,
        teamA: 'Player C',
        teamB: 'Player D',
        date: daysAgo(-2),
        completed: false,
      },
    ],
  });

  console.log('  ✓ Matches created');

  console.log('\n✅ Seed complete!');
  console.log(`   Users: 3 | SportProfiles: 5 | Entries: 46`);
  console.log(`   Goals: 7 | Clubs: 2 | Tournaments: 2 | Matches: 5`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
