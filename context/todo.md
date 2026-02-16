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
