# Sportify — Sports for Every Passion

A full-stack sports management platform built with **Next.js 16**, **Prisma**, **Clerk Auth**, and **Tailwind CSS v4**. Track stats, set goals, manage clubs, organise tournaments, and score live matches — all from one unified dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Scripts](#scripts)
- [API Routes](#api-routes)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [License](#license)

---

## Features

### Multi-Sport Support

- **Football** — Live match scoring with goals, cards, substitutions, corners, offsides, fouls, penalty shootouts, extra time, and half-time/full-time period management.
- **Cricket** — Ball-by-ball scoring with batting/bowling entries, dismissal types, extras (wides, no-balls, byes, leg-byes), over tracking, and full innings management.
- **Basketball, Badminton, Tennis, Volleyball** — Stat tracking with sport-specific metrics.

### Dashboard

- Personalised greeting header with sport profiles.
- Goal progress rings with animated circular indicators.
- Trend charts (Recharts) — goals for football, runs & wickets for cricket.
- Recent activity feed and recent match results.
- Upcoming matches with invite status.
- Floating add button for quick stat entry.

### Clubs & Tournaments

- Create and manage sports clubs with role-based access (Admin, Host, Participant, Spectator).
- Role upgrade request system with approval workflow.
- Tournament creation with bracket generation.
- Player linking — connect tournament slots to registered users.
- Tournament-specific settings: overs & players-per-side (cricket), half duration & squad size (football).

### Live Match Scoring

- **Football**: Real-time period management (Kick Off → First Half → Half Time → Second Half → Full Time → Extra Time → Penalties → Completed). Event logging for goals, assists, cards, substitutions, corners, offsides, and fouls. Undo support. Automatic stat sync to player profiles on match completion.
- **Cricket**: Ball-by-ball event logging. Run scoring, extras, wickets with dismissal types. Bowling spell tracking with economy rates. Strike rotation (XOR logic). Undo last ball. Full innings scorecards.

### Standalone Matches

- Create matches outside of tournaments with configurable sport type and settings.
- Invite players via user search with accept/decline workflow.
- Real-time notifications for match invites and score updates.

### Goals & Stats

- Set personal goals per sport (e.g., "Score 50 goals by March").
- Manual stat entry with date, opponent, and notes.
- Automatic stat sync from completed tournament and standalone matches.
- Sport-specific metrics stored as flexible JSON.

### User Profiles

- Onboarding wizard with sport selection, profile setup, and initial goal creation.
- Multi-sport profiles — one profile per sport type per user.
- Profile page with sport-specific stat summaries.

### Notifications

- In-app notification bell with unread badge.
- Types: match invites, match scored, invite accepted/declined.
- Mark-as-read and mark-all-read support.

### UI/UX

- Light and dark mode with theme toggle (class-based `.dark`).
- Custom design tokens: `bg`, `surface`, `primary`, `accent`, `muted`, `border`, `beige`.
- Manrope font family.
- Custom DatePicker component (dark-theme compatible calendar dropdown).
- Accessible modals, toast notifications, error boundaries.
- Responsive sidebar dashboard layout.

---

## Tech Stack

| Layer       | Technology                                                  |
| ----------- | ----------------------------------------------------------- |
| Framework   | [Next.js 16](https://nextjs.org) (App Router)               |
| Language    | JavaScript (React 19)                                       |
| Auth        | [Clerk](https://clerk.com) (`@clerk/nextjs`)                |
| Database    | PostgreSQL ([Supabase](https://supabase.com))               |
| ORM         | [Prisma 7](https://www.prisma.io) with `@prisma/adapter-pg` |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com) + PostCSS        |
| Charts      | [Recharts 3](https://recharts.org)                          |
| HTTP Client | [Axios](https://axios-http.com)                             |
| Webhooks    | [Svix](https://www.svix.com) (Clerk webhook verification)   |
| Linting     | ESLint 9 + Prettier                                         |
| Compiler    | React Compiler (babel-plugin-react-compiler)                |

---

## Project Structure

```
sportify-app/
├── app/                          # Next.js App Router
│   ├── page.js                   # Landing page (Hero, SportChips, FeaturedEvents, etc.)
│   ├── layout.js                 # Root layout (ClerkProvider, ThemeProvider, ToastProvider)
│   ├── globals.css               # Tailwind imports + theme tokens (light/dark)
│   ├── dashboard/                # Authenticated dashboard pages
│   │   ├── page.js               # Main dashboard (greeting, goals, charts, matches)
│   │   ├── layout.js             # Sidebar + notifications layout
│   │   ├── clubs/                # Club listing & detail pages
│   │   ├── matches/              # Match listing & detail pages
│   │   ├── goals/                # Goals management page
│   │   ├── stats/                # Stats entry page
│   │   └── profile/              # User profile page
│   ├── onboarding/               # Onboarding wizard
│   ├── sign-in/                  # Clerk sign-in
│   ├── sign-up/                  # Clerk sign-up
│   └── api/                      # API routes
│       ├── clubs/                # CRUD for clubs
│       ├── tournaments/          # CRUD for tournaments
│       ├── matches/              # Match CRUD + nested sport-specific endpoints
│       │   └── [matchId]/
│       │       ├── football/     # setup, status, event, undo, live
│       │       ├── cricket/      # start, ball, undo, live
│       │       ├── invites/      # Match invite management
│       │       ├── score/        # Simple score updates
│       │       └── reset/        # Match reset
│       ├── goals/                # Goal CRUD
│       ├── stats/                # Stat entry CRUD
│       ├── users/                # User search & lookup
│       ├── notifications/        # Notification fetch & mark-read
│       ├── onboarding/           # Onboarding completion
│       ├── profile/              # Profile updates
│       ├── sport-profiles/       # Sport profile management
│       └── webhooks/             # Clerk webhook handler (user sync)
├── components/
│   ├── clubs/                    # ClubDetailClient, TournamentDetailClient, FootballMatchClient, CricketMatchClient
│   ├── dashboard/                # Sidebar, GreetingHeader, GoalProgressRings, TrendCharts, etc.
│   ├── goals/                    # GoalCreationModal, GoalsPageClient
│   ├── matches/                  # CreateMatchModal, MatchDetailClient, MatchesPageClient
│   ├── onboarding/               # OnboardingWizard, SportSelectionStep, ProfileStep, GoalStep
│   ├── profile/                  # ProfilePageClient
│   ├── stats/                    # StatEntryModal, FloatingAddButton
│   ├── ui/                       # DatePicker, AccessibleModal, ErrorBoundary, ToastProvider, MemberAutocomplete
│   ├── Navbar.js                 # Landing page navigation
│   ├── Hero.js                   # Landing page hero section
│   ├── Footer.js                 # Landing page footer
│   └── ThemeProvider.js          # Dark/light theme context
├── lib/
│   ├── prisma.js                 # Prisma client singleton
│   ├── auth.js                   # ensureDbUser() helper (Clerk → DB user sync)
│   ├── clubPermissions.js        # Role-based permission checks
│   ├── sportMetrics.js           # Sport-specific metric definitions
│   └── utils.js                  # Shared utilities
├── prisma/
│   ├── schema.prisma             # Database schema (20+ models, 10+ enums)
│   ├── seed.mjs                  # Database seeder
│   ├── backfill-player-links.mjs # Player linking backfill script
│   └── migrations/               # Migration history
├── middleware.js                  # Clerk auth middleware (protected vs public routes)
├── package.json
├── next.config.mjs
├── postcss.config.mjs
├── eslint.config.mjs
└── prisma.config.ts
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** or **yarn**
- A **PostgreSQL** database (e.g., [Supabase](https://supabase.com))
- A **Clerk** account for authentication

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/sportify-app.git
cd sportify-app

# Install dependencies
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
SIGNING_SECRET=whsec_...    # Clerk webhook signing secret (Svix)
```

---

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database
npm run db:seed

# (Optional) Open Prisma Studio
npx prisma studio
```

### Key Models

| Model                 | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `User`                | Synced from Clerk via webhook                     |
| `SportProfile`        | One per sport per user (football, cricket, etc.)  |
| `StatEntry`           | Individual stat records with JSON metrics         |
| `Goal`                | Target-based goals with progress tracking         |
| `Club`                | Sports clubs with admin management                |
| `ClubMember`          | Club membership with role-based access            |
| `Tournament`          | Club-scoped tournaments with bracket system       |
| `Match`               | Matches (standalone or tournament-linked)         |
| `MatchInvite`         | Player invitations with accept/decline flow       |
| `Notification`        | In-app notifications                              |
| `CricketInnings`      | Innings data (runs, wickets, overs, extras)       |
| `BattingEntry`        | Per-batter scorecard                              |
| `BowlingEntry`        | Per-bowler figures                                |
| `BallEvent`           | Ball-by-ball event log                            |
| `FootballMatchData`   | Match state, period scores, status                |
| `FootballPlayerEntry` | Per-player stats (goals, assists, cards, minutes) |
| `FootballEvent`       | Match events (goals, cards, subs, etc.)           |

---

## Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start Next.js development server  |
| `npm run build`   | Production build                  |
| `npm run start`   | Start production server           |
| `npm run lint`    | Run ESLint                        |
| `npm run format`  | Format code with Prettier         |
| `npm run db:seed` | Seed the database                 |
| `npm run server`  | Start the Express server (legacy) |

---

## API Routes

### Core Resources

| Method | Endpoint              | Description                |
| ------ | --------------------- | -------------------------- |
| `GET`  | `/api/profile`        | Get current user profile   |
| `PUT`  | `/api/profile`        | Update profile             |
| `POST` | `/api/onboarding`     | Complete onboarding        |
| `GET`  | `/api/sport-profiles` | List user's sport profiles |
| `POST` | `/api/sport-profiles` | Create sport profile       |
| `GET`  | `/api/stats`          | List stat entries          |
| `POST` | `/api/stats`          | Create stat entry          |
| `GET`  | `/api/goals`          | List goals                 |
| `POST` | `/api/goals`          | Create goal                |
| `GET`  | `/api/notifications`  | List notifications         |

### Clubs & Tournaments

| Method | Endpoint              | Description       |
| ------ | --------------------- | ----------------- |
| `GET`  | `/api/clubs`          | List all clubs    |
| `POST` | `/api/clubs`          | Create club       |
| `GET`  | `/api/clubs/[clubId]` | Get club details  |
| `GET`  | `/api/tournaments`    | List tournaments  |
| `POST` | `/api/tournaments`    | Create tournament |

### Matches

| Method | Endpoint                         | Description             |
| ------ | -------------------------------- | ----------------------- |
| `GET`  | `/api/matches`                   | List matches            |
| `POST` | `/api/matches`                   | Create standalone match |
| `GET`  | `/api/matches/[matchId]`         | Get match details       |
| `POST` | `/api/matches/[matchId]/invites` | Send match invites      |

### Football Scoring

| Method | Endpoint                                 | Description                           |
| ------ | ---------------------------------------- | ------------------------------------- |
| `POST` | `/api/matches/[matchId]/football/setup`  | Set up football match (lineups)       |
| `POST` | `/api/matches/[matchId]/football/status` | Change match period                   |
| `POST` | `/api/matches/[matchId]/football/event`  | Record match event (goal, card, etc.) |
| `POST` | `/api/matches/[matchId]/football/undo`   | Undo last event                       |
| `GET`  | `/api/matches/[matchId]/football/live`   | Get live match data                   |

### Cricket Scoring

| Method | Endpoint                               | Description           |
| ------ | -------------------------------------- | --------------------- |
| `POST` | `/api/matches/[matchId]/cricket/start` | Start cricket innings |
| `POST` | `/api/matches/[matchId]/cricket/ball`  | Record ball event     |
| `POST` | `/api/matches/[matchId]/cricket/undo`  | Undo last ball        |
| `GET`  | `/api/matches/[matchId]/cricket/live`  | Get live innings data |

---

## Architecture

### Authentication Flow

1. User signs up/in via **Clerk** (hosted UI at `/sign-in`, `/sign-up`).
2. Clerk webhook (`/api/webhooks`) syncs user data to the PostgreSQL `User` table via **Svix** verification.
3. `middleware.js` protects dashboard and API routes using `clerkMiddleware()`.
4. Server components use `ensureDbUser()` to resolve the current Clerk user to a database user.

### Match Scoring Architecture

- **Football**: `FootballMatchData` tracks match state. Period transitions (`NOT_STARTED` → `FIRST_HALF` → ... → `COMPLETED`) managed via `/football/status`. Events logged individually. On `COMPLETED`, player stats are batch-synced to `StatEntry` records using optimised parallel transactions.
- **Cricket**: `CricketInnings` with `BallEvent` log. Ball-by-ball progression with automatic over tracking, strike rotation, and bowling spell management.

### Theme System

- CSS custom properties defined in `globals.css` for light and dark modes.
- Class-based dark mode (`.dark` on `<html>`).
- Theme toggled via `ThemeProvider` using `localStorage` with `useSyncExternalStore` for hydration safety.

### State Management

- Server components fetch data directly with Prisma.
- Client components use local state + API calls via `fetch`/`axios`.
- `SidebarContext` for dashboard sidebar state (hydration-safe with `useSyncExternalStore`).
- Toast notifications via `ToastProvider` context.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub.
2. Import the repo on [Vercel](https://vercel.com/new).
3. Add all environment variables in the Vercel dashboard.
4. Vercel auto-detects Next.js and runs `prisma generate` via `postinstall`.
5. Run `npx prisma migrate deploy` manually or via a build hook.

### Other Platforms

```bash
# Build
npm run build

# Start
npm run start
```

Ensure `DATABASE_URL` and Clerk environment variables are configured in your hosting provider.

---

## License

This project is private and not licensed for redistribution.
