# Architecture & Technical Decisions

## Phase 4: Backend, auth, sync
- **Hono over Express**: Chose Hono for the backend API for its modern, standard-compliant API and excellent TypeScript support.
- **Neon Serverless with Prisma**: Used `@neondatabase/serverless` with `@prisma/adapter-neon` via the `driverAdapters` preview feature. This allows the Prisma Client to leverage WebSocket connections directly to Neon DB, sidestepping connection pooling limits in serverless edge environments.
- **Better Auth Integration**: Used `better-auth` as a streamlined, modern alternative to Passport or NextAuth for managing session generation and token issuance directly inside our Hono Node.js setup.
- **Background Sync Strategy**: Employed `expo-background-fetch` combined with `expo-task-manager` to construct `BACKGROUND_USAGE_SYNC`. Instead of syncing row-by-row on every event (which drains battery), the app gathers up to the last 3 days of SQLite records and pushes them in an idempotent payload when the OS permits background execution.

## Phase 3: Dashboards
- **Reanimated over SVG SMIL**: For chart animations, we drove SVG `strokeDashoffset` and dimensions purely through `react-native-reanimated` shared values on the UI thread instead of using SMIL or standard React state. This prevents JS thread blocking during chart render.
- **Flat Mapping over FlashList for Nested Scrolling**: While the spec initially considered `@shopify/flash-list` in the Stats screen, we chose to eagerly `.map()` the items since the parent view is a scrollable `<Screen>` (effectively a `ScrollView`). `FlashList` and `FlatList` cannot cleanly nest inside a regular `ScrollView` without breaking virtualization and causing warnings. Because the ranked app list is naturally bounded by the number of installed apps (typically 50-100 max with usage), mapping is fast enough on modern devices.
- **Date Range Aggregation Logic**: All date aggregations (Day, Week, Month, Deltas) are done synchronously in JavaScript (`src/features/usage/usageAggregation.ts`) on the fetched SQLite rows rather than writing complex SQL `GROUP BY` queries. This makes the logic easier to test and modify, and since the max dataset is ~30 days of daily rows per app, the payload is tiny and JS `reduce` is instantaneous.

## Phase 2: Design System & Onboarding
- **Design System & Tokens**: Built a dark-first token hierarchy (`#0B0D12` deep ink background, `#12151C`/`#171B24` elevated surfaces, 1px 6% white inner border, Space Grotesk tabular numerals for time values, Plus Jakarta Sans for UI, and a 4-pt spacing grid).
- **Fake Glass Performance Strategy**: Followed Section 2 & 9.1 guidelines by using translucent surfaces + subtle linear gradients + delicate borders rather than expensive runtime Gaussian blur filters (`expo-blur`), ensuring sustained 60fps+ performance on mid-range Android hardware.
- **Motion Primitives & UI-Thread Springs**: Implemented standard spring presets (`default`, `press`, `gentle`, `bouncy`) in `src/theme/motion.ts`. Encapsulated spring-press physics in `Pressable3D` with UI-thread worklets, haptic feedback (`expo-haptics`), and OS `useReducedMotion` accessibility compliance.
- **Vector & SVG Hardware Graphics**: Implemented `ProgressRing` using `react-native-svg` and Reanimated `useAnimatedProps` with gradient definitions, achieving fluid, hardware-accelerated circular progress without heavy Skia dependencies.
- **Phase 2 DoD Showcase (`/dev/components`)**: Created a dedicated, Storybook-like component gallery screen testing every core component in both dark and light modes with live state toggles (segmented control, buttons, glowing cards, animated count-up numbers, shimmer skeletons, toasts, bottom sheets, and floating pill tab bar).

## Phase 1: Native Usage Module
- **Local Expo Module**: Implemented the native usage module (`usage-stats`) using Expo's local module API (`npx create-expo-module --local`) rather than a bare React Native native module. This keeps it integrated natively with Expo autolinking.
- **Config Plugin**: Used a custom config plugin `plugins/withUsageStats.ts` to automatically merge `PACKAGE_USAGE_STATS` and `<queries>` into the Android manifest. This ensures the permissions are handled cleanly without modifying generated Android folders.
- **Session Processing**: Processing of `UsageEvents` is encapsulated within a separate `UsageStatsProcessor` object in Kotlin to make it easier to decouple and test if necessary later.
- **Icon Encoding**: App icons are retrieved via `PackageManager`, scaled down to 64x64 for memory efficiency, and encoded as Base64 strings natively, avoiding file system I/O on the JS side.

## Phase 0: Foundation
- **Monorepo Strategy**: Using `pnpm` workspaces for the monorepo instead of npm or yarn, following the project specification. Handled some package manager conflicts by clearing default `create-expo-app` installs and using `pnpm` strictly.
- **Expo Router Configuration**: Removed `App.tsx` in favor of Expo Router's file-based routing (`app/` directory).
- **TypeScript & Typechecking**: Strict mode enabled across all packages. Configured a unified `pnpm run typecheck` script to validate all workspace projects concurrently.
