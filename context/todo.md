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
