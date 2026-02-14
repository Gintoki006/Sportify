# Design Document: "Sportify" Application

## 1. Overview

**Project Name:** Sportify
**Platform:** Mobile Application (iOS/Android) & Web Dashboard (for Club Admins)
**Design Style:** Airy, premium sports brand with editorial layout and soft depth.
**Primary Objective:** To provide a frictionless, unified interface for multi-sport athletes to track stats, alongside comprehensive tournament management tools for local clubs.

## 2. Visual Identity & Theme

The design should reflect a modern sports facility brand website: light, spacious, photographic, and premium, while still supporting dense performance data.

- **Color Palette (Light Mode):**
- **Background:** Warm off-white (`#F6F4F1`) with soft gradient washes and subtle texture for depth.
- **Primary Action Color:** Deep charcoal (`#111111`) for buttons and key CTAs.
- **Accent Color:** Tennis-green/lime (`#CDEB5E`) for highlights, chips, and progress emphasis.
- **Supporting Neutrals:** Fog gray (`#E9ECEF`), slate text (`#4A4A4A`), and muted beige (`#E8E0D6`).
- **Sport-Specific Accents:** Use restrained accent chips (football green, basketball orange) only in data tags and charts.

- **Color Palette (Dark Mode):**
- **Background:** Rich charcoal (`#121212`) as the base surface, with elevated cards using slightly lighter dark (`#1E1E1E`).
- **Surface Layers:** Use `#1E1E1E` for cards, `#2A2A2A` for modals/popovers, and `#333333` for input fields and borders.
- **Primary Action Color:** White (`#FFFFFF`) for buttons and key CTAs to maintain contrast.
- **Accent Color:** Brighter lime (`#D4F56A`) — slightly boosted saturation so it pops against dark surfaces.
- **Text Colors:** Primary text white (`#F5F5F5`), secondary text light gray (`#A0A0A0`), muted labels (`#6B6B6B`).
- **Supporting Neutrals:** Dark fog (`#2C2C2C`) for dividers, charcoal slate (`#3A3A3A`) for borders.
- **Sport-Specific Accents:** Same hues as light mode but increased brightness by ~15% for legibility on dark backgrounds.

- **Dark Mode Behavior:**
- Default to the user's OS/browser preference (`prefers-color-scheme`).
- Provide a manual toggle in the navbar (sun/moon icon) that persists via `localStorage`.
- All shadows shift from drop shadows to subtle light-edge glows on dark surfaces.
- Charts and progress rings use slightly brighter fills and semi-transparent grid lines for readability.

- **Typography:**
- **Typeface:** Editorial sans-serif with sharp geometry (e.g., _Manrope_ or _Sora_) for headlines; clean UI sans-serif for body (e.g., _Inter_).
- **Hierarchy:** Oversized hero headlines, medium-weight section titles, tight uppercase labels for data chips (e.g., "MATCH STATS").

## 3. UI/UX Principles & Techniques

- **Editorial Layout:** Large hero image with layered photo tiles and asymmetrical cards to convey energy and motion.
- **Soft Depth:** Rounded cards, subtle drop shadows (light mode) or faint luminous edges (dark mode), and blurred background shapes to keep the interface tactile but airy.
- **Quick Comprehension:** Use icon chips and short labels to categorize sports and entries at a glance.
- **Frictionless Input:** Maintain <60-second stat entry using steppers, number pads, and smart defaults.
- **Progressive Disclosure:** Keep the landing view clean; tuck advanced analytics and historical tables behind "View More" or tabs.

## 4. Application Anatomy (Key Screens)

### A. Public Landing & Marketing (Web)

- **Hero:** Full-width headline ("Sports for Every Passion") with a large sport photo and floating CTA button.
- **Secondary CTA Row:** Small badge with member count and a short trust signal (e.g., "1,000+ Athletes Joined").
- **Sport Chips:** Horizontal chip list (Football, Basketball, Volleyball, Tennis) to mirror the image UI and let users filter feature highlights.
- **Card Mosaic:** A grid of photo cards and mini feature cards ("Golden Goal Cup", "Performance Trends") to showcase Sportify capabilities.
- **Brand Row:** Light logo strip for partners or clubs.

### B. Onboarding & Authentication

- **Flow:** Clean, step-by-step wizard with large, friendly sports tiles.
- **Sport Selection:** Visually engaging grid with image-backed tiles and toggles.
- **Goal Setting Prompt:** Immediate micro-goal card after selection (e.g., "Score 10 goals in Football this month").

### C. The Unified Dashboard (Home)

- **At-a-Glance Header:** A personalized greeting with an overview of weekly activity.
- **Goal Progress Rings:** Circular progress bars indicating completion percentage for active goals (e.g., 45/100 Cricket Runs).
- **Recent Activity Feed:** A chronological list of recent match entries across all selected sports, using the sport-specific accent colors.
- **Trend Charts:** A toggleable line/bar chart section visualizing performance over time (e.g., Basketball scoring efficiency over the last 5 games).

### D. Quick Stat Entry Module

- **Trigger:** A prominent, floating "Add (+)" button accessible from anywhere in the app.
- **Dynamic Forms:** Selecting a sport dynamically changes the input fields.
- _Football:_ Steppers for Goals, Assists; sliders or number pads for Shots.
- _Volleyball:_ Steppers for Spikes, Blocks, Serves, Digs.

- **Completion:** A satisfying, subtle gold animation confirms the data has been saved and progress bars are updated.

### E. Club & Tournament Hub

- **Role-Based View:** Standard users see upcoming matches and current brackets. Club Admin users see management tools.
- **Interactive Brackets:** Pinch-to-zoom tournament trees with crisp outline styling to separate matchups.
- **Score Entry:** Admins can tap a specific match on the bracket to open a rapid-entry modal, updating the tournament standings and automatically syncing to the participating athletes' personal profiles.

### F. User Profile

- **Digital Trophy Cabinet:** A unified view of the athlete.
- **Tabbed Navigation:** Users can swipe between their global summary and deep dives into specific sports.

## 5. Key Takeaways for Implementation (Dev Handoff)

1. **Component Architecture:** Developers need to build highly modular stat-entry components, as the fields change drastically between Cricket (runs/wickets) and Basketball (points/efficiency).
2. **State Management:** Real-time updates are critical. When a user or club admin submits a score, the global state must instantly update the user's dashboard charts and goal progress bars without requiring a page refresh.
3. **Data Deduplication:** Implementing strict backend checks to ensure manual stat entries don't double-count against automated stats synced from Club Tournaments.
