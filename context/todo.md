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

- [ ] Deploy frontend to Vercel
- [ ] Deploy backend API (Vercel serverless or Railway)
- [ ] Confirm Supabase database connectivity in production
- [ ] Set production environment variables (Clerk, Supabase, API URL)
- [ ] Final smoke test on production
- [ ] Prepare launch checklist and release notes
