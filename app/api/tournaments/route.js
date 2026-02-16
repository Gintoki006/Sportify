import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

const VALID_SPORTS = [
  'FOOTBALL',
  'CRICKET',
  'BASKETBALL',
  'BADMINTON',
  'TENNIS',
  'VOLLEYBALL',
];

/**
 * POST /api/tournaments — create a tournament (admin only)
 * Body: { clubId, name, sportType, startDate, endDate?, bracketSize }
 * bracketSize must be power of 2 (2, 4, 8, 16)
 */
export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      clubId,
      name,
      sportType,
      startDate,
      endDate,
      bracketSize,
      teams,
      playerUserIds,
    } = body;

    if (!clubId || !name?.trim() || !sportType || !startDate || !bracketSize) {
      return NextResponse.json(
        {
          error:
            'clubId, name, sportType, startDate, and bracketSize are required',
        },
        { status: 400 },
      );
    }

    if (!VALID_SPORTS.includes(sportType)) {
      return NextResponse.json(
        { error: 'Invalid sport type' },
        { status: 400 },
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Tournament name must be 100 characters or less' },
        { status: 400 },
      );
    }

    // Validate dates
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'startDate must be a valid date' },
        { status: 400 },
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'endDate must be a valid date' },
          { status: 400 },
        );
      }
      if (end < start) {
        return NextResponse.json(
          { error: 'endDate must be after startDate' },
          { status: 400 },
        );
      }
    }

    // bracketSize must be power of 2
    const validSizes = [2, 4, 8, 16];
    if (!validSizes.includes(bracketSize)) {
      return NextResponse.json(
        { error: 'bracketSize must be 2, 4, 8, or 16' },
        { status: 400 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify role: ADMIN or HOST can create tournaments
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const callerMembership = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: dbUser.id, clubId } },
      select: { role: true },
    });

    const callerRole =
      club.adminUserId === dbUser.id ? 'ADMIN' : callerMembership?.role;

    if (!callerRole || !hasPermission(callerRole, 'createTournament')) {
      return NextResponse.json(
        { error: 'Only Admins and Hosts can create tournaments' },
        { status: 403 },
      );
    }

    // Validate team names if provided
    const teamNames =
      teams && Array.isArray(teams) && teams.length === bracketSize
        ? teams
            .map((t) => (typeof t === 'string' ? t.trim() : ''))
            .filter(Boolean)
        : Array.from({ length: bracketSize }, (_, i) => `Team ${i + 1}`);

    if (teamNames.length !== bracketSize) {
      return NextResponse.json(
        { error: `Exactly ${bracketSize} team names required` },
        { status: 400 },
      );
    }

    // Server-side validation: if custom team names are provided, verify
    // they correspond to PARTICIPANT+ members (or will be auto-upgraded).
    // Only validate when teams array was explicitly provided by client.
    if (teams && Array.isArray(teams) && teams.length === bracketSize) {
      const clubMembers = await prisma.clubMember.findMany({
        where: { clubId },
        include: { user: { select: { name: true } } },
      });

      const memberMap = {};
      for (const cm of clubMembers) {
        if (cm.user.name) {
          // Club owner is always ADMIN regardless of ClubMember role
          const effectiveRole =
            cm.userId === club.adminUserId ? 'ADMIN' : cm.role;
          memberMap[cm.user.name.toLowerCase()] = effectiveRole;
        }
      }

      const { upgradeUserIds: upgradeIds } = body;
      const upgradeSet = new Set(
        upgradeIds && Array.isArray(upgradeIds) ? upgradeIds : [],
      );

      // Build set of invited (non-member) user IDs so we skip validation for them
      const { inviteUserIds: bodyInviteIds } = body;
      const inviteIdSet = new Set(
        bodyInviteIds && Array.isArray(bodyInviteIds) ? bodyInviteIds : [],
      );

      // If invites are present, resolve their names so we can skip them in spectator check
      let invitedNameSet = new Set();
      if (inviteIdSet.size > 0) {
        const invitedUsers = await prisma.user.findMany({
          where: { id: { in: [...inviteIdSet] } },
          select: { name: true },
        });
        invitedNameSet = new Set(
          invitedUsers.map((u) => u.name?.toLowerCase()).filter(Boolean),
        );
      }

      for (const name of teamNames) {
        // Skip validation for invited non-member users
        if (invitedNameSet.has(name.toLowerCase())) continue;

        const role = memberMap[name.toLowerCase()];
        // If member exists and is SPECTATOR without being flagged for upgrade, reject
        if (role === 'SPECTATOR') {
          const memberRecord = clubMembers.find(
            (cm) =>
              cm.user.name?.toLowerCase() === name.toLowerCase() &&
              cm.role === 'SPECTATOR',
          );
          if (memberRecord && !upgradeSet.has(memberRecord.userId)) {
            return NextResponse.json(
              {
                error: `${name} is a Spectator and must be upgraded to Participant before joining a tournament`,
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        clubId,
        name: name.trim(),
        sportType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'UPCOMING',
      },
    });

    // Generate single-elimination bracket matches
    const totalRounds = Math.log2(bracketSize);

    // Build playerUserIds lookup (slot index → userId or null)
    const playerIds =
      playerUserIds && Array.isArray(playerUserIds)
        ? playerUserIds.map((id) => id || null)
        : Array(bracketSize).fill(null);

    // Round 1: seed teams with playerA/B links
    for (let i = 0; i < bracketSize / 2; i++) {
      await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          round: 1,
          teamA: teamNames[i * 2],
          teamB: teamNames[i * 2 + 1],
          playerAId: playerIds[i * 2] || null,
          playerBId: playerIds[i * 2 + 1] || null,
          date: null,
          completed: false,
        },
      });
    }

    // Subsequent rounds: TBD placeholders
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      const placeholders = [];
      for (let i = 0; i < matchesInRound; i++) {
        placeholders.push({
          tournamentId: tournament.id,
          round,
          teamA: 'TBD',
          teamB: 'TBD',
          date: null,
          completed: false,
        });
      }
      await prisma.match.createMany({ data: placeholders });
    }

    // Create TournamentPlayer records for all linked users
    const uniquePlayerIds = [...new Set(playerIds.filter(Boolean))];
    if (uniquePlayerIds.length > 0) {
      await prisma.tournamentPlayer.createMany({
        data: uniquePlayerIds.map((userId, idx) => ({
          tournamentId: tournament.id,
          userId,
          seed: idx + 1,
        })),
        skipDuplicates: true,
      });
    }

    // Auto-upgrade spectators to PARTICIPANT if requested
    const { upgradeUserIds } = body;
    if (
      upgradeUserIds &&
      Array.isArray(upgradeUserIds) &&
      upgradeUserIds.length > 0
    ) {
      await prisma.clubMember.updateMany({
        where: {
          clubId,
          userId: { in: upgradeUserIds },
          role: 'SPECTATOR',
        },
        data: { role: 'PARTICIPANT' },
      });
    }

    // Auto-add invited (non-member) users to the club as PARTICIPANT
    const { inviteUserIds } = body;
    if (
      inviteUserIds &&
      Array.isArray(inviteUserIds) &&
      inviteUserIds.length > 0
    ) {
      // Verify each invited user exists
      const existingUsers = await prisma.user.findMany({
        where: { id: { in: inviteUserIds } },
        select: { id: true },
      });
      const validInviteIds = existingUsers.map((u) => u.id);

      // Check which are not already members
      const existingMemberships = await prisma.clubMember.findMany({
        where: { clubId, userId: { in: validInviteIds } },
        select: { userId: true },
      });
      const alreadyMemberIds = new Set(
        existingMemberships.map((m) => m.userId),
      );
      const newMemberIds = validInviteIds.filter(
        (id) => !alreadyMemberIds.has(id),
      );

      if (newMemberIds.length > 0) {
        await prisma.clubMember.createMany({
          data: newMemberIds.map((userId) => ({
            userId,
            clubId,
            role: 'PARTICIPANT',
          })),
          skipDuplicates: true,
        });
      }
    }

    // Fetch the full tournament
    const fullTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        matches: { orderBy: [{ round: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    return NextResponse.json(
      { success: true, tournament: fullTournament },
      { status: 201 },
    );
  } catch (err) {
    console.error('[tournaments] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
