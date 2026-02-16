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
