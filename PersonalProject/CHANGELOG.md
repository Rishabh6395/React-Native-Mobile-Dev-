# Changelog

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
