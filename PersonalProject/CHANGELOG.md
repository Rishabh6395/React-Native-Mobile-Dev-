# Changelog

## Phase 4: Backend, auth, sync
**What was done:**
- Scaffolded backend API workspace (`apps/api`) using Hono and Node.js.
- Set up Prisma schema for Postgres (Neon), configured `@prisma/adapter-neon` with `ws` and generated Prisma Client with the `driverAdapters` preview feature.
- Integrated `better-auth` for authentication, connecting to the Prisma database adapter.
- Configured foundational Hono routes for usage sync, reports, chat threads, and goals.
- Created shared package (`packages/shared`) for centralized types, schemas, and plan configuration.
- Built a mobile authentication gate component (`SignInScreen`) integrated into the app startup sequence.
- Added secure token storage using `expo-secure-store`.
- Configured TanStack Query and a generic API fetch wrapper for backend communication.
- Implemented background usage sync using `expo-background-fetch` and `expo-task-manager` to periodically push local SQLite usage data to the server.

**What the human should manually test:**
1. **SignInScreen:** Test the new `SignInScreen` flow that now appears after onboarding and permissions are completed.
2. **Background Sync:** Wait 15+ minutes with the app backgrounded, or manually trigger the background fetch task using Android Studio/emulator ADB tools to ensure it calls the local `/usage/sync` API.

## Phase 3: Dashboards
**What was done:**
- Extended `UsageRepository` with robust multi-day queries (Day, Week, Month) and automatic historical data backfill.
- Built reusable core chart components using `react-native-svg` and `react-native-reanimated` (`src/components/charts/`):
  - `BarChart`: Scrubbable animated bar chart with haptics.
  - `MiniTimeline`: 24-hour horizontal usage density strip.
  - `CategoryDonut`: Animated SVG donut chart with center stats and legend.
  - `UsageBar`: Inline animated proportional bar for ranked lists.
- Implemented `usageAggregation.ts` utility for robust client-side aggregations (by category, date grouping, top apps, deltas).
- Built **Home Screen** (`app/(tabs)/index.tsx`) featuring a greeting, hero ProgressRing with delta comparison, today's timeline, top 3 apps, and coach insight card.
- Built **Stats Screen** (`app/(tabs)/stats.tsx`) featuring Day/Week/Month SegmentedControl, dynamic bar charts, category donut, and full ranked app list using `FlashList` (gracefully degraded to `map` for static rendering).
- Built **App Detail Screen** (`app/app-detail.tsx`) featuring a 7-day trend chart, hourly breakdown, stats grid (launches, sessions, night usage), and actionable CTAs.
- Updated root layout to use Expo Router Tabs via a custom floating `TabBar` and converted the old `index.tsx` into a lean Onboarding/Permission gate.
- Resolved all TypeScript and ESLint strict errors.

**What the human should manually test:**
1. **Gate Flow**: Restart the app and ensure it smoothly skips the onboarding/permission gate if already granted, landing directly on the new Home screen.
2. **Home Screen**: Check the hero ring for today's time and delta. Verify the 24-hour timeline populates segments accurately, and the top 3 apps navigate to App Details upon tap.
3. **Stats Screen**: Switch between Day, Week, and Month tabs. Verify the charts animate dynamically and correctly represent the aggregated date ranges. Observe the "month view backfill" notice if fewer than 10 days of history are available.
4. **App Detail Screen**: Tap an app from the Stats or Home screen. Verify the 7-day historical trend chart, today's hourly timeline, and the stats grid (Night Usage, Sessions).
5. **Interactive Charts**: Scrub your finger across the BarChart in the Stats screen and App Detail screen. Feel the haptic ticks and ensure the tooltip updates seamlessly.
## Phase 2: Design System & Onboarding
**What was done:**
- Implemented comprehensive design system tokens (`src/theme/tokens.ts`): dark-first (`#0B0D12` deep ink, `#12151C`/`#171B24` elevated cards, 1px 6% white inner border), light theme tokens, Google Fonts integration (Space Grotesk & Plus Jakarta Sans), spacing grid, and stable per-app color hashing.
- Implemented motion principles (`src/theme/motion.ts`) featuring UI-thread spring configurations (`default`, `press`, `gentle`, `bouncy`), haptic triggers via `expo-haptics`, and OS `useReducedMotion` support.
- Built `ThemeProvider` and `useTheme` hook (`src/theme/ThemeContext.tsx`) for dynamic dark/light theme switching and font loading state.
- Implemented all Section 9.3 core UI components in `src/components/ui/`:
  - `Screen`: SafeArea wrapper with dynamic status bar and scroll/refresh integration.
  - `Card`: translucent surface with soft top gradient and 1px inner border.
  - `GlowCard`: glowing accent aura halo and gradient border for coach insights.
  - `Pill` & `Chip`: filter chips with active gradient, icons, badges, and haptic feedback.
  - `SegmentedControl`: spring-sliding thumb selector for Day / Week / Month.
  - `Pressable3D`: UI-thread spring scale (0.97) with light haptic feedback.
  - `Button`: primary gradient (`#7C5CFF` to `#35E0C2`), secondary, ghost, danger, loading, and disabled states.
  - `AnimatedNumber`: smooth count-up animation with tabular numerals.
  - `ProgressRing`: SVG-based hardware-accelerated circular progress ring with gradient stroke and centered stats.
  - `AppIcon`: cached rounded squircle with known brand colors and stable hash fallback.
  - `Skeleton`: shimmering gradient loaders for text, rects, and circular avatars.
  - `EmptyState`: warm, non-judgmental empty state with illustration and CTA.
  - `Sheet`: bottom sheet modal wrapper with spring slide-up and backdrop dismiss.
  - `Toast`: floating status alert pill with semantic icons and auto-dismiss.
  - `TabBar`: custom floating pill navigation bar with sliding spring indicator.
  - `Header`: large title and compact header modes with back navigation.
- Built interactive 3-page Onboarding flow (`src/features/onboarding/OnboardingFlow.tsx`) featuring value proposition, AI coach introduction, and privacy guarantee.
- Built polished Usage Access permission screen (`src/features/permissions/PermissionScreen.tsx`) with a 3-step illustrated guide, auto-detection on app resume (`AppState`), celebratory checkmark animation, and gentle notification permission prompt.
- Fulfilled Phase 2 Definition of Done with a Storybook-like `/dev/components` gallery screen showcasing every component in both dark and light modes.
- Passed full TypeScript typechecking (`npx tsc --noEmit` and `npm run typecheck`) and ESLint validation (`npx expo lint`).

**What the human should manually test:**
1. Start the app: `npx expo start` (or in the active android development build).
2. **Onboarding Flow:** Verify the 3 onboarding slides ("Where your time goes", "Your personal time coach", "Our Privacy Promise") with animated pager dots and the "Continue" / "Get Started" buttons.
3. **Permission Screen:** Check the 3-step illustrated guide. Tap "Open Android Settings", enable Usage Access for Hourly, and return to the app. Confirm that the permission is auto-detected and triggers the "Access Verified!" celebration state.
4. **Today's Overview:** Confirm today's total screen time in the hero ProgressRing with the AnimatedNumber count-up, top app breakdown cards with squircles, and coach insight card.
5. **Component Gallery (`/dev/components`):** Tap "Dev UI" or "Gallery" in the top bar to open `/dev/components`.
6. Test switching between **Dark Mode** and **Light Mode** using the top-right toggle button.
7. Interact with components: tap "Randomize Time" to see the ProgressRing & AnimatedNumber animate, toggle the Day/Week/Month SegmentedControl, press buttons for spring scale and haptic feedback, open the bottom sheet modal, and trigger the Good / Nudge / Alert floating toasts.

## Phase 1: Native Usage Module
**What was done:**
- Created a local Expo module `usage-stats` with Kotlin implementation.
- Implemented `UsageStatsManager` queries (`getDailyUsage`, `getHourlyUsage`, `getRecentSessions`).
- Implemented `hasUsageAccess` and `openUsageAccessSettings`.
- Created an Expo config plugin (`plugins/withUsageStats.ts`) to add the necessary Android permissions and queries to the manifest automatically.
- Created `UsageRepository` with `expo-sqlite` to cache today's usage metrics locally.
- Added a debug screen in `app/index.tsx` that prompts for permissions and renders the cached app usage list.

**What the human should manually test:**
1. Start the dev server: `pnpm --filter mobile run android`.
2. Observe the "Permission Required" screen. Tap "Grant Usage Access", allow it in settings, and return.
3. Observe the list of today's app usage metrics populating on the screen.
4. Compare the top couple of apps in the debug list to Android's built-in Digital Wellbeing screen. They should match closely (±5%).

## Phase 0: Foundation
**What was done:**
- Initialized monorepo with `pnpm` workspaces (`apps/mobile`, `apps/api`, `packages/shared`).
- Configured Expo mobile app (`apps/mobile`) with TypeScript, Expo Router, and initial `theme/tokens.ts`.
- Configured Node + Hono API (`apps/api`) with TypeScript.
- Configured Shared package (`packages/shared`) for types and zod schemas.
- Resolved dependency structure and successfully passed typechecking (`pnpm typecheck`).
