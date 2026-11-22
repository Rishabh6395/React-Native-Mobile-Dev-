# Changelog

## Visual Redesign: Glassmorphism, Auth with Guest Mode, Glowing Line Charts & Category Bars
**What was done:**
- Replaced font stack with **Inter** (`@expo-google-fonts/inter`) across the design system for a crisp, minimal typography hierarchy with tabular numerals.
- Implemented iOS-inspired frosted glassmorphism across UI primitives (`Card`, `GlowCard`, `TabBar`) with subtle borders, translucent surfaces, and `expo-blur` on hero surfaces.
- Built **Auth Screen Redesign** (`apps/mobile/src/features/auth/SignInScreen.tsx`):
  - 3 clean entry paths: **Continue as Guest** (no account required, local-only storage), **Social Login** (Google, GitHub), and **Email Sign In / Sign Up**.
  - Integrated persistent guest mode flags in `lib/auth.ts` and gated launch in `app/index.tsx`.
- Redesigned **Today's Activity Chart** into `ActivityLineChart` (`src/components/charts/ActivityLineChart.tsx`):
  - Monotone cubic bezier smooth curve with animated draw-in stroke.
  - Multi-stop gradient glowing area fill underneath.
  - Interactive pan scrubbing with haptic feedback ticks and glowing point indicator.
- Redesigned **Top Apps & App Icon** (`src/components/ui/AppIcon.tsx`):
  - Added native installed app icon lazy-loading cache via `getInstalledApps()`.
  - Added branded vector logos with authentic gradients/glyphs for Instagram, YouTube, WhatsApp, Chrome, Spotify.
  - Redesigned app rows with glass backgrounds, glowing rank pill badges, and clean spacing.
- Redesigned **Stats Dashboard** (`app/(tabs)/stats.tsx`):
  - Integrated `ActivityLineChart` for Day, Week, and Month views.
  - Replaced circular donut with modern horizontal `CategoryBars` (`src/components/charts/CategoryBars.tsx`) featuring category icons, percentages, and Reanimated progress bars.
- Verified TypeScript compilation (`npx tsc --noEmit`) with 0 errors across all workspaces.

**What the human should manually test:**
1. **Onboarding & Auth Flow:**
   - Tap "Continue as Guest" to immediately access all features without credentials.
   - Alternatively, test Google / GitHub social login or switch to the email form.
2. **Home Screen (`(tabs)/index`):**
   - Inspect the frosted glass Hero Card and floating neon pill TabBar.
   - Look at the new smooth **Activity Line Graph** with the glowing purple/cyan area fill. Drag your finger across it to inspect the glowing dot and feel the haptic ticks.
   - Inspect the **Top Apps** list: observe real app logos (e.g. Instagram gradient camera, YouTube red play glyph) and glass card styling.
3. **Stats Screen (`(tabs)/stats`):**
   - Toggle between Day, Week, and Month tabs.
   - Check the glowing area line graph adjusting across time ranges.
   - Check the new **Categories** horizontal progress bars with animated fill and distinct category icons.

**What was done:**
- Built full **AI Coach Screen** (`app/(tabs)/coach.tsx`) replacing placeholder with conversational screen time coach.
- Integrated real device usage metrics from `UsageRepository` so coach responses directly analyze today's foreground minutes, top apps, night-time usage, and category distribution.
- Created **Coach Suggestion Engine** (`apps/mobile/src/features/coach/coachEngine.ts`) with intelligent contextual responses and structured cards (`breakdown`, `insight`, `swap`, `reductionPlan`, `goalAction`).
- Implemented **Structured Coach Cards** (`apps/mobile/src/features/coach/CoachCard.tsx`) rendering app distribution bars, before/after swap recommendations, stepped reduction plans, and one-tap goal setting.
- Built **Free Tier Quota Manager** (`apps/mobile/src/features/coach/coachQuota.ts`) with persistent storage (`expo-secure-store`), providing 10 default free suggestions, consumption logic, and reactive `useCoachQuota` hook.
- Built **Full-Screen 30-Second Rewarded Ad Modal** (`apps/mobile/src/features/coach/RewardedAdModal.tsx`) with animated soundwaves, live 30-to-0 second countdown, progress bar, early exit prevention, and +3 suggestions unlock.
- Built **Quota Paywall Modal** (`apps/mobile/src/features/coach/QuotaPaywallModal.tsx`) offering users the choice between Hourly Pro upgrade ($4.99/mo with unlimited suggestions) and watching a 30s rewarded ad (+3 suggestions).
- Connected "Ask coach about this app" in `app-detail.tsx` and "Ask the Coach" in `(tabs)/index.tsx` with prefilled prompt deep-linking.
- Added backend coach routes in `apps/api/src/routes/coach.ts` (`/v1/coach/quota`, `/v1/coach/ad-reward`, `/v1/coach/upgrade`, `/v1/coach/chat`) and mounted in API root.
- Verified TypeScript compilation with 0 errors across all workspaces (`npm run typecheck`).

**What the human should manually test:**
1. **AI Coach Tab (`(tabs)/coach`):**
   - Tap the **Coach** tab in the floating bottom navigation.
   - Observe the initial greeting message analyzing today's device usage and displaying today's focus breakdown card.
   - Check the top header badge showing **"10 Left"** (or current free quota).
2. **Chat & Quick Suggestions:**
   - Tap any suggestion chip (e.g. *"Where did my time go today?"* or *"Suggest swaps for mindless scrolling"*).
   - Observe the typing indicator ("Analyzing your usage patterns...") and the structured response with swap suggestions or reduction plans.
   - Note the quota badge decrementing by 1 (e.g. 10 -> 9).
   - Tap **"Set Limit Goal"** inside any reduction plan card to see the instant feedback toast and haptic.
3. **Quota Limit & Rewarded Ad:**
   - Continue asking questions or tap the header quota pill to open the **Quota Paywall Modal**.
   - Tap **"Watch 30s Ad (+3 Suggestions)"** to launch the full-screen rewarded ad.
   - Watch the live 30-second countdown with animated soundwave visualizer.
   - When the countdown finishes, tap **"Claim +3 AI Suggestions"** — verify that 3 suggestions are credited and a celebratory toast displays!
4. **Upgrade to Pro:**
   - Open the Quota Paywall Modal and tap **"Upgrade to Pro"** — verify that the badge changes to a gold **"PRO"** crown and unlocks unlimited coaching.

## Phase 5: AI reports
**What was done:**
- Implemented `UsageContext` builder (`apps/api/src/ai/usageContextBuilder.ts`) computing privacy-first pre-aggregated metrics from Postgres (`DailyAppUsage`, `Goal`, `ContentLog`).
- Enhanced AI report generator (`apps/api/src/ai/reportGenerator.ts`) using Claude Haiku with temperature tuning, retry loop on validation failure, and deterministic offline synthesis fallback.
- Added strict server-side tier limits enforcement and quota tracking in `reportsRouter` based on `packages/shared/src/plans.ts` (Free plan restricted to 1 weekly report; Plus/Pro unlocks daily & monthly).
- Built automated weekly scheduled job route (`/v1/reports/scheduled-job`) to pre-generate reports for active users.
- Created Phase 5 Definition of Done validation suite (`apps/api/test/reportsFixtures.test.ts`) verifying 100% valid JSON generation across 20 diverse, realistic user profile fixtures.
- Upgraded mobile Reports tab (`app/(tabs)/reports.tsx`) with SegmentedControl for Weekly/Daily/Monthly, Free tier lock badges, loading skeletons, and interactive report cards.
- Redesigned mobile Report Detail screen (`app/report-detail.tsx`) with score badge, Space Grotesk time stats, delta indicators, structured cards (`breakdown`, `insight`, `pattern`, `win`), "Add this as a goal" actions, and follow-up chips routing to Coach.
- Validated with 0 errors across TypeScript typechecking (`tsc --noEmit`) and ESLint (`expo lint`).

**What the human should manually test:**
1. **Reports Tab (`(tabs)/reports`):**
   - Tap the Reports tab in the bottom bar.
   - Switch between **Weekly**, **Daily**, and **Monthly** tabs.
   - Observe the Plus lock banner on Daily/Monthly previews for free-tier users.
   - Tap "Generate Fresh Report" or the empty state action to trigger report generation with loading spinner.
2. **Report Detail Screen (`/report-detail`):**
   - Tap any report card to open the detail view.
   - Verify the headline, total screen time, and delta percentage.
   - Inspect the structured sections: app breakdown with icons, insights with severity coloring, bedtime patterns, and win celebration cards.
   - Tap **"Add this as a goal"** on any recommended habit card — feel the haptic feedback and verify the state changes to "Goal Added ✓".
   - Tap any of the **"Ask Your Coach"** suggestion chips at the bottom to transition to the AI coach chat.

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
