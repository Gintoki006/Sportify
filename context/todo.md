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

- [ ] Create `User` model (id, name, email, avatarUrl, clerkId, createdAt)
- [ ] Create `SportProfile` model (id, userId, sportType enum, createdAt)
- [ ] Create `StatEntry` model (id, sportProfileId, date, opponent, notes, metrics JSON, source enum [manual | tournament])
- [ ] Create `Goal` model (id, sportProfileId, metric, target, current, deadline, completed)
- [ ] Create `Club` model (id, name, adminUserId, members relation)
- [ ] Create `Tournament` model (id, clubId, name, sportType, startDate, endDate, status)
- [ ] Create `Match` model (id, tournamentId, round, teamA, teamB, scoreA, scoreB, date, completed)
- [ ] Define sport type enum: FOOTBALL, CRICKET, BASKETBALL, BADMINTON, TENNIS, VOLLEYBALL
- [ ] Run initial migration (`prisma migrate dev`)
- [ ] Generate Prisma client

---

## Phase 3: Authentication (Clerk)

- [ ] Install `@clerk/nextjs`
- [ ] Wrap app in `<ClerkProvider>`
- [ ] Build sign-up page (`/sign-up`)
- [ ] Build sign-in page (`/sign-in`)
- [ ] Add password reset flow
- [ ] Create auth middleware to protect `/dashboard` and `/api` routes
- [ ] Sync Clerk user to database `User` model on first login (webhook or middleware)

---

## Phase 4: Landing Page (Public)

- [ ] Build top navbar (Logo, Home, About Us, Events, Membership, Contact Us CTA)
- [ ] Build hero section (headline, subtext, Get Started button, member count badge)
- [ ] Build sport filter chips row (Basketball, Volleyball, Football, Tennis)
- [ ] Build featured events card mosaic (photo cards with title and description)
- [ ] Build About Us section (mission text, image grid)
- [ ] Build newsletter / CTA banner ("Latest updates, special Offers, Event Invitations")
- [ ] Build footer (About links, social icons, copyright)
- [ ] Make landing page fully responsive (mobile, tablet, desktop)

---

## Phase 5: Onboarding Flow

- [ ] Build sport selection screen (image-backed tile grid, multi-select toggles)
- [ ] Build profile creation form (name, avatar upload, bio)
- [ ] Build first goal prompt card (pick sport → pick metric → set target)
- [ ] Save sport profiles and initial goal to database on completion
- [ ] Redirect to dashboard after onboarding

---

## Phase 6: Dashboard (Authenticated Home)

- [ ] Build dashboard layout with sidebar/top navigation
- [ ] Build greeting header with weekly activity summary
- [ ] Build goal progress rings (circular progress bars per active goal)
- [ ] Build recent activity feed (chronological stat entries, sport-colored tags)
- [ ] Build trend charts section using Recharts (line/bar chart, sport toggle)
- [ ] Fetch and display data from API routes
- [ ] Add loading skeletons and empty states

---

## Phase 7: Stat Entry Module

- [ ] Build floating "Add (+)" button (global, visible on all authenticated pages)
- [ ] Build sport selector step in entry modal
- [ ] Build dynamic form fields per sport:
  - [ ] Football: goals, assists, shots on target, shots taken
  - [ ] Cricket: runs, wickets, batting average
  - [ ] Basketball: points scored, shots taken, shots on target, scoring efficiency
  - [ ] Badminton: match wins, points scored
  - [ ] Tennis: match wins, points scored
  - [ ] Volleyball: spikes, blocks, serves, digs
- [ ] Add date picker (default today), opponent field, notes field
- [ ] Add form validation (required fields, number ranges)
- [ ] POST stat entry to API and update dashboard state in real time
- [ ] Show success animation on save

---

## Phase 8: Goals & Progress

- [ ] Build goal creation form (select sport, metric, numeric target, deadline)
- [ ] Build goal list view with progress bars
- [ ] Auto-update goal progress when new stat entries are saved
- [ ] Mark goal as completed when target is reached
- [ ] Build goal history / completed goals section

---

## Phase 9: User Profile

- [ ] Build profile page with avatar, name, bio, joined date
- [ ] Build tabbed sport breakdown (one tab per selected sport)
- [ ] Show per-sport stat summary and history table
- [ ] Show goals (active and completed) per sport
- [ ] Allow profile editing (name, avatar, sport preferences)

---

## Phase 10: Club & Tournament Module

- [ ] Build club creation form (name, sport, description)
- [ ] Build member invite / join flow
- [ ] Build tournament creation form (name, sport, date range, bracket size)
- [ ] Build bracket visualization component (single elimination tree)
- [ ] Build match scheduling UI (assign teams/players, set dates)
- [ ] Build admin score entry modal per match
- [ ] Auto-sync match results to participating players' StatEntry records (source: tournament)
- [ ] Add data deduplication check (prevent manual + tournament double-count)
- [ ] Build tournament standings / leaderboard view

---

## Phase 11: Backend API Routes

- [ ] `POST /api/users` — create/sync user from Clerk
- [ ] `GET /api/users/:id` — get user profile
- [ ] `PUT /api/users/:id` — update profile
- [ ] `POST /api/sport-profiles` — add sport to user
- [ ] `GET /api/sport-profiles/:userId` — list user sports
- [ ] `POST /api/stats` — create stat entry
- [ ] `GET /api/stats/:sportProfileId` — list stat entries
- [ ] `POST /api/goals` — create goal
- [ ] `GET /api/goals/:userId` — list goals
- [ ] `PUT /api/goals/:id` — update goal progress
- [ ] `POST /api/clubs` — create club
- [ ] `POST /api/tournaments` — create tournament
- [ ] `GET /api/tournaments/:id` — get tournament with bracket
- [ ] `PUT /api/matches/:id/score` — submit match score
- [ ] Add input validation and error handling on all routes
- [ ] Add auth middleware (verify Clerk session) on all protected routes

---

## Phase 12: Polish & QA

- [ ] Responsive design pass on all pages (mobile-first)
- [ ] Add loading states, error boundaries, and toast notifications
- [ ] Performance audit (dashboard loads < 2 seconds)
- [ ] Accessibility check (keyboard nav, aria labels, contrast ratios)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Write seed script for demo data (sample users, stats, tournaments)

---

## Phase 13: Deployment & Launch

- [ ] Deploy frontend to Vercel
- [ ] Deploy backend API (Vercel serverless or Railway)
- [ ] Confirm Supabase database connectivity in production
- [ ] Set production environment variables (Clerk, Supabase, API URL)
- [ ] Final smoke test on production
- [ ] Prepare launch checklist and release notes
