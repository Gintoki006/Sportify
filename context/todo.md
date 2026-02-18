# Sportify — Development To-Do List

---

## Phase 1: Project Setup

- [x] Initialize Next.js project with JavaScript
- [x] Install and configure Tailwind CSS (colors, fonts from design doc)
- [x] Install core dependencies (React, Recharts, Clerk, Axios/fetch wrapper)
- [x] Set up folder structure: `/app`, `/components`, `/lib`, `/prisma`, `/public`, `/server`
- [x] Configure environment variables (.env.local) for Supabase, Clerk keys
- [x] Initialize Prisma and connect to Supabase PostgreSQL
- [x] Set up Express.js backend project in `/server` with Node.js
- [x] Add ESLint and Prettier configuration

---

## Phase 2: Database Schema (Prisma)

- [x] Create `User` model (id, name, email, avatarUrl, clerkId, createdAt)
- [x] Create `SportProfile` model (id, userId, sportType enum, createdAt)
- [x] Create `StatEntry` model (id, sportProfileId, date, opponent, notes, metrics JSON, source enum [manual | tournament])
- [x] Create `Goal` model (id, sportProfileId, metric, target, current, deadline, completed)
- [x] Create `Club` model (id, name, adminUserId, members relation)
- [x] Create `Tournament` model (id, clubId, name, sportType, startDate, endDate, status)
- [x] Create `Match` model (id, tournamentId, round, teamA, teamB, scoreA, scoreB, date, completed)
- [x] Define sport type enum: FOOTBALL, CRICKET, BASKETBALL, BADMINTON, TENNIS, VOLLEYBALL
- [x] Run initial migration (`prisma migrate dev`)
- [x] Generate Prisma client

---

## Phase 3: Authentication (Clerk)

- [x] Install `@clerk/nextjs`
- [x] Wrap app in `<ClerkProvider>`
- [x] Build sign-up page (`/sign-up`)
- [x] Build sign-in page (`/sign-in`)
- [x] Add password reset flow
- [x] Create auth middleware to protect `/dashboard` and `/api` routes
- [x] Sync Clerk user to database `User` model on first login (webhook or middleware)

---

## Phase 4: Landing Page (Public)

- [x] Build top navbar (Logo, Home, About Us, Events, Membership, Contact Us CTA)
- [x] Build hero section (headline, subtext, Get Started button, member count badge)
- [x] Build sport filter chips row (Basketball, Volleyball, Football, Tennis)
- [x] Build featured events card mosaic (photo cards with title and description)
- [x] Build About Us section (mission text, image grid)
- [x] Build newsletter / CTA banner ("Latest updates, special Offers, Event Invitations")
- [x] Build footer (About links, social icons, copyright)
- [x] Make landing page fully responsive (mobile, tablet, desktop)

---

## Phase 5: Onboarding Flow

- [x] Build sport selection screen (image-backed tile grid, multi-select toggles)
- [x] Build profile creation form (name, avatar upload, bio)
- [x] Build first goal prompt card (pick sport → pick metric → set target)
- [x] Save sport profiles and initial goal to database on completion
- [x] Redirect to dashboard after onboarding

---

## Phase 6: Dashboard (Authenticated Home)

- [x] Build dashboard layout with sidebar/top navigation
- [x] Build greeting header with weekly activity summary
- [x] Build goal progress rings (circular progress bars per active goal)
- [x] Build recent activity feed (chronological stat entries, sport-colored tags)
- [x] Build trend charts section using Recharts (line/bar chart, sport toggle)
- [x] Fetch and display data from API routes
- [x] Add loading skeletons and empty states

---

## Phase 7: Stat Entry Module

- [x] Build floating "Add (+)" button (global, visible on all authenticated pages)
- [x] Build sport selector step in entry modal
- [x] Build dynamic form fields per sport:
- [x] Football: goals, assists, shots on target, shots taken
- [x] Cricket: runs, wickets, batting average
- [x] Basketball: points scored, shots taken, shots on target, scoring efficiency
- [x] Badminton: match wins, points scored
- [x] Tennis: match wins, points scored
- [x] Volleyball: spikes, blocks, serves, digs
- [x] Add date picker (default today), opponent field, notes field
- [x] Add form validation (required fields, number ranges)
- [x] POST stat entry to API and update dashboard state in real time
- [x] Show success animation on save

---

## Phase 8: Goals & Progress

- [x] Build goal creation form (select sport, metric, numeric target, deadline)
- [x] Build goal list view with progress bars
- [x] Auto-update goal progress when new stat entries are saved
- [x] Mark goal as completed when target is reached
- [x] Build goal history / completed goals section

---

## Phase 9: User Profile

- [x] Build profile page with avatar, name, bio, joined date
- [x] Build tabbed sport breakdown (one tab per selected sport)
- [x] Show per-sport stat summary and history table
- [x] Show goals (active and completed) per sport
- [x] Allow profile editing (name, avatar, sport preferences)

---

## Phase 10: Club & Tournament Module

- [x] Build club creation form (name, sport, description)
- [x] Build member invite / join flow
- [x] Build tournament creation form (name, sport, date range, bracket size)
- [x] Build bracket visualization component (single elimination tree)
- [x] Build match scheduling UI (assign teams/players, set dates)
- [x] Build admin score entry modal per match
- [x] Auto-sync match results to participating players' StatEntry records (source: tournament)
- [x] Add data deduplication check (prevent manual + tournament double-count)
- [x] Build tournament standings / leaderboard view

---

## Phase 11: Backend API Routes

- [x] `POST /api/users` — create/sync user from Clerk
- [x] `GET /api/users/:id` — get user profile
- [x] `PUT /api/users/:id` — update profile
- [x] `POST /api/sport-profiles` — add sport to user
- [x] `GET /api/sport-profiles/:userId` — list user sports
- [x] `POST /api/stats` — create stat entry
- [x] `GET /api/stats/:sportProfileId` — list stat entries
- [x] `POST /api/goals` — create goal
- [x] `GET /api/goals/:userId` — list goals
- [x] `PUT /api/goals/:id` — update goal progress
- [x] `POST /api/clubs` — create club
- [x] `POST /api/tournaments` — create tournament
- [x] `GET /api/tournaments/:id` — get tournament with bracket
- [x] `PUT /api/matches/:id/score` — submit match score
- [x] Add input validation and error handling on all routes
- [x] Add auth middleware (verify Clerk session) on all protected routes

---

## Phase 12: Polish & QA

- [x] Responsive design pass on all pages (mobile-first)
- [x] Add loading states, error boundaries, and toast notifications
- [x] Performance audit (dashboard loads < 2 seconds)
- [x] Accessibility check (keyboard nav, aria labels, contrast ratios)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [x] Write seed script for demo data (sample users, stats, tournaments)

---

## Phase 13: Deployment & Launch

- [x] Add `postinstall` script for `prisma generate` on Vercel
- [x] Install Vercel CLI globally
- [x] Login to Vercel (`vercel login`)
- [x] Deploy to Vercel (`vercel --prod`)
- [x] Set production environment variables in Vercel dashboard
- [x] Configure Clerk production instance + webhook endpoint
- [x] Confirm Supabase database connectivity in production
- [x] Final smoke test on production
- [x] Prepare launch checklist and release notes

---

## Phase 14: Club Management (Admin Features)

### 14.1 Edit Club Details

- [x] Add "Edit Club" button on club detail page (visible only to admin)
- [x] Build club edit form (name, description)
- [x] Create `PUT /api/clubs/[clubId]` API route for updating club details
- [x] Add input validation and error handling on edit route
- [x] Show success toast on save, update UI in real time

### 14.2 Delete Club

- [x] Add "Delete Club" button with confirmation modal (admin only)
- [x] Create `DELETE /api/clubs/[clubId]` API route
- [x] Handle cascading cleanup (tournaments, matches, memberships)
- [x] Redirect admin to clubs list page after deletion
- [x] Show success toast on deletion

### 14.3 Admin Member Management

- [x] Build members list view on club detail page (avatar, name, role)
- [x] Add "Remove Member" button per member row (admin only, with confirmation)
- [x] Create `DELETE /api/clubs/[clubId]/members/[userId]` API route
- [x] Add "Add Member" / "Invite Member" button (admin only)
- [x] Build member search/invite modal (search users by name or email)
- [x] Create `POST /api/clubs/[clubId]/members` API route for adding members
- [x] Prevent admin from removing themselves
- [x] Update member count and list in real time after add/remove
- [x] Add proper authorization checks (only club admin can manage members)

### 14.4 UI/UX Polish

- [x] Ensure all admin actions are hidden from non-admin users
- [x] Add loading states for edit, delete, and member management actions
- [x] Mobile-responsive design for club management views
- [x] Accessibility pass (keyboard nav, aria labels) on new components

---

## Phase 15: Club & Tournament Roles System

### 15.1 Database Schema Updates

- [x] Add `ClubRole` enum to Prisma schema: `ADMIN`, `HOST`, `PARTICIPANT`, `SPECTATOR`
- [x] Add `role` field to `ClubMember` model (default: `SPECTATOR`)
- [x] Run migration (`prisma migrate dev`)
- [x] Update seed script with role assignments for demo data

### 15.2 Role Definitions & Permissions

- [x] **Admin** — full control: edit/delete club, manage members & roles, create tournaments, enter scores
- [x] **Host** — can create & manage tournaments, schedule matches, enter scores (cannot delete club or manage roles)
- [x] **Participant** — can join tournaments, view brackets, view scores (cannot create tournaments or enter scores)
- [x] **Spectator** — view-only: can see club info, tournament brackets, scores, and standings (cannot join tournaments)
- [x] Build a permissions helper (`lib/clubPermissions.js`) mapping each role to allowed actions

### 15.3 Backend API Updates

- [x] Update `POST /api/clubs/[clubId]/members` to accept optional `role` param (default: `SPECTATOR`)
- [x] Create `PUT /api/clubs/[clubId]/members/[userId]` API route for changing a member's role (admin only)
- [x] Update `GET /api/clubs/[clubId]` to include `role` in member data
- [x] Update tournament creation API — restrict to `ADMIN` and `HOST` roles
- [x] Update score entry API — restrict to `ADMIN` and `HOST` roles
- [x] Update tournament join/participation — restrict to `PARTICIPANT` and above
- [x] Add role-based authorization checks on all protected club actions

### 15.4 Join Flow Updates

- [x] Update club join flow — new members default to `SPECTATOR`
- [x] Add role selection when admin adds a member (dropdown: Host, Participant, Spectator)
- [x] Allow users to request role upgrade (Spectator → Participant) with admin or tournament host approval
- [x] Show role badge next to member name in join confirmation

### 15.5 Member List & Role Management UI

- [x] Display role badge (color-coded) next to each member in the members list
- [x] Add "Change Role" dropdown per member row (admin only)
- [x] Build role change confirmation modal
- [x] Prevent admin from demoting themselves
- [x] Show toast on successful role change, update UI in real time

### 15.6 UI Permissions Enforcement

- [x] Hide "Create Tournament" button from Spectators and Participants
- [x] Hide score entry modal from Spectators and Participants
- [x] Hide "Edit Club" / "Delete Club" from non-Admin members
- [x] Hide member management (add/remove/role change) from non-Admin members
- [x] Show "Join Tournament" button only for Participants (and above)
- [x] Spectators see read-only views of brackets, scores, and standings
- [x] Add role indicator in club header (show current user's role)

### 15.7 Tournament Participation Integration

- [x] Only allow `PARTICIPANT` (and above) to be added as tournament teams/players
- [x] Auto-assign `PARTICIPANT` role when a Spectator is added to a tournament (with confirmation)
- [x] Filter player/team selection to show only Participants when creating tournaments
- [x] Show participation status on member cards (e.g., "In 2 tournaments")

### 15.8 Polish & Testing

- [x] Ensure backward compatibility (existing members default to current behavior)
- [x] Add loading states for role change actions
- [x] Mobile-responsive role management UI
- [x] Accessibility pass on role badges, dropdowns, and modals
- [x] Test all permission boundaries (verify Spectator can't access Host actions, etc.)

---

## Phase 16: Tournament Player Linking & Invites

### 16.1 Database Schema Updates

- [x] Add `playerAId` (optional) and `playerBId` (optional) fields to `Match` model — link each side to a `User` record
- [x] Add `TournamentPlayer` join model (tournamentId, userId, seed/slot) for tracking tournament participants
- [x] Run migration (`prisma migrate dev`) — migration `20260216172544_add_player_linking`
- [x] Backfill script: for existing tournaments, attempt to link matches to users by name matching (`prisma/backfill-player-links.mjs`)
- [x] Update seed script with `TournamentPlayer` records and `playerAId`/`playerBId` on demo matches

### 16.2 Tournament Creation — Direct Member Selection

- [x] Refactor `CreateTournamentModal` player picker to store both `userId` and display name per slot
- [x] Pass `playerUserIds` array (ordered by bracket slot) to tournament creation API
- [x] Update `POST /api/tournaments` to save `playerAId`/`playerBId` on Round 1 matches using the ordered player list
- [x] Create `TournamentPlayer` records for all selected users on tournament creation
- [x] When advancing winner to next round, propagate `playerAId`/`playerBId` alongside team name

### 16.3 Invite Non-Members from Tournament Creation

- [x] Add "Invite & Add" option in the player picker for users not yet in the club
- [x] Integrate user search (reuse existing search API) within tournament creation modal
- [x] Auto-add invited user to club as `PARTICIPANT` + add to bracket slot in one flow
- [x] Show invited user badge/status in the player picker UI
- [x] Handle edge case: invited user already in another slot

### 16.4 Score Sync — Use Player IDs Instead of Name Matching

- [x] Refactor `PUT /api/matches/[matchId]/score` to use `playerAId`/`playerBId` for stat sync (fall back to name matching for legacy matches)
- [x] Pass `playerAId`/`playerBId` when advancing winner to next round match
- [x] Ensure stat entries are reliably created for linked users regardless of display name changes
- [x] Verify goal auto-progress still works with the new linking

### 16.5 UI Enhancements

- [x] Show linked player avatars in bracket visualization (tournament detail page)
- [x] Add clickable player links to user profile from bracket/match cards
- [x] Show "Stats synced ✓" indicator on completed matches for linked players
- [x] Update standings/leaderboard to show avatars and profile links
- [x] Mobile-responsive invite flow within tournament creation

### 16.6 Polish & Testing

- [x] Test: scores update correct user profiles via player ID linking
- [x] Test: invite flow adds user to club and bracket in one action
- [x] Test: winner advancement carries player IDs through bracket rounds
- [x] Test: legacy tournaments (no player IDs) still work with name-based fallback
- [x] Test: goals auto-progress when tournament stats are synced
- [x] Accessibility pass on updated bracket UI and invite flow

---

## Phase 17: Tournament Management (Edit, Delete, Bracket Editing)

### 17.1 Edit Tournament Details

- [x] Add `PUT /api/tournaments/[tournamentId]` endpoint — update name, sportType, startDate, endDate, status
- [x] Permission-gated: only ADMIN and HOST roles (uses `editTournament` permission)
- [x] Edit Tournament modal in `TournamentDetailClient` with sport picker, status selector, date fields

### 17.2 Delete Tournament

- [x] Add `DELETE /api/tournaments/[tournamentId]` endpoint — cascade deletes matches, TournamentPlayer records, stat entries
- [x] Permission-gated: only ADMIN and HOST roles (uses `deleteTournament` permission)
- [x] Delete confirmation modal with "type DELETE" safety check on tournament detail page
- [x] Quick delete button (with confirm dialog) on tournament cards in club detail page

### 17.3 Edit Bracket / Match Teams

- [x] Add `PUT /api/matches/[matchId]` endpoint — edit teamA, teamB, playerAId, playerBId on unplayed matches
- [x] Permission-gated: only ADMIN and HOST roles (uses `editTournament` permission)
- [x] Edit Match modal in bracket view — text fields + player dropdown to swap/assign teams
- [x] Prevents editing completed matches (must reset score first)

### 17.4 Reset Match Scores

- [x] Add `POST /api/matches/[matchId]/reset` endpoint — clears score, cascades through downstream bracket
- [x] Cascade logic: resets all downstream matches whose slots were filled by the winner of this match
- [x] Deletes auto-synced stat entries for all reset matches
- [x] Reverts tournament status from COMPLETED → IN_PROGRESS if needed
- [x] Reset button on completed match cards (with confirmation prompt)

### 17.5 Management UI

- [x] "Manage" dropdown button in tournament header (visible to ADMIN/HOST only)
- [x] Edit and Reset buttons on each match card (contextual: Edit for unplayed, Reset for completed)
- [x] Server component passes `canManageTournament` and `clubMembers` to client component
- [x] All management actions provide real-time UI updates without full page reload

---

## Phase 18: Cricket Live Scoring & Match Detail

### 18.1 Database Schema — Cricket Models

- [x] Create `CricketInnings` model (id, matchId, battingTeamName, bowlingTeamName, totalRuns, totalWickets, totalOvers, extras, isComplete, createdAt)
- [x] Create `BattingEntry` model (id, inningsId, playerId?, playerName, runs, ballsFaced, fours, sixes, strikeRate, isOut, dismissalType, bowlerId?, bowlerName?, fielderName?, battingOrder)
- [x] Create `BowlingEntry` model (id, inningsId, playerId?, playerName, oversBowled Float, maidens, runsConceded, wickets, economy, extras, noBalls, wides)
- [x] Create `BallEvent` model (id, inningsId, overNumber, ballNumber, batsmanId?, batsmanName, bowlerId?, bowlerName, runsScored, extraType?, extraRuns, isWicket, dismissalType?, commentary?, timestamp)
- [x] Add relations: `CricketInnings` → `Match`, `BattingEntry` → `CricketInnings`, `BowlingEntry` → `CricketInnings`, `BallEvent` → `CricketInnings`
- [x] Add `DismissalType` enum: `BOWLED`, `CAUGHT`, `LBW`, `RUN_OUT`, `STUMPED`, `HIT_WICKET`, `RETIRED`, `NOT_OUT`
- [x] Add `ExtraType` enum: `WIDE`, `NO_BALL`, `BYE`, `LEG_BYE`, `PENALTY`
- [x] Add `overs` and `playersPerSide` fields to Tournament model (for cricket config: T5, T10, T20, etc.)
- [x] Run migration (`prisma migrate dev`)

### 18.2 Cricket Match Configuration

- [x] Update `CreateTournamentModal` — when sport is CRICKET, show overs selector (5, 10, 15, 20) and players per side (2–11)
- [x] Update `POST /api/tournaments` to save `overs` and `playersPerSide` on cricket tournaments
- [x] Validate cricket-specific fields during tournament creation
- [x] Update `PUT /api/tournaments/[tournamentId]` to accept `overs` and `playersPerSide` edits
- [x] Update GET endpoint and server page to pass `overs` / `playersPerSide` to client
- [x] Show cricket config badges (overs, players-per-side) on tournament detail header

### 18.3 Cricket Scoring API

- [x] Create `POST /api/matches/[matchId]/cricket/start` — initialize innings with batting/bowling lineup, set toss winner
- [x] Create `POST /api/matches/[matchId]/cricket/ball` — record individual ball (runs, extras, wicket, dismissal type, batsman, bowler)
- [x] Auto-calculate: strike rate, economy rate, over completion, batting/bowling aggregates after each ball
- [x] Auto-detect innings completion (all out, overs completed, or target chased)
- [x] Auto-swap innings (1st → 2nd) when innings completes; set chase target
- [x] Auto-complete match when 2nd innings finishes — determine winner, advance in tournament bracket
- [x] Create `GET /api/matches/[matchId]/cricket` — full scorecard (both innings, batting, bowling, ball-by-ball, fall of wickets)
- [x] Create `PUT /api/matches/[matchId]/cricket/undo` — undo last ball delivery (for corrections)
- [x] Permission-gated: only ADMIN and HOST roles can score (uses `enterScores` permission)

### 18.4 Live Score Polling

- [x] Create `GET /api/matches/[matchId]/cricket/live` — lightweight live score endpoint (current score, overs, batsmen on crease, current bowler, last 6 balls, run rate)
- [x] Client-side polling (every 5 seconds) on match detail page for non-scorers
- [x] Show live indicator (pulsing dot + "LIVE") on ongoing matches
- [x] Auto-update scorecard, batting/bowling tables, and ball-by-ball feed in real time

### 18.5 Cricket Scorecard UI — Match Detail Page

- [x] Build full scorecard view: batting table (Player, R, B, 4s, 6s, SR, Dismissal), bowling table (Player, O, M, R, W, Econ, Extras)
- [x] Build ball-by-ball timeline / over-by-over summary (visual wagon wheel: dots, runs color-coded, wickets highlighted)
- [x] Show partnership tracker (current partnership runs, balls, run rate)
- [x] Show fall of wickets summary (score at each wicket)
- [x] Show match summary header: Team A score/overs vs Team B score/overs, result, man of the match
- [x] Build innings tab switcher (1st Innings / 2nd Innings)
- [x] Mobile-responsive scorecard (horizontal scroll for tables, stacked cards on small screens)

### 18.6 Live Scoring Interface (Scorer View)

- [x] Build scorer control panel: run buttons (0, 1, 2, 3, 4, 6), extras (Wide, No Ball, Bye, Leg Bye), Wicket button
- [x] Batsman/bowler selectors at top of scorer panel with strike rotation logic
- [x] Wicket flow: select dismissal type → fielder (if catch/run-out) → new batsman in → confirm
- [x] Over-end flow: auto-prompt bowler change, show over summary
- [x] Undo last ball button with confirmation
- [x] Show mini scorecard alongside scorer controls (current score, overs, batsmen, bowler)
- [x] End-of-innings flow: show innings summary → swap sides → select new batting order
- [ ] Keyboard shortcuts for quick scoring (1–6 keys for runs, W for wicket, E for extras)

### 18.7 Ongoing Matches Tab in Tournament View

- [x] Add "Live Matches" tab to tournament detail page (alongside Bracket and Standings)
- [x] Show cards for all in-progress matches with mini live scorecards (team scores, overs, current batsmen)
- [x] Clicking a live match card navigates to the full match detail / scorecard page
- [x] Show match status: "In Progress", "Innings Break", "Completed"
- [x] Pulsing LIVE badge on ongoing match cards
- [x] Auto-poll to update live match cards every 10 seconds

### 18.8 Player Stats Integration

- [x] After match completion, auto-sync batting & bowling stats to player's `StatEntry` records
- [x] Cricket stat metrics expanded: runs, balls faced, 4s, 6s, strike rate, wickets, overs bowled, economy, catches
- [x] Update dashboard trend charts to show cricket-specific stats (runs per match, SR trend, wickets per match)
- [x] Update player profile cricket tab with tournament batting/bowling averages

### 18.9 Polish & Testing

- [x] Test: ball-by-ball scoring flows correctly through full innings
- [x] Test: extras (wides, no-balls) don't count as legal deliveries
- [x] Test: wicket dismissals correctly update batting order and fall of wickets
- [x] Test: innings auto-complete at overs limit or all out
- [x] Test: 2nd innings target chase logic (match ends when target is passed)
- [x] Test: undo ball correctly rolls back all aggregates
- [x] Test: live polling shows real-time updates for spectators
- [x] Test: match completion auto-advances winner in tournament bracket
- [x] Test: player stats sync correctly after cricket match completion
- [x] Accessibility pass on scorer interface and scorecard views
- [x] Mobile-responsive testing for scorer controls and live scorecard

---

## Phase 19: Team Sports — Team Names at Creation, Member Linking at Scoring

### 19.1 Add Sport Category Constants

- [x] Create `TEAM_SPORTS` and `INDIVIDUAL_SPORTS` constants in `lib/sportMetrics.js` (or a new `lib/sportConstants.js`)
- [x] `TEAM_SPORTS = ['FOOTBALL', 'CRICKET', 'BASKETBALL', 'VOLLEYBALL']`
- [x] `INDIVIDUAL_SPORTS = ['TENNIS', 'BADMINTON']`
- [x] Add helper: `isTeamSport(sportType)` → returns boolean

### 19.2 Update CreateTournamentModal UI

- [x] Detect if selected `sportType` is a team sport using `isTeamSport()`
- [x] **Team sports**: Hide the "Select from members" / "Use custom names" toggle — force free-text team name inputs only
- [x] **Team sports**: Remove the `+ Invite` button per slot (no member invites needed)
- [x] **Team sports**: Remove member dropdown/search from bracket slot UI
- [x] **Individual sports**: Keep existing member picker + invite flow unchanged
- [x] Update placeholder text for team sports (e.g., "Enter team name" instead of "Player name")

### 19.3 Update Tournament Creation API

- [x] Update `POST /api/tournaments` — detect team vs individual sport
- [x] **Team sports**: Skip validation that checks team names against club member names
- [x] **Team sports**: Don't send or process `playerUserIds` — set `playerAId`/`playerBId` to `null` on all matches
- [x] **Team sports**: Skip creation of `TournamentPlayer` records
- [x] **Individual sports**: Keep current behavior (member linking, `TournamentPlayer` creation, player ID propagation)

### 19.4 Cricket — Member Linking at Scoring Time

- [x] Update `StartInningsModal` UI — replace free-text batting lineup inputs with **club member autocomplete/dropdown**
- [x] Each lineup slot resolves to `{ name, playerId }` where `playerId` is the club member's `userId`
- [x] Update `ScorerModal` / `NewBowlerButton` — new bowler and new batsman inputs offer member autocomplete so `playerId` values are sent
- [x] Send `playerId` values in API calls: `battingLineup[].playerId`, `bowler.playerId`, `batsmanId`, `bowlerId`, `newBatsmanId` (plumbing already exists in API/schema)
- [x] Allow optional freeform names for unlinked/casual players (member linking is optional, not forced)
- [x] Pass club members list to `CricketMatchClient` from the server component / tournament detail page
- [x] Fix new bowler creation gap — auto-create `BowlingEntry` when ball API receives a bowler name with no existing entry

### 19.5 Cricket — Per-Player Stat Sync Refactor

- [x] Refactor cricket stat sync at match completion — instead of aggregating all entries for a team to one `playerAId`/`playerBId`, iterate individual `BattingEntry`/`BowlingEntry` records with non-null `playerId`
- [x] Create individual `StatEntry` records per linked player with their actual batting stats (runs, balls faced, 4s, 6s, SR)
- [x] Create individual `StatEntry` records per linked bowler with their actual bowling stats (overs, maidens, runs conceded, wickets, economy)
- [x] Fall back to team-level aggregation for entries without `playerId` (unlinked players)
- [x] Verify goal auto-progression works with per-player stat entries

### 19.6 Non-Cricket Team Sports — Per-Player Scoring at Match Time

- [x] Expand `ScoreEntryModal` for Football — after entering `scoreA`/`scoreB`, show optional per-player stat form (goals, assists, shots on target per player)
- [x] Expand `ScoreEntryModal` for Basketball — per-player stat form (points scored, shots taken, shots on target, scoring efficiency)
- [x] Expand `ScoreEntryModal` for Volleyball — per-player stat form (spikes, blocks, serves, digs)
- [x] Add club member picker in expanded score modal — select which members played for each team
- [x] Keep `scoreA`/`scoreB` as the required team-level input; per-player stats are optional
- [x] Update `PUT /api/matches/[matchId]/score` to accept optional `playerStats[]` array with per-player metrics keyed by `userId`
- [x] Create individual `StatEntry` records for each player with their attributed stats
- [x] Fall back to current behavior (no individual stats) if no `playerStats` provided

### 19.7 Shared Member Picker Component

- [x] Build reusable `MemberAutocomplete` component — accepts club members list, returns `{ name, userId }`
- [x] Support search/filter by name within the dropdown
- [x] Allow freeform text entry for unlinked/guest players (returns `{ name, userId: null }`)
- [x] Use in: cricket `StartInningsModal`, cricket `NewBowlerButton`/`NewBatsmanModal`, non-cricket `ScoreEntryModal`
- [x] Pass club members to scoring components from the server/parent page

### 19.8 Update Winner Advancement

- [x] Ensure winner advancement for team sports only carries `teamA`/`teamB` strings (no `playerAId`/`playerBId` propagation)
- [x] Verify bracket visualization works with team names and no player avatars for team sports

### 19.9 Update Tournament Detail UI

- [x] Hide "Stats synced ✓" indicator on team sport match cards at bracket level (stats sync happens per-player at scoring time instead)
- [x] Show "Player stats recorded" indicator on matches where per-player stats were entered
- [x] Hide player avatar overlays on bracket slots for team sports (avatars show in scorecard, not bracket)
- [x] Hide profile links on team names in bracket for team sports
- [x] Show player avatars + profile links only for individual sports in bracket view

### 19.10 Update Edit Match & Reset Flows

- [x] Update `PUT /api/matches/[matchId]` (edit match) — for team sports, don't show player-linking dropdown; only allow team name text editing
- [x] Update `POST /api/matches/[matchId]/reset` — for team sports, delete per-player `StatEntry` records that were created during scoring
- [x] For cricket reset, also clean up `BattingEntry`/`BowlingEntry` linked `playerId` references

### 19.11 Polish & Testing

- [x] Test: Creating a Football tournament shows only team name text inputs (no member picker)
- [x] Test: Creating a Tennis tournament shows member picker with invite flow (existing behavior)
- [x] Test: Cricket scorer UI offers member autocomplete for batsmen/bowlers at innings start
- [x] Test: Cricket per-player stats sync correctly to individual player profiles after match completion
- [x] Test: Non-cricket team sport score modal allows optional per-player stat entry with member picker
- [x] Test: Per-player stats create individual `StatEntry` records linked to correct users
- [x] Test: Players without member linking (freeform names) don't generate `StatEntry` records
- [x] Test: Goals auto-progress from individually-linked scoring stats
- [x] Test: Winner advancement works correctly for both team and individual sports
- [x] Test: Resetting team sport matches cleans up per-player stat entries
- [x] Accessibility pass on member autocomplete component and updated scoring modals

---

## Phase 20: Unofficial / Standalone Matches (Non-Club, Anyone Can Host)

### 20.1 Database Schema Updates

- [x] Make `Match.tournamentId` optional (`String?`) and update relation to `Tournament?`
- [x] Add `sportType SportType?` field to `Match` — needed when there's no tournament to infer sport from
- [x] Add `createdByUserId String?` field to `Match` — tracks who created the standalone match (for permissions)
- [x] Add `isStandalone Boolean @default(false)` field to `Match` — explicit flag to distinguish from tournament matches
- [x] Add optional `overs Int?` and `playersPerSide Int?` fields to `Match` — for standalone cricket match config (since no tournament to inherit from)
- [x] Extend `StatSource` enum — add `STANDALONE` alongside `MANUAL` and `TOURNAMENT`
- [x] Run migration (`prisma migrate dev`)
- [x] Update Prisma client

### 20.2 Standalone Match Creation API

- [x] Create `POST /api/matches` — create a standalone match (no tournament/club required)
- [x] Accept fields: `sportType`, `teamA`, `teamB`, `date`, `overs?`, `playersPerSide?` (cricket), `playerAId?`, `playerBId?` (individual sports)
- [x] Set `isStandalone: true`, `createdByUserId` from session, `tournamentId: null`
- [x] For individual sports (Tennis, Badminton): accept `playerAId` / `playerBId` to link opponents at creation
- [x] For team sports: only require team names — player linking happens at scoring time (consistent with Phase 19)
- [x] Validate sport type, required fields, cricket-specific config
- [x] Auth required: any logged-in user can create a standalone match

### 20.3 Standalone Match Listing & Detail API

- [x] Create `GET /api/matches` — list standalone matches for the current user (created by them or they are a linked player)
- [x] Support query params: `?sport=CRICKET`, `?status=completed`, `?limit=20`
- [x] Create `GET /api/matches/[matchId]` — get standalone match detail (currently only fetched through tournament context)
- [x] Create `DELETE /api/matches/[matchId]` — delete standalone match (creator only, cascade cleanup of cricket innings/stat entries)
- [x] Create `PUT /api/matches/[matchId]` — edit standalone match details (creator only, before scoring starts)

### 20.4 Player Invite Flow

- [x] Add player search/invite when creating a standalone match — search all app users by name/email
- [x] For individual sports: invite resolves to `playerAId`/`playerBId` on the match
- [x] For team sports: invite players to a team roster (displayed on match detail, used during scoring for member linking)
- [x] Create `MatchInvite` model (or lightweight approach): `matchId`, `userId`, `team` ("A"/"B"), `status` (pending/accepted/declined)
- [x] Invited players see a notification or pending match on their dashboard
- [x] Accepting an invite links the player to the match; declining removes them
- [x] Allow the host to start the match without all invites accepted (unlinked slots remain freeform)

### 20.5 Standalone Match Scoring

- [x] Reuse or fork `PUT /api/matches/[matchId]/score` for standalone matches — skip bracket advancement logic, skip club role checks, just make sure that the person who created the standalone match can only change the scores not other members
- [x] Permission: only match creator (`createdByUserId`) can enter scores
- [x] For team sports: support optional `playerStats[]` per-player stat entry (reuse Phase 19.6 work)
- [x] For individual sports: auto-sync stats to `playerAId`/`playerBId` like tournaments do
- [x] Stats created with `source: 'STANDALONE'` so they're distinguishable on profile/dashboard
- [x] Auto-advance matching goals after stat creation

### 20.6 Standalone Cricket Match Scoring

- [x] Update `POST /api/matches/[matchId]/cricket/start` — allow standalone matches (skip tournament club-role check, use match-level `overs`/`playersPerSide` instead of tournament config)
- [x] Update `POST /api/matches/[matchId]/cricket/ball` — skip tournament-related logic for standalone matches
- [x] Update `GET /api/matches/[matchId]/cricket` — work for standalone matches (no tournament context needed)
- [x] Update `PUT /api/matches/[matchId]/cricket/undo` — work for standalone matches
- [x] Update `GET /api/matches/[matchId]/cricket/live` — work for standalone matches
- [x] Permission: match creator can score (instead of club ADMIN/HOST check)
- [x] Use member autocomplete for batsmen/bowlers from invited players list (reuse Phase 19.7 `MemberAutocomplete`)

### 20.7 Standalone Matches Page (UI)

- [x] Create `/dashboard/matches` page — list of user's standalone matches (created + invited)
- [x] Add "Matches" link to dashboard sidebar navigation
- [x] Build match list view: cards showing sport icon, teams, date, score, status (upcoming/in-progress/completed)
- [x] Filter/sort: by sport, by status, by date
- [x] Empty state: "No matches yet — create your first match!"
- [x] Add loading skeleton for matches page

### 20.8 Create Match Modal

- [x] Build `CreateMatchModal` component — accessible from matches page and floating "+" button
- [x] Step 1: Select sport type (reuse sport selector chips)
- [x] Step 2: Enter team/player names — for individual sports show player invite search; for team sports show team name inputs
- [x] Step 3: Cricket config (if CRICKET) — overs selector, players per side
- [x] Step 4: Set match date and optional notes
- [x] Submit creates the match + sends invites
- [x] Show success state with link to match detail

### 20.9 Standalone Match Detail Page

- [x] Create `/dashboard/matches/[matchId]` page — standalone match detail view
- [x] Show match header: sport badge, teams, date, status, score (if played)
- [x] Show invited players section with invite status (pending/accepted/declined)
- [x] Show "Enter Score" button for match creator (opens score modal or cricket scorer)
- [x] For cricket: reuse `CricketMatchClient` scorecard and scorer UI
- [x] For non-cricket: show simple score display + per-player stats (if entered)
- [x] Show "Stats synced" indicators for linked players
- [x] Show edit/delete buttons for match creator
- [x] Mobile-responsive layout

### 20.10 Dashboard Integration

- [x] Standalone match stats (source: `STANDALONE`) appear in dashboard activity feed alongside manual and tournament stats
- [x] Standalone match stats appear in trend charts and goal progress rings
- [x] Show "Upcoming Matches" widget on dashboard for pending standalone matches
- [x] Show recent standalone match results on dashboard
- [x] Profile page sport tabs include standalone match stats in per-sport summary

### 20.11 Notifications & Activity

- [x] Notify invited players when they receive a match invite (in-app notification or dashboard badge)
- [x] Notify invited players when match scores are entered (their stats have been synced)
- [x] Show standalone matches in user's recent activity feed with distinct styling (e.g., "Friendly Match" badge vs "Tournament" badge)
- [x] Add match invite accept/decline actions to notifications area

### 20.12 Polish & Testing

- [x] Test: Any logged-in user can create a standalone match without being in a club
- [x] Test: Individual sport matches (Tennis/Badminton) link players at creation and sync stats on scoring
- [x] Test: Team sport matches allow team names at creation and per-player linking at scoring
- [x] Test: Standalone cricket matches support full ball-by-ball scoring with match-level overs/playersPerSide config
- [x] Test: Invited players see the match on their dashboard and can accept/decline
- [x] Test: Stats with source `STANDALONE` appear on dashboard, trend charts, and profile
- [x] Test: Goals auto-progress from standalone match stats
- [x] Test: Match creator can edit/delete their match; other users cannot
- [x] Test: Deleting a standalone match cascades cleanup (cricket innings, stat entries, invites)
- [x] Test: Standalone matches are fully independent of clubs/tournaments (no club membership required)
- [x] Accessibility pass on create match modal, match detail page, and invite flow
- [x] Mobile-responsive testing for all standalone match views

---

## Phase 21: Football Live Match Scoring (Event-by-Event, Like Cricket)

### 21.1 Database Schema — Football Models

- [x] Create `FootballMatchData` model (id, matchId, halfDuration Int @default(45), extraTime Boolean, extraTimeDuration Int?, penaltyShootout Boolean, halfTimeScoreA Int, halfTimeScoreB Int, fullTimeScoreA Int, fullTimeScoreB Int, extraTimeScoreA Int?, extraTimeScoreB Int?, penaltyScoreA Int?, penaltyScoreB Int?, status enum [NOT_STARTED, FIRST_HALF, HALF_TIME, SECOND_HALF, EXTRA_TIME_FIRST, EXTRA_TIME_SECOND, PENALTIES, COMPLETED], createdAt)
- [x] Create `FootballPlayerEntry` model (id, footballMatchDataId, playerName, playerId? → User, team "A"|"B", isStarting Boolean, minuteSubbedIn Int?, minuteSubbedOut Int?, goals Int @default(0), assists Int @default(0), shotsOnTarget Int @default(0), fouls Int @default(0), yellowCards Int @default(0), redCards Int @default(0), minutesPlayed Int @default(0), createdAt)
- [x] Create `FootballEvent` model (id, footballMatchDataId, eventType enum [GOAL, YELLOW_CARD, RED_CARD, SUBSTITUTION, CORNER, PENALTY_KICK, PENALTY_SCORED, PENALTY_MISSED, OWN_GOAL, OFFSIDE, FOUL, HALF_TIME, FULL_TIME, KICK_OFF], minute Int, addedTime Int?, playerName String, playerId? → User, assistPlayerName String?, assistPlayerId? → User, team "A"|"B", description String?, createdAt)
- [x] Add `FootballEventType` enum to Prisma schema
- [x] Add `FootballMatchStatus` enum to Prisma schema
- [x] Add relations: `Match` → `FootballMatchData` (1:1), `FootballMatchData` → `FootballPlayerEntry[]`, `FootballMatchData` → `FootballEvent[]`
- [x] Run migration (`prisma migrate dev`)
- [x] Update Prisma client

### 21.2 Football Match Configuration

- [x] Update `CreateTournamentModal` — when sport is FOOTBALL, show half duration selector (30, 35, 40, 45 min) and squad size (5, 7, 11)
- [x] Update `CreateMatchModal` — for standalone football matches, show half duration and squad size options
- [x] Add `halfDuration` and `squadSize` fields to Match model (optional, for standalone football config)
- [x] Update `POST /api/tournaments` to save football config on FOOTBALL tournaments
- [x] Show football config badges (half duration, squad size) on tournament/match detail header

### 21.3 Football Match Setup API

- [x] Create `POST /api/matches/[matchId]/football/setup` — initialize match with team lineups
- [x] Accept: `{ teamAPlayers: [{name, playerId?}], teamBPlayers: [{name, playerId?}], halfDuration? }`
- [x] Create `FootballMatchData` record (matchId, status: NOT_STARTED, halfDuration)
- [x] Create `FootballPlayerEntry` records for all players (both teams, isStarting: true)
- [x] Permission: match creator (standalone) or ADMIN/HOST (tournament)
- [x] Validate: minimum players per team, no duplicate players

### 21.4 Football Event Recording API

- [x] Create `POST /api/matches/[matchId]/football/event` — record a match event
- [x] Accept: `{ eventType, minute, addedTime?, playerName, playerId?, assistPlayerName?, assistPlayerId?, team, description? }`
- [x] **GOAL event**: Increment scorer's `goals` in `FootballPlayerEntry`, increment assister's `assists`, update `FootballMatchData` score for the correct half/period, update `Match.scoreA`/`scoreB`
- [x] **OWN_GOAL event**: Credit goal to opposing team's score, record against the player who scored it
- [x] **YELLOW_CARD event**: Increment player's `yellowCards`; if 2nd yellow → auto-create RED_CARD event
- [x] **RED_CARD event**: Increment player's `redCards`, mark player as sent off
- [x] **SUBSTITUTION event**: Update `minuteSubbedOut` on outgoing player, create new `FootballPlayerEntry` with `minuteSubbedIn` for incoming player (or update existing sub entry)
- [x] **CORNER, PENALTY_KICK, OFFSIDE, FOUL**: Record event with player/team info
- [x] **PENALTY_SCORED / PENALTY_MISSED**: For penalty shootout events, update penalty score
- [x] **HALF_TIME / FULL_TIME / KICK_OFF**: Update `FootballMatchData.status` accordingly
- [x] Auto-calculate `minutesPlayed` for each player based on start/sub times
- [x] Permission: match creator (standalone) or ADMIN/HOST (tournament)

### 21.5 Football Match Status & Completion

- [x] Create `POST /api/matches/[matchId]/football/status` — change match period (kick off, half time, second half, full time, extra time, penalties)
- [x] On FULL_TIME: if scores are equal and it's a tournament knockout match, prompt for extra time or penalties
- [x] On match completion: auto-set `Match.scoreA`/`scoreB`, `Match.completed = true`
- [x] Tournament matches: advance winner to next bracket round
- [x] Auto-sync per-player stats to `StatEntry` records (source: TOURNAMENT or STANDALONE)
- [x] Auto-advance matching goals after stat creation

### 21.6 Football Match Undo

- [x] Create `PUT /api/matches/[matchId]/football/undo` — undo the last recorded event
- [x] Reverse all side effects (goal count, card count, score, player stats)
- [x] Cannot undo period-change events (KICK_OFF, HALF_TIME, FULL_TIME)
- [x] Return updated match state after undo

### 21.7 Football Live Score API

- [x] Create `GET /api/matches/[matchId]/football/live` — lightweight live score endpoint
- [x] Return: current score, match period, minute, recent events (last 10), team lineups with current stats, cards summary
- [x] Client-side polling (every 5 seconds) for spectators

### 21.8 Football Scorecard API

- [x] Create `GET /api/matches/[matchId]/football` — full match data endpoint
- [x] Return: match data, both team lineups with all stats, all events sorted chronologically, half-wise scores, cards summary, substitutions

### 21.9 Football Match Setup UI (Lineup Entry)

- [x] Build `FootballSetupModal` component — team lineup entry before match starts
- [x] Two-column layout: Team A lineup on left, Team B lineup on right
- [x] Each player row: `MemberAutocomplete` (name + userId linking)
- [x] Add/remove player buttons per team
- [x] Validate minimum squad size before allowing match start
- [x] For standalone matches: use invited players list for autocomplete
- [x] For tournament matches: use club members list for autocomplete

### 21.10 Football Live Scoring UI (Scorer View)

- [x] Build `FootballScorerPanel` component — event recording interface
- [x] **Match timer**: Display current match minute with play/pause (manual minute input also supported)
- [x] **Quick action buttons**: Goal ⚽, Yellow Card 🟨, Red Card 🟥, Corner 📐, Substitution 🔄, Foul, Offside
- [x] **Goal flow**: Select team → select scorer from lineup → optional: select assister from same team → confirm with minute
- [x] **Card flow**: Select team → select player → confirm card type and minute
- [x] **Substitution flow**: Select team → select player going off → select/enter player coming on → confirm with minute
- [x] **Period controls**: "Start Match", "Half Time", "Second Half", "Full Time", "Extra Time", "Penalties"
- [x] Show mini scoreboard at top: Team A [score] - [score] Team B, current minute, match period
- [x] Undo last event button with confirmation
- [x] Mobile-optimized touch targets for quick scoring

### 21.11 Football Scorecard UI (Match Detail View)

- [x] Build `FootballMatchClient` component — full match detail view (analogous to `CricketMatchClient`)
- [x] **Match header**: Team names, score, match period/status, half-time score
- [x] **Event timeline**: Chronological list of all events with minute, event icon, player name, description (e.g., "⚽ 23' — Ronaldo (Assist: Messi)")
- [x] **Team sheets**: Two-column player list showing each player's stats (goals, assists, cards, minutes played, shots on target)
- [x] **Match stats summary**: Side-by-side team comparison (shots on target, corners, fouls, cards)
- [x] **Cards summary**: Visual display of all yellow/red cards with player names and minutes
- [x] **Substitutions timeline**: Show all subs with in/out players and minutes
- [x] Tab/section switcher: Timeline | Team Sheets | Match Stats
- [x] LIVE badge with polling for ongoing matches
- [x] Responsive layout (stacked on mobile, side-by-side on desktop)

### 21.12 Expanded Football Metrics

- [x] Update `lib/sportMetrics.js` — add new FOOTBALL metrics: `fouls`, `yellow_cards`, `red_cards`, `clean_sheets`, `minutes_played`, `corners_won`, `offsides`
- [x] Update stat entry modal (manual entry) to include new football metrics
- [x] Update dashboard trend charts to show expanded football stats (goals per match, assists per match, cards trend)
- [x] Update profile page football tab with expanded stat summary
- [x] Update goal creation to allow targets on new metrics (e.g., "0 red cards this season", "10 clean sheets")

### 21.13 Football Player Stat Sync

- [x] On match completion, iterate all `FootballPlayerEntry` records with non-null `playerId`
- [x] Create individual `StatEntry` per linked player with their actual match stats (goals, assists, shots on target, fouls, cards, minutes played)
- [x] Set `source: 'TOURNAMENT'` or `'STANDALONE'` based on match type
- [x] Fall back to team-level aggregation for entries without `playerId` (unlinked/guest players)
- [x] Auto-progress matching goals for each synced player

### 21.14 Match Reset & Cleanup

- [x] Update `POST /api/matches/[matchId]/reset` — for football matches, delete `FootballMatchData`, `FootballPlayerEntry`, `FootballEvent` records
- [x] Delete auto-synced `StatEntry` records for football matches
- [x] Cascade through downstream tournament bracket (same as existing reset logic)
- [x] Update `DELETE /api/matches/[matchId]` — cascade cleanup includes football models

### 21.15 Integration with Existing Flows

- [x] Update `MatchDetailClient` — detect FOOTBALL sport type and render `FootballMatchClient` (like cricket detection renders `CricketMatchClient`)
- [x] Update standalone match detail page to pass invited members for football autocomplete
- [x] Update tournament match detail page to pass club members for football autocomplete
- [x] Show "Set Lineups" button before match starts (analogous to cricket's "Start Innings")
- [x] Hide generic score modal for football when football-specific scoring is available

### 21.16 Polish & Testing

- [x] Test: Setting up lineups creates correct `FootballPlayerEntry` records for both teams
- [x] Test: Goal events correctly update scorer, assister, and team score
- [x] Test: Yellow card + second yellow → auto red card
- [x] Test: Substitutions correctly track minutes played for in/out players
- [x] Test: Match completion auto-syncs per-player stats to individual `StatEntry` records
- [x] Test: Goals auto-progress from football match stats
- [x] Test: Undo correctly reverses last event and all aggregates
- [x] Test: Live polling shows real-time updates for spectators
- [x] Test: Tournament match completion advances winner in bracket
- [x] Test: Match reset cleans up all football-specific data
- [x] Test: Standalone football matches work end-to-end without club/tournament
- [x] Accessibility pass on scorer interface, lineup entry, and scorecard views
- [x] Mobile-responsive testing for scorer controls and match detail

### 21.17 Football Scorer — Auto Timer, Stoppage Time & Live Minute Display

- [x] Add live match timer to `FootballScorerPanel` — auto-increments every second during active periods (1st half, 2nd half, extra time)
- [x] Auto-populate the minute input from the timer (label shows "auto" indicator) — manual edits take priority
- [x] "Reset to auto" button on minute input when manually overridden
- [x] Timer pauses at period boundaries (half time, full time) and resets base on period transitions
- [x] Timer displays in stoppage format (e.g. "45+3'") when minute exceeds normal period duration
- [x] Auto-compute `addedTime` field when event minute exceeds period boundary
- [x] Show running timer badge (pulsing dot + minute) in scorer mini-scoreboard (top-right)
- [x] Show match minute in main match header (`FootballScoreSummary`) between team scores for spectators
- [x] Add stoppage time prompt when transitioning periods (Half Time, Full Time, ET breaks) — asks "how many minutes of added time?"
- [x] Allow skipping stoppage time prompt with "Skip" button

### 21.18 Real-Time Server-Based Timer & Spectator-Visible Minute

- [x] Add `periodStartedAt DateTime?` field to `FootballMatchData` — stores the server timestamp when each period begins
- [x] Run Prisma migration (`add_period_started_at`)
- [x] Update `POST /api/matches/[matchId]/football/status` — set `periodStartedAt = new Date()` when entering active periods (FIRST_HALF, SECOND_HALF, EXTRA_TIME_FIRST, EXTRA_TIME_SECOND, PENALTIES); clear it for non-active periods (HALF_TIME, FULL_TIME, COMPLETED)
- [x] Update `GET /api/matches/[matchId]/football/live` — return `periodStartedAt` and `halfDuration` in response
- [x] Update `GET /api/matches/[matchId]/football` (scorecard) — return `periodStartedAt` in `footballData`
- [x] Update `GET /api/tournaments/[tournamentId]/live` — return `periodStartedAt` and `halfDuration` per football match
- [x] Rewrite `FootballScorerPanel` timer — compute minute as `baseMinute + floor((Date.now() - periodStartedAt) / 60000)` using server timestamp, not local button-press time
- [x] Remove `resetTimerAfterEvent` — timer runs continuously from period start, no longer resets after each event
- [x] Timer keeps running through events — after recording an event, only resets manual override flag (timer continues uninterrupted)
- [x] Add real-time timer to `FootballScoreSummary` (spectator view) — computes live minute from `periodStartedAt` with its own `setInterval`, visible outside the scorer panel
- [x] `FootballScoreSummary` shows static period label (Half Time, Full Time) with frozen minute when period is not active
- [x] Update `LiveMatchCard` in `TournamentDetailClient` — real-time minute display for football matches in tournament live tab using `periodStartedAt`

---

## Phase 22: Landing Page Redesign — App-Focused, Not Product-Marketing

> **Goal:** Transform the landing page from a generic product/marketing site into a clean, app-style welcome page that feels like the entry point to a sports platform — simple, direct, and sports-first.

### 22.1 Navbar Simplification

- [x] Remove marketing-style nav links (About Us, Events, Membership) — keep only Logo, dark mode toggle, Sign In / Dashboard
- [x] Keep `UserButton` (Clerk) for signed-in users; show "Go to Dashboard" button instead of "Contact Us"
- [x] Simplify mobile hamburger menu to match (remove marketing anchors)
- [x] Make navbar thinner and more app-like (reduce height, tighten spacing)

### 22.2 Hero Section — App Welcome

- [x] Replace "SPORTS FOR EVERY PASSION" marketing tagline with a simpler app greeting (e.g., "Track. Compete. Improve." or "Your Sports Hub")
- [x] Replace marketing subtext with a one-liner describing what the app does (e.g., "Track your stats, organize matches, and compete in tournaments — all in one place.")
- [x] Keep "Get Started" CTA button — make it more prominent, centered
- [x] Remove "1000+ Members Joined" fake social proof badge
- [x] Replace right-side hero image placeholder with a clean app preview illustration or a feature icon grid (e.g., 📊 Stats, ⚽ Matches, 🏆 Tournaments, 🎯 Goals)
- [x] Remove floating marketing cards ("Multi-Sport 6 Sports", "Live Tracking Real-time")

### 22.3 Replace SportChips with Quick Feature Highlights

- [x] Remove the interactive sport filter chips row (they don't filter anything on the landing page)
- [x] Replace with a compact "What you can do" feature strip — 4–6 icon+label items in a horizontal row (e.g., "📊 Track Stats", "⚽ Live Score", "🏆 Tournaments", "🎯 Set Goals", "👥 Clubs", "🤝 Matches")
- [x] Keep it minimal — single row, no cards, just icons and short labels
- [x] Clicking any feature links to `/sign-up` (or `/dashboard` if signed in)

### 22.4 Replace FeaturedEvents with "How It Works" or App Showcase

- [x] Remove the fake "Golden Goal Cup / Smash Championship / Hoops League" event cards
- [x] Replace with a simple 3-step "How It Works" section: 1. Pick your sports → 2. Track stats & set goals → 3. Compete in tournaments
- [x] OR replace with a feature showcase: 3 cards showing actual app features (Live Cricket Scoring, Football Match Events, Tournament Brackets) with brief descriptions
- [x] Use clean icons/emojis, no stock-photo placeholders
- [x] Keep it concise — no marketing fluff

### 22.5 Replace AboutSection with Supported Sports Grid

- [x] Remove the marketing "About Us" section with mission statement and fake stats
- [x] Replace with a "Supported Sports" grid showing all 6 sports (Football, Cricket, Basketball, Badminton, Tennis, Volleyball)
- [x] Each sport card: emoji + sport name + 2–3 tracked metrics (e.g., Football: Goals, Assists, Clean Sheets)
- [x] Keep it compact — 2×3 or 3×2 grid
- [x] Optionally add a subtle "More coming soon" note

### 22.6 Replace CTABanner with Simple Sign-Up CTA

- [x] Remove the email newsletter subscription form (there's no newsletter)
- [x] Replace with a clean, centered call to action: "Ready to get started?" + Sign Up button
- [x] For signed-in users: show "Go to Dashboard" button instead
- [x] Keep it minimal — no email input, no "special offers" text
- [x] Optionally add "It's free" or "No credit card required" note

### 22.7 Footer Simplification

- [x] Remove "Careers", "Vision", "Our Mission" links (irrelevant for an app)
- [x] Remove "Follow Us" social links (no real social accounts)
- [x] Simplify to: Logo + tagline, Quick Links (Sign Up, Sign In, Dashboard), and copyright
- [x] Keep it to 2–3 columns max
- [x] Add a "Made with ❤️" or "Built for athletes" tagline

### 22.8 Overall Tone & Visual Polish

- [x] Ensure the entire page reads as "app entry point" not "product website"
- [x] Reduce total page height — aim for 2–3 scroll-lengths max instead of 5+
- [x] Consistent spacing and typography — match dashboard design language
- [x] Mobile-responsive — all sections stack cleanly on small screens
- [x] Dark/light mode both look good on all redesigned sections
- [x] Accessibility pass — proper headings hierarchy, aria labels, keyboard nav

---

## Phase 23: Football UX Improvements

### 23.1 Show Total Score Instead of Per-Half Score

- [x] Update `FootballScoreSummary` — display the total match score (e.g., "2 - 1") instead of per-half breakdown (e.g., "HT 1-0")
- [x] Remove or de-emphasize half-time score display from the main match header (No dont remove this this is okay but just update the total score)
- [x] Show half-wise score breakdown only in the detailed "Match Stats" section, not the primary scoreboard
- [x] Update `LiveMatchCard` in tournament view — show total score instead of per-half scores
- [x] Update standalone match detail header to show total score consistently
- [x] Verify live polling updates reflect total score

### 23.2 Ask Half Duration Only at Match/Tournament Creation (Not at Lineup Setup)

- [x] Remove `halfDuration` input from `FootballSetupModal` (lineup entry step) — it should already be set from match/tournament creation
- [x] For standalone matches: ensure `CreateMatchModal` captures `halfDuration` during match creation and passes it to `FootballMatchData` via the setup API
- [x] For tournament matches: inherit `halfDuration` from tournament config (already set at tournament creation via `CreateTournamentModal`)
- [x] Update `POST /api/matches/[matchId]/football/setup` — use match-level or tournament-level `halfDuration` instead of accepting it as a setup param
- [x] Remove redundant `halfDuration` field from the setup API request body
- [x] Verify timer still works correctly with the inherited `halfDuration` value

---

## Phase 24: Standalone Match Roles, UI Tweaks & Collapsible Sidebar

### 24.1 Standalone Match Roles (Spectator, Participant, Host)

- [x] Add `MatchRole` enum (`HOST`, `PARTICIPANT`, `SPECTATOR`) and `role` field to `MatchInvite` model (default `PARTICIPANT`)
- [x] Match creator is always `HOST` — can play, score, edit, and delete the match
- [x] `PARTICIPANT` — can play in the match (linked to lineups/scoring), view match details, but cannot score or edit
- [x] `SPECTATOR` — can view the match (scores, events, scorecard) but cannot play or score
- [x] Compute `currentUserRole` in match detail page (HOST for creator, invite role for others)
- [x] Update `POST /api/matches/[matchId]/invites` — accept a `role` param (`PARTICIPANT` or `SPECTATOR`, default `PARTICIPANT`)
- [x] Update invite UI in match detail — show role selector (Player / Spectator) when inviting players
- [x] Update match detail page — hide "Enter Score" / "Set Lineups" buttons from `SPECTATOR` invitees (gated by `isCreator`/`canScore`)
- [x] Scoring APIs only allow `HOST` to enter scores (via `createdByUserId` check — already correct)
- [x] Show role badge next to invited players on match detail page (Host = purple, Player = blue, Spectator = gray)
- [x] `SPECTATOR` cannot be added to lineups — filtered out of `invitedMembers` list for football/cricket/all sport lineup entry
- [x] `PARTICIPANT` and `HOST` can be added to lineups
- [x] GET invites API and GET match detail API return `role` field
- [x] Build passes ✓

### 24.2 Show + (Add Stats) Button Only on Dashboard Overview

- [x] Move the floating "Add (+)" button (`FloatingAddButton`) so it only renders on the main dashboard page (`/dashboard`)
- [x] Remove `FloatingAddButton` from the dashboard layout (which shows it on every dashboard sub-page)
- [x] Add `FloatingAddButton` directly in the dashboard overview page component (`app/dashboard/page.js`)
- [x] Verify the + button no longer appears on `/dashboard/matches`, `/dashboard/clubs`, `/dashboard/goals`, `/dashboard/stats`, `/dashboard/profile`

### 24.3 Collapsible Dashboard Sidebar

- [x] Add collapsed/expanded state to `DashboardSidebar` (default: expanded)
- [x] Add a collapse/expand toggle button (`«` / `»` chevrons) at the top of the sidebar
- [x] When collapsed: show only icons (no labels), reduce sidebar width (`w-16` instead of `w-64`)
- [x] When expanded: show icons + labels at full width (current behavior)
- [x] Persist collapse state in `localStorage` so it survives page reloads
- [x] Animate the transition (smooth width change with `transition-all duration-300`)
- [x] Update main content area margin/padding to adjust when sidebar collapses (via `DashboardMain` client component)
- [x] Mobile: sidebar behavior unchanged (overlay drawer)
- [x] Accessibility: toggle button has proper `aria-label` ("Collapse sidebar" / "Expand sidebar")
- [x] Created `SidebarContext` for shared state between sidebar and main content
- [x] Build passes ✓

## Phase 25: Football UX Overhaul — Timer, Penalties & Player Dropdowns

### 25.1 Football Timer Rework

- [x] Remove the manual minute-entry input from the football event forms (goal, card, substitution, etc.)
- [x] Use only the auto-incrementing match clock as the event timestamp — events are logged at the current timer value
- [x] When the "Half-Time" button is clicked, prompt the user **only** for extra/added time (e.g., "+3 min") instead of asking for stoppage time details
- [x] Run the timer for the added-time duration after the half's regulation time ends (e.g., 45:00 + 3:00 → timer counts to 48:00)
- [x] Add an "End Half Now" button so the host can end the current half early (skip remaining added time)
- [x] Apply the same logic for full-time: prompt for added time, run it, then allow "End Match Now" to finish early
- [x] Ensure timer persists correctly across page refreshes (via `periodStartedAt` / server state)

### 25.2 Penalty Shootout — Auto Team Toggle

- [x] During penalty shootout, after a player takes a penalty (scores or misses), automatically switch the active team to the other side
- [x] Highlight/activate the other team's button so the host doesn't have to manually toggle
- [x] Maintain the alternating A→B→A→B pattern automatically
- [x] Handle sudden-death rounds the same way (alternating)

### 25.3 Player Dropdown Menus for Events

- [x] Replace free-text player name inputs with dropdown selects populated from the team roster (lineup players)
- [x] Goal form: dropdown for goal scorer (from active team roster) and assist giver (from same team roster, optional)
- [x] Card form: dropdown for carded player (from the relevant team roster)
- [x] Substitution form: "Player Out" dropdown (from team roster on pitch) and "Player In" dropdown (from team bench/remaining squad)
- [x] Penalty form: dropdown for penalty taker (from the shooting team roster)
- [x] Dropdowns should show player name and shirt number (if available)
- [x] Fallback: allow typing a custom name if the player is not in the lineup (edge case)

---

## Phase 25.4: Football Score Display & UI Bug Fixes

- [x] Fix main component score reading — use `footballData.scores.total` before stale `match` prop
- [x] Fix event API — return `matchScoreA`/`matchScoreB` in response for instant client-side score updates
- [x] Fix status API — return `matchScoreA`/`matchScoreB` in response for instant client-side score updates
- [x] Fix scorer panel — update `currentData.scores.total` immediately from event/status API responses (no flash of stale 0-0)
- [x] Fix completed match label — show "AFTER PENALTIES" / "AFTER EXTRA TIME" instead of always "FULL TIME"
- [x] Fix winner determination — determine winner from penalty scores when full-time score is tied

---

## Phase 26: UX Polish — Dropdowns, Invites, Buttons & Member Search

- [x] Tournament match player dropdowns — filter out SPECTATOR club members; only show PARTICIPANT/HOST/ADMIN roles
- [x] Standalone match invite modal — hide "Which Team" selector when inviting as Spectator (spectators don't belong to a team)
- [x] "End Half Now" / "End Match Now" buttons — improved padding, amber accent border/bg to make them clearly visible and tappable
- [x] Club member search — when a searched user is already a member, show "Already a member" badge instead of the Add button

---

## Phase 27: Cricket UX — Strike Rotation & Team-wise Lineup Entry

- [x] Auto-swap strike at end of over — after 6 legal deliveries, striker automatically changes (XOR logic with odd-run swap so they cancel correctly when both conditions apply)
- [x] Team-wise lineup entry — StartInningsModal now takes players by team (batting team players + bowling team players) instead of "batsmen + opening bowler"
- [x] Full bowling lineup sent to API — start API creates all bowlingEntries upfront so scorer dropdown shows all bowlers from the start
- [x] Scorer card unchanged — already reads from bowlingEntries/battingEntries, now populated with full team lineups
- [x] Legacy backward compatibility — API still accepts single `bowler` param as fallback if no `bowlingLineup` provided
