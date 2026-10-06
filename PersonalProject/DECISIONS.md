# Architecture & Technical Decisions

## Phase 1: Native Usage Module
- **Local Expo Module**: Implemented the native usage module (`usage-stats`) using Expo's local module API (`npx create-expo-module --local`) rather than a bare React Native native module. This keeps it integrated natively with Expo autolinking.
- **Config Plugin**: Used a custom config plugin `plugins/withUsageStats.ts` to automatically merge `PACKAGE_USAGE_STATS` and `<queries>` into the Android manifest. This ensures the permissions are handled cleanly without modifying generated Android folders.
- **Session Processing**: Processing of `UsageEvents` is encapsulated within a separate `UsageStatsProcessor` object in Kotlin to make it easier to decouple and test if necessary later.
- **Icon Encoding**: App icons are retrieved via `PackageManager`, scaled down to 64x64 for memory efficiency, and encoded as Base64 strings natively, avoiding file system I/O on the JS side.

## Phase 0: Foundation
- **Monorepo Strategy**: Using `pnpm` workspaces for the monorepo instead of npm or yarn, following the project specification. Handled some package manager conflicts by clearing default `create-expo-app` installs and using `pnpm` strictly.
- **Expo Router Configuration**: Removed `App.tsx` in favor of Expo Router's file-based routing (`app/` directory).
- **TypeScript & Typechecking**: Strict mode enabled across all packages. Configured a unified `pnpm run typecheck` script to validate all workspace projects concurrently.
