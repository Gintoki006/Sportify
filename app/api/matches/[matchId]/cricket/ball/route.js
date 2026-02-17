import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/clubPermissions';

/**
 * POST /api/matches/[matchId]/cricket/ball — record a single ball delivery
 *
 * Body: {
 *   batsmanName, batsmanId?,
 *   bowlerName, bowlerId?,
 *   runsScored (off the bat),
 *   extraType? ('WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY'),
 *   extraRuns? (default 1 for wide/no-ball),
 *   isWicket?,
 *   dismissalType? ('BOWLED' | 'CAUGHT' | 'LBW' | 'RUN_OUT' | 'STUMPED' | 'HIT_WICKET' | 'RETIRED'),
 *   fielderName?,
 *   newBatsmanName?, newBatsmanId? — the replacement batsman (if wicket)
 * }
 *
 * Auto-calculates: strike rate, economy, over completion, aggregates.
 * Auto-detects innings completion (all out / overs done / target chased).
 * Auto-completes match after 2nd innings if applicable.
 */
export async function POST(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    const body = await req.json();
    const {
      batsmanName,
      batsmanId,
      bowlerName,
      bowlerId,
      runsScored = 0,
      extraType,
      extraRuns = 0,
      isWicket = false,
      dismissalType,
      fielderName,
      newBatsmanName,
      newBatsmanId,
    } = body;

    if (!batsmanName || !bowlerName) {
      return NextResponse.json(
        { error: 'batsmanName and bowlerName are required' },
        { status: 400 },
      );
    }

    const validExtraTypes = ['WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY'];
    if (extraType && !validExtraTypes.includes(extraType)) {
      return NextResponse.json({ error: 'Invalid extraType' }, { status: 400 });
    }

    const validDismissals = [
      'BOWLED',
      'CAUGHT',
      'LBW',
      'RUN_OUT',
      'STUMPED',
      'HIT_WICKET',
      'RETIRED',
    ];
    if (isWicket && dismissalType && !validDismissals.includes(dismissalType)) {
      return NextResponse.json(
        { error: 'Invalid dismissalType' },
        { status: 400 },
      );
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
        cricketInnings: {
          orderBy: { inningsNumber: 'asc' },
          include: {
            battingEntries: { orderBy: { battingOrder: 'asc' } },
            bowlingEntries: { orderBy: { bowlingOrder: 'asc' } },
            ballEvents: {
              orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }],
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.completed) {
      return NextResponse.json(
        { error: 'Match is already completed' },
        { status: 400 },
      );
    }

    const matchSportType = match.isStandalone
      ? match.sportType
      : match.tournament?.sportType;
    if (matchSportType !== 'CRICKET') {
      return NextResponse.json(
        { error: 'This is not a cricket match' },
        { status: 400 },
      );
    }

    // Permission check
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
          { error: 'Only the match creator can score this match' },
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
          { error: 'Only Admins and Hosts can score matches' },
          { status: 403 },
        );
      }
    }

    // Get the current (active) innings
    const activeInnings = match.cricketInnings.find((i) => !i.isComplete);
    if (!activeInnings) {
      return NextResponse.json(
        { error: 'No active innings. Start an innings first.' },
        { status: 400 },
      );
    }

    const maxOvers = match.isStandalone
      ? match.overs || 20
      : match.tournament.overs || 20;
    const maxWickets =
      (match.isStandalone
        ? match.playersPerSide || 11
        : match.tournament.playersPerSide || 11) - 1;

    // Wides and no-balls are NOT legal deliveries
    const isLegalDelivery =
      !extraType || (extraType !== 'WIDE' && extraType !== 'NO_BALL');

    // Calculate current over/ball from existing ball events
    const legalBalls = activeInnings.ballEvents.filter(
      (e) =>
        !e.extraType || (e.extraType !== 'WIDE' && e.extraType !== 'NO_BALL'),
    ).length;
    const currentOver = Math.floor(legalBalls / 6) + 1;
    const currentBallInOver = (legalBalls % 6) + 1;

    // Total runs for this ball
    const totalRunsThisBall = runsScored + (extraRuns || 0);

    // Generate commentary
    let commentary = '';
    if (isWicket) {
      commentary = `WICKET! ${batsmanName} ${dismissalType || 'out'}`;
      if (fielderName) commentary += ` (${fielderName})`;
      if (
        dismissalType === 'BOWLED' ||
        dismissalType === 'LBW' ||
        dismissalType === 'CAUGHT' ||
        dismissalType === 'HIT_WICKET'
      ) {
        commentary += ` b ${bowlerName}`;
      }
    } else if (extraType === 'WIDE') {
      commentary = `Wide ball, ${extraRuns || 1} run${(extraRuns || 1) > 1 ? 's' : ''}`;
    } else if (extraType === 'NO_BALL') {
      commentary = `No ball! ${runsScored} run${runsScored !== 1 ? 's' : ''} + ${extraRuns || 1} extra`;
    } else if (extraType === 'BYE') {
      commentary = `${extraRuns || 0} bye${(extraRuns || 0) !== 1 ? 's' : ''}`;
    } else if (extraType === 'LEG_BYE') {
      commentary = `${extraRuns || 0} leg bye${(extraRuns || 0) !== 1 ? 's' : ''}`;
    } else if (runsScored === 4) {
      commentary = `FOUR! ${batsmanName} hits a boundary`;
    } else if (runsScored === 6) {
      commentary = `SIX! ${batsmanName} clears the rope`;
    } else if (runsScored === 0) {
      commentary = 'Dot ball';
    } else {
      commentary = `${runsScored} run${runsScored !== 1 ? 's' : ''}`;
    }

    // Execute everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create BallEvent
      const ballEvent = await tx.ballEvent.create({
        data: {
          inningsId: activeInnings.id,
          overNumber: currentOver,
          ballNumber: currentBallInOver,
          batsmanName,
          batsmanId: batsmanId || null,
          bowlerName,
          bowlerId: bowlerId || null,
          runsScored,
          extraType: extraType || null,
          extraRuns: extraRuns || 0,
          isWicket,
          dismissalType: isWicket ? dismissalType || null : null,
          commentary,
        },
      });

      // 2. Update batsman's BattingEntry
      const batsmanEntry = activeInnings.battingEntries.find(
        (b) => b.playerName === batsmanName,
      );

      if (batsmanEntry) {
        const newRuns = batsmanEntry.runs + runsScored;
        // Byes/leg-byes don't count balls faced by batsman for extras,
        // but the ball IS faced. Wides are NOT faced.
        const addBall = extraType !== 'WIDE' ? 1 : 0;
        const newBallsFaced = batsmanEntry.ballsFaced + addBall;
        const newFours = batsmanEntry.fours + (runsScored === 4 ? 1 : 0);
        const newSixes = batsmanEntry.sixes + (runsScored === 6 ? 1 : 0);
        const newSR = newBallsFaced > 0 ? (newRuns / newBallsFaced) * 100 : 0;

        await tx.battingEntry.update({
          where: { id: batsmanEntry.id },
          data: {
            runs: newRuns,
            ballsFaced: newBallsFaced,
            fours: newFours,
            sixes: newSixes,
            strikeRate: Math.round(newSR * 100) / 100,
            ...(isWicket && dismissalType !== 'RETIRED'
              ? {
                  isOut: true,
                  dismissalType: dismissalType || null,
                  bowlerName: [
                    'BOWLED',
                    'CAUGHT',
                    'LBW',
                    'HIT_WICKET',
                    'STUMPED',
                  ].includes(dismissalType)
                    ? bowlerName
                    : null,
                  bowlerId: [
                    'BOWLED',
                    'CAUGHT',
                    'LBW',
                    'HIT_WICKET',
                    'STUMPED',
                  ].includes(dismissalType)
                    ? bowlerId || null
                    : null,
                  fielderName: fielderName || null,
                }
              : {}),
          },
        });
      }

      // 3. Update bowler's BowlingEntry (auto-create if new bowler)
      let bowlerEntry = activeInnings.bowlingEntries.find(
        (b) => b.playerName === bowlerName,
      );

      if (!bowlerEntry) {
        // New bowler — auto-create a BowlingEntry
        bowlerEntry = await tx.bowlingEntry.create({
          data: {
            inningsId: activeInnings.id,
            playerName: bowlerName,
            playerId: bowlerId || null,
            bowlingOrder: activeInnings.bowlingEntries.length + 1,
            oversBowled: 0,
            maidens: 0,
            runsConceded: 0,
            wickets: 0,
            economy: 0,
            extras: 0,
            noBalls: 0,
            wides: 0,
          },
        });
      }

      if (bowlerEntry) {
        const addLegalBall = isLegalDelivery ? 1 : 0;
        const bowlerLegalBalls =
          Math.floor(bowlerEntry.oversBowled) * 6 +
          Math.round((bowlerEntry.oversBowled % 1) * 10) +
          addLegalBall;

        const newOversBowled =
          Math.floor(bowlerLegalBalls / 6) + (bowlerLegalBalls % 6) / 10;

        // Runs conceded: bat runs + extras (except byes/leg-byes which aren't bowler's fault)
        const bowlerRuns =
          extraType === 'BYE' || extraType === 'LEG_BYE'
            ? 0
            : totalRunsThisBall;
        const newRunsConceded = bowlerEntry.runsConceded + bowlerRuns;
        const newWickets =
          bowlerEntry.wickets +
          (isWicket &&
          ['BOWLED', 'CAUGHT', 'LBW', 'HIT_WICKET', 'STUMPED'].includes(
            dismissalType,
          )
            ? 1
            : 0);
        const fullOvers = Math.floor(bowlerLegalBalls / 6);
        const partialBalls = bowlerLegalBalls % 6;
        const totalBowlerOvers = fullOvers + partialBalls / 6;
        const newEconomy =
          totalBowlerOvers > 0 ? newRunsConceded / totalBowlerOvers : 0;

        const newExtras = bowlerEntry.extras + (extraType ? extraRuns || 0 : 0);
        const newNoBalls =
          bowlerEntry.noBalls + (extraType === 'NO_BALL' ? 1 : 0);
        const newWides = bowlerEntry.wides + (extraType === 'WIDE' ? 1 : 0);

        await tx.bowlingEntry.update({
          where: { id: bowlerEntry.id },
          data: {
            oversBowled: Math.round(newOversBowled * 10) / 10,
            runsConceded: newRunsConceded,
            wickets: newWickets,
            economy: Math.round(newEconomy * 100) / 100,
            extras: newExtras,
            noBalls: newNoBalls,
            wides: newWides,
          },
        });
      }

      // 4. Update innings totals
      const newTotalRuns = activeInnings.totalRuns + totalRunsThisBall;
      const newTotalWickets =
        activeInnings.totalWickets +
        (isWicket && dismissalType !== 'RETIRED' ? 1 : 0);
      const newExtras = activeInnings.extras + (extraType ? extraRuns || 0 : 0);

      // Calculate new total overs
      const newLegalBalls = legalBalls + (isLegalDelivery ? 1 : 0);
      const newTotalOvers =
        Math.floor(newLegalBalls / 6) + (newLegalBalls % 6) / 10;

      // Check if innings is complete
      let inningsComplete = false;
      const isAllOut = newTotalWickets >= maxWickets;
      const oversComplete = newLegalBalls >= maxOvers * 6;

      // For 2nd innings: check if target chased
      let targetChased = false;
      if (
        activeInnings.inningsNumber === 2 &&
        match.cricketInnings.length >= 1
      ) {
        const firstInnings = match.cricketInnings.find(
          (i) => i.inningsNumber === 1,
        );
        if (firstInnings && newTotalRuns > firstInnings.totalRuns) {
          targetChased = true;
        }
      }

      if (isAllOut || oversComplete || targetChased) {
        inningsComplete = true;
      }

      await tx.cricketInnings.update({
        where: { id: activeInnings.id },
        data: {
          totalRuns: newTotalRuns,
          totalWickets: newTotalWickets,
          totalOvers: Math.round(newTotalOvers * 10) / 10,
          extras: newExtras,
          isComplete: inningsComplete,
        },
      });

      // 5. If wicket and new batsman provided, create/activate new batsman entry
      if (isWicket && newBatsmanName && dismissalType !== 'RETIRED') {
        // Check if this batsman already has an entry
        const existingNewBatsman = activeInnings.battingEntries.find(
          (b) => b.playerName === newBatsmanName,
        );
        if (!existingNewBatsman) {
          await tx.battingEntry.create({
            data: {
              inningsId: activeInnings.id,
              playerName: newBatsmanName,
              playerId: newBatsmanId || null,
              battingOrder: activeInnings.battingEntries.length + 1,
              runs: 0,
              ballsFaced: 0,
              fours: 0,
              sixes: 0,
              strikeRate: 0,
              isOut: false,
            },
          });
        }
      }

      // 6. Auto-complete match after 2nd innings
      let matchCompleted = false;
      let winner = null;
      let winnerPlayerId = null;
      let advancedNextMatch = null;
      let newTournamentStatus = null;
      const playerIds = [match.playerAId, match.playerBId].filter(Boolean);

      if (inningsComplete && activeInnings.inningsNumber === 2) {
        const firstInnings = match.cricketInnings.find(
          (i) => i.inningsNumber === 1,
        );
        const firstInningsRuns = firstInnings?.totalRuns || 0;
        const secondInningsRuns = newTotalRuns;

        // Determine winner
        let winnerTeamName;
        if (secondInningsRuns > firstInningsRuns) {
          // Batting team (2nd innings) wins
          winnerTeamName = activeInnings.battingTeamName;
        } else {
          // Bowling team (2nd innings) / batting team (1st innings) wins
          winnerTeamName = activeInnings.bowlingTeamName;
        }

        winner = winnerTeamName;
        const isTeamA = winnerTeamName === match.teamA;
        winnerPlayerId = isTeamA ? match.playerAId : match.playerBId;

        // Set match scores (total runs for each team)
        const teamAInnings = match.cricketInnings.find(
          (i) => i.battingTeamName === match.teamA,
        );
        const teamBInnings = match.cricketInnings.find(
          (i) => i.battingTeamName === match.teamB,
        );

        const scoreA = teamAInnings
          ? teamAInnings.inningsNumber === activeInnings.inningsNumber
            ? newTotalRuns
            : teamAInnings.totalRuns
          : 0;
        const scoreB = teamBInnings
          ? teamBInnings.inningsNumber === activeInnings.inningsNumber
            ? newTotalRuns
            : teamBInnings.totalRuns
          : 0;

        await tx.match.update({
          where: { id: matchId },
          data: { scoreA, scoreB, completed: true },
        });

        matchCompleted = true;

        // Advance winner in tournament bracket (skip for standalone)
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

        // ──── Auto-sync player stats ────
        // Two-tier approach:
        //  1) Per-entry linking: iterate BattingEntry / BowlingEntry where
        //     playerId IS NOT NULL — aggregate only that player's own entries.
        //  2) Fallback: for match.playerAId / playerBId that have no per-entry
        //     links (legacy 1v1), aggregate the whole team as before.

        {
          // Fetch all innings with full entries for stat aggregation
          const allInnings = await tx.cricketInnings.findMany({
            where: { matchId },
            include: {
              battingEntries: true,
              bowlingEntries: true,
              ballEvents: true,
            },
          });

          // Collect every unique playerId from batting + bowling entries
          const entryPlayerIds = new Set();
          for (const inn of allInnings) {
            for (const be of inn.battingEntries) {
              if (be.playerId) entryPlayerIds.add(be.playerId);
            }
            for (const bwl of inn.bowlingEntries) {
              if (bwl.playerId) entryPlayerIds.add(bwl.playerId);
            }
          }

          // Also include match-level playerA/B links as fallback
          for (const pid of playerIds) {
            if (pid) entryPlayerIds.add(pid);
          }

          const allLinkedIds = [...entryPlayerIds];
          if (allLinkedIds.length === 0) {
            // No linked players at all — skip stat sync
          } else {
            // Get sport profiles for ALL linked players
            const sportProfiles = await tx.sportProfile.findMany({
              where: {
                userId: { in: allLinkedIds },
                sportType: 'CRICKET',
              },
            });

            const profileMap = {};
            for (const sp of sportProfiles) {
              profileMap[sp.userId] = sp;
            }

            // Determine which team each player belongs to
            // (from their entries' innings team, or from match-level link)
            function getPlayerTeam(pid) {
              // Check match-level links first
              if (pid === match.playerAId) return match.teamA;
              if (pid === match.playerBId) return match.teamB;
              // Otherwise infer from which innings they appear in
              for (const inn of allInnings) {
                if (inn.battingEntries.some((b) => b.playerId === pid))
                  return inn.battingTeamName;
                if (inn.bowlingEntries.some((b) => b.playerId === pid))
                  return inn.bowlingTeamName;
              }
              return null;
            }

            // Track which match-level playerIds got per-entry stats
            const handledByEntries = new Set();

            for (const pid of allLinkedIds) {
              const profile = profileMap[pid];
              if (!profile) continue; // no CRICKET sport profile

              const playerTeamName = getPlayerTeam(pid);
              if (!playerTeamName) continue;
              const didWin = winner === playerTeamName;

              // Check if this player has any per-entry links
              const hasEntryLinks = (() => {
                for (const inn of allInnings) {
                  if (inn.battingEntries.some((b) => b.playerId === pid))
                    return true;
                  if (inn.bowlingEntries.some((b) => b.playerId === pid))
                    return true;
                }
                return false;
              })();

              // Aggregate stats
              let totalRuns = 0;
              let totalBallsFaced = 0;
              let totalFours = 0;
              let totalSixes = 0;
              let totalWicketsTaken = 0;
              let totalOversBowled = 0;
              let totalRunsConceded = 0;
              let totalCatches = 0;

              if (hasEntryLinks) {
                // ── Per-entry aggregation: only this player's entries ──
                handledByEntries.add(pid);

                for (const inn of allInnings) {
                  // Batting: only entries with this player's id
                  for (const be of inn.battingEntries) {
                    if (be.playerId === pid) {
                      totalRuns += be.runs;
                      totalBallsFaced += be.ballsFaced;
                      totalFours += be.fours;
                      totalSixes += be.sixes;
                    }
                  }

                  // Bowling: only entries with this player's id
                  for (const bwl of inn.bowlingEntries) {
                    if (bwl.playerId === pid) {
                      totalWicketsTaken += bwl.wickets;
                      totalRunsConceded += bwl.runsConceded;
                      totalOversBowled += bwl.oversBowled;
                    }
                  }

                  // Catches: in innings where other team is batting, count ball
                  // events where fielderName matches this player. Since we store
                  // fielderName (not fielderId), also check battingEntry
                  // dismissals where fielderName matches.
                  if (inn.battingTeamName !== playerTeamName) {
                    for (const be of inn.battingEntries) {
                      if (
                        be.isOut &&
                        be.dismissalType === 'CAUGHT' &&
                        be.fielderName
                      ) {
                        // Try to match fielder to this player by name
                        // (fielder linking could be improved in future)
                        totalCatches++; // conservative: count as team catch
                      }
                    }
                    // Only count catches for this player if they're the sole linked
                    // fielder. Subtract duplicates below when multiple players linked.
                  }
                }

                // For catches, remove team-level double-counting when multiple
                // players are linked. Divide equally if we can't identify fielder.
                // Better approach: only count catches where fielderName matches
                // one of the player's known names. For now, attribute catches only
                // if there's exactly one linked player on that team.
                const teamLinkedCount = allLinkedIds.filter(
                  (id) => getPlayerTeam(id) === playerTeamName,
                ).length;
                if (teamLinkedCount > 1) {
                  // Can't attribute catches individually without fielderId
                  // so reset per-player catches to 0 for safety
                  totalCatches = 0;
                }
              } else {
                // ── Legacy fallback: whole-team aggregation (1v1 format) ──
                for (const inn of allInnings) {
                  if (inn.battingTeamName === playerTeamName) {
                    for (const be of inn.battingEntries) {
                      totalRuns += be.runs;
                      totalBallsFaced += be.ballsFaced;
                      totalFours += be.fours;
                      totalSixes += be.sixes;
                    }
                  }
                  if (inn.bowlingTeamName === playerTeamName) {
                    for (const bwl of inn.bowlingEntries) {
                      totalWicketsTaken += bwl.wickets;
                      totalRunsConceded += bwl.runsConceded;
                      totalOversBowled += bwl.oversBowled;
                    }
                  }
                  if (inn.battingTeamName !== playerTeamName) {
                    for (const be of inn.battingEntries) {
                      if (be.isOut && be.dismissalType === 'CAUGHT') {
                        totalCatches++;
                      }
                    }
                  }
                }
              }

              // Calculate derived stats
              const avgStrikeRate =
                totalBallsFaced > 0
                  ? Math.round((totalRuns / totalBallsFaced) * 100 * 100) / 100
                  : 0;

              const decOvers =
                Math.floor(totalOversBowled) +
                ((totalOversBowled % 1) * 10) / 6;
              const avgEconomy =
                decOvers > 0
                  ? Math.round((totalRunsConceded / decOvers) * 100) / 100
                  : 0;

              const metrics = {
                runs: totalRuns,
                balls_faced: totalBallsFaced,
                fours: totalFours,
                sixes: totalSixes,
                strike_rate: avgStrikeRate,
                wickets: totalWicketsTaken,
                overs_bowled: Math.round(totalOversBowled * 10) / 10,
                runs_conceded: totalRunsConceded,
                economy: avgEconomy,
                catches: totalCatches,
                match_result: didWin ? 1 : 0,
              };

              // Check if stat entry already exists for this match + profile
              const existing = await tx.statEntry.findFirst({
                where: { matchId, sportProfileId: profile.id },
              });

              if (!existing) {
                const isTeamA = playerTeamName === match.teamA;
                const opponent = isTeamA ? match.teamB : match.teamA;
                await tx.statEntry.create({
                  data: {
                    sportProfileId: profile.id,
                    matchId,
                    date: new Date(),
                    opponent,
                    notes: match.isStandalone
                      ? 'Auto-synced from Standalone Match'
                      : `Auto-synced from ${match.tournament.name}`,
                    metrics,
                    source: match.isStandalone ? 'STANDALONE' : 'TOURNAMENT',
                  },
                });

                // Auto-update goals
                const goals = await tx.goal.findMany({
                  where: { sportProfileId: profile.id, completed: false },
                });
                for (const goal of goals) {
                  const metricValue = metrics[goal.metric];
                  if (
                    metricValue !== undefined &&
                    typeof metricValue === 'number'
                  ) {
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
          }
        }
      }

      return {
        ballEvent,
        inningsComplete,
        matchCompleted,
        winner,
        advancedNextMatch,
        newTournamentStatus,
        statsSynced: matchCompleted,
        innings: {
          totalRuns: newTotalRuns,
          totalWickets: newTotalWickets,
          totalOvers: Math.round(newTotalOvers * 10) / 10,
          extras: newExtras,
          isComplete: inningsComplete,
        },
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[cricket/ball] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
