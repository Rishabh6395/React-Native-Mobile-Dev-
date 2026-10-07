# AI Screen-Time Coach: Android Build Spec (for the coding agent)

> Working name: **Hourly** (placeholder, keep the name in one config constant so it's easy to rename).
> Platform: **Android only** (iOS is out of scope for this spec).
> Stack: **React Native + Expo (dev build, TypeScript)**, **Neon Postgres + Prisma**, **Node API (Hono)**, **Claude API** for the coach.
> Top priority: **UI that feels premium, aesthetic, and buttery smooth (60 fps+).**

---

## 0. How the agent should work

1. Build **phase by phase** (Section 12). Do not start a phase until the previous one meets its **Definition of Done (DoD)**.
2. After each phase: run `pnpm typecheck && pnpm lint`, build a dev APK (`eas build --profile development --platform android`) or run `npx expo run:android`, and write a short `CHANGELOG.md` entry listing what the human should manually test.
3. Pin versions. Before installing any library, check that it supports the **current Expo SDK + New Architecture** (it is enabled by default). If a library listed here has a breaking change, use the closest maintained alternative and note it in `DECISIONS.md`.
4. Keep every magic value (colors, spacing, durations, spring configs, plan limits) in **tokens/config files**, never inline.
5. Never send raw usage events to the server or to the LLM. Only **daily per-app aggregates** (see Section 5).
6. Everything the user sees must have **loading (skeleton), empty, and error states**.
7. Maintain `DECISIONS.md` for any deviation from this spec, with the reason.

---

## 1. Product summary

An Android app that shows users **where their phone time goes** (daily / weekly / monthly) and an **AI coach** that explains it in structured cards, then lets the user **cross-question it**. Example: the coach says "Netflix took 9h 40m this week." The user replies with what they watched, and the coach suggests lower-time or more productive alternatives and sets a gradual reduction plan.

Tone rule: say "where your time went", never "wasted". Warm, non-judgmental, specific, short.

### MVP scope (what ships to Play Store)
- Usage Access onboarding, dashboards (Day / Week / Month), app detail
- AI structured reports (daily, weekly, monthly)
- AI chat coach with a **"what I watched" content log** and content-swap suggestions
- Goals and per-app daily limits with notifications (nudges only, **no hard blocking** in MVP)
- Auth, cloud sync, subscriptions (Free / Plus / Pro / Ultimate) via RevenueCat
- Settings, privacy controls, data delete/export

### Explicitly out of scope for MVP
Hard app blocking (needs overlay or accessibility permissions), Accessibility Service scraping, iOS, voice mode, family sharing, Netflix/YouTube file import (planned for post-MVP, Section 13).

---

## 2. Tech stack (decisions)

### Mobile
| Concern | Choice |
|---|---|
| Framework | Expo (latest stable SDK), **dev build via EAS** (not Expo Go), TypeScript strict |
| Navigation | **Expo Router** (file-based), native stack + custom animated tab bar |
| Native Android code | **Expo Modules API (Kotlin)** local module `modules/usage-stats` |
| Styling | **NativeWind v4** (Tailwind) + a `theme/tokens.ts` file. Alternative if NativeWind conflicts with the Reanimated version: Unistyles |
| Animation | **react-native-reanimated** (latest) + **react-native-gesture-handler** |
| Charts / custom graphics | **@shopify/react-native-skia** + **victory-native (XL)** (Skia-based, gesture-friendly) |
| Bottom sheets | **@gorhom/bottom-sheet** |
| Lists | **@shopify/flash-list** |
| Gradients | **expo-linear-gradient** (and Skia gradients for glows) |
| Blur / glass | `expo-blur` is costly on Android. Prefer **translucent surfaces + gradient + subtle border** (fake glass). Use real blur only on 1 or 2 hero surfaces and test on a mid-range phone |
| Icons | **lucide-react-native** (+ react-native-svg) |
| Micro-animations | **lottie-react-native** (loading, empty states, celebration), **moti** is optional for declarative enter animations |
| Haptics | **expo-haptics** |
| Fonts | **expo-font** with `@expo-google-fonts/plus-jakarta-sans` (UI) and `@expo-google-fonts/space-grotesk` (big numbers) |
| Server state | **TanStack Query** |
| Client state | **Zustand** |
| Fast KV storage | **react-native-mmkv** |
| Local DB (usage cache) | **expo-sqlite** (optionally with Drizzle) |
| Forms / validation | **react-hook-form + zod** |
| Chat streaming | `expo/fetch` (supports streaming responses) over SSE |
| Notifications | **expo-notifications** |
| Background work | **expo-background-task** (WorkManager under the hood) |
| Billing | **react-native-purchases (RevenueCat)** |
| Auth client | **Better Auth** Expo client (Google sign-in + email OTP). Fallback: Clerk if Better Auth gives trouble |
| Monitoring | **Sentry**, **PostHog** |

### Backend
| Concern | Choice |
|---|---|
| DB | **Neon Postgres** (pooled URL for the app, **direct URL for migrations**) |
| ORM | **Prisma** with the **Neon driver adapter** (follow the current Prisma + Neon docs for the adapter and config) |
| API | **Node + Hono + TypeScript**, deployed on Railway / Render / Fly (simple long-lived SSE streaming). Vercel is possible but streaming limits need care |
| Validation | **zod** schemas shared from `packages/shared` |
| Auth | **Better Auth** with the Prisma adapter, JWT/session verified by middleware |
| AI | **Anthropic API**. Use `claude-haiku-4-5-20251001` for reports/summaries and `claude-sonnet-5-5` for chat coaching (names kept in config, easy to swap). Use **tool use / JSON-schema outputs**, plus **prompt caching** for the static system prompt |
| Billing | RevenueCat **webhooks** to the backend, which updates the `Subscription` table (the server is the source of truth for quotas) |
| Rate limiting | Hono middleware (per user, per tier) backed by the Neon `UsageCounter` table (Redis not needed for MVP) |
| Logging | pino + Sentry |

### Monorepo layout (pnpm workspaces)
```
/
├─ apps/
│  ├─ mobile/                 # Expo app
│  │  ├─ app/                 # Expo Router screens
│  │  ├─ src/
│  │  │  ├─ components/       # ui/, charts/, cards/, chat/
│  │  │  ├─ features/         # usage/, reports/, coach/, goals/, billing/, settings/
│  │  │  ├─ hooks/  lib/  store/  theme/
│  │  ├─ modules/usage-stats/ # Kotlin native module (Expo Modules API)
│  │  ├─ assets/ (lottie, fonts, images)
│  │  └─ app.config.ts  eas.json
│  └─ api/
│     ├─ src/ (routes/, services/, ai/, middleware/, jobs/)
│     └─ prisma/ (schema.prisma, migrations/)
├─ packages/shared/           # zod schemas, TS types, plan config, constants
├─ DECISIONS.md  CHANGELOG.md  README.md
```

---

## 3. Native module: `usage-stats` (Kotlin)

Expose these functions to JS (all typed in `modules/usage-stats/index.ts`):

| Function | Behavior |
|---|---|
| `hasUsageAccess(): boolean` | Check via `AppOpsManager` (`OPSTR_GET_USAGE_STATS`) |
| `openUsageAccessSettings(): void` | Intent `Settings.ACTION_USAGE_ACCESS_SETTINGS` (with package URI when supported) |
| `getDailyUsage(startMs, endMs): AppUsage[]` | Per-package foreground ms, launch count, session count, night-time ms (22:00 to 06:00 local) |
| `getHourlyUsage(dayStartMs): HourBucket[]` | 24 buckets of total foreground ms (for the day timeline) |
| `getInstalledApps(): AppMeta[]` | Only **launchable** apps: `packageName`, `label`, `category` (from `ApplicationInfo.category`), icon as small base64 PNG (cache it) |
| `getRecentSessions(dayStartMs): Session[]` | Sessions (start, end, package), kept **on device only**, used for local doomscroll heuristics |

Implementation notes:
- Compute foreground time from **`UsageStatsManager.queryEvents`** (`ACTIVITY_RESUMED` / `ACTIVITY_PAUSED`, plus handling of screen-off and day boundaries). It is more accurate than `queryUsageStats` bucket totals. Clip sessions at day boundaries in the **user's local timezone**.
- Exclude the launcher, system UI, and this app itself from totals (configurable ignore list).
- Group by `packageName`. Map to `category` (Social, Video, Games, Productivity, Communication, Other) using a bundled lookup of popular package names first, then `ApplicationInfo.category` as fallback.
- **Play Store compliance:** do **not** request `QUERY_ALL_PACKAGES`. Use a `<queries>` block with a `MAIN` / `LAUNCHER` intent filter to see launchable apps. Declare `PACKAGE_USAGE_STATS` with `tools:ignore="ProtectedPermissions"`.
- Add a config plugin (`plugins/withUsageStats.ts`) so `expo prebuild` keeps manifest changes reproducible.
- Unit-test the session-merging logic (pure Kotlin functions) with fixtures: overlapping events, midnight crossing, missing pause event.

---

## 4. Data flow (device first, sync second)

1. App opens, then checks `hasUsageAccess`. If not granted, route to the permission screen.
2. A **`UsageRepository`** reads from SQLite first (instant UI). It then refreshes today's data from the native module and updates SQLite and the UI.
3. A **background task** (about every 3 to 6 hours, plus on app foreground) computes daily aggregates for the last 3 days and **syncs them to the API** with an idempotent upsert on `(userId, date, packageName)`.
4. **Backfill:** Android keeps limited history (roughly 7 to 10 days of event data). On first run, read as far back as the OS allows. Month view builds up over time. Show a friendly "Your monthly view fills in as days pass" state for new users.
5. Server is the source of truth for **AI reports**; the device is the source of truth for **raw usage**.

---

## 5. Database schema (Prisma, Neon)

```prisma
generator client { provider = "prisma-client-js" }
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled
  directUrl = env("DIRECT_URL")     // migrations
}

enum Plan        { FREE PLUS PRO ULTIMATE }
enum ReportType  { DAILY WEEKLY MONTHLY }
enum ChatRole    { USER ASSISTANT TOOL }
enum ContentKind { SERIES MOVIE VIDEO_CHANNEL MUSIC GAME OTHER }

model User {
  id          String   @id @default(cuid())
  email       String?  @unique
  name        String?
  timezone    String   @default("Asia/Kolkata")
  createdAt   DateTime @default(now())
  // Better Auth tables (Account, Session, Verification) are generated per its docs
  subscription Subscription?
  usage        DailyAppUsage[]
  reports      AiReport[]
  threads      ChatThread[]
  contentLogs  ContentLog[]
  goals        Goal[]
  counters     UsageCounter[]
  devices      Device[]
}

model Device {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fcmToken  String?
  platform  String   @default("android")
  appVersion String?
  lastSeen  DateTime @default(now())
}

model DailyAppUsage {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date         DateTime @db.Date            // user's local date
  packageName  String
  appName      String
  category     String
  foregroundMs Int
  launches     Int      @default(0)
  sessions     Int      @default(0)
  nightMs      Int      @default(0)
  longestSessionMs Int  @default(0)
  updatedAt    DateTime @updatedAt
  @@unique([userId, date, packageName])
  @@index([userId, date])
}

model AiReport {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        ReportType
  periodStart DateTime   @db.Date
  periodEnd   DateTime   @db.Date
  payload     Json                          // validated ReportPayload (Section 7)
  model       String
  inputTokens  Int @default(0)
  outputTokens Int @default(0)
  createdAt   DateTime @default(now())
  @@unique([userId, type, periodStart])
}

model ChatThread {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?
  summary   String?                         // rolling memory summary (Pro+)
  createdAt DateTime @default(now())
  messages  ChatMessage[]
}

model ChatMessage {
  id        String   @id @default(cuid())
  threadId  String
  thread    ChatThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  role      ChatRole
  content   Json                            // text and/or structured cards
  createdAt DateTime @default(now())
  @@index([threadId, createdAt])
}

model ContentLog {                          // "what I watched" captured through chat
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceApp   String                        // "netflix", "youtube", ...
  title       String
  kind        ContentKind
  genres      String[]
  watchedWeek DateTime    @db.Date          // week start
  source      String      @default("chat")  // chat | import (future)
  createdAt   DateTime    @default(now())
  @@index([userId, watchedWeek])
}

model Goal {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  packageName String?                       // null = total screen time
  dailyLimitMs Int
  active      Boolean  @default(true)
  planJson    Json?                         // gradual reduction plan from the coach
  createdAt   DateTime @default(now())
}

model Subscription {
  userId     String   @id
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan       Plan     @default(FREE)
  status     String   @default("none")      // active | trial | expired | billing_issue
  expiresAt  DateTime?
  rcCustomerId String?
  updatedAt  DateTime @updatedAt
}

model UsageCounter {                        // AI quota tracking
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date     DateTime @db.Date
  chatMessages Int  @default(0)
  reportsGenerated Int @default(0)
  @@unique([userId, date])
}
```

---

## 6. API surface (Hono, all routes under `/v1`, zod-validated, auth required except webhooks)

| Method + path | Purpose |
|---|---|
| `POST /usage/sync` | Upsert array of `DailyAppUsage` rows (idempotent, max 31 days per call) |
| `GET /usage/summary?range=day\|week\|month&date=` | Aggregated totals, per-app, per-category, deltas vs previous period |
| `GET /reports?type=&periodStart=` | Fetch a report. If missing and quota allows, generate it |
| `POST /reports/generate` | Force-generate (rate limited per tier) |
| `GET /chat/threads` · `POST /chat/threads` | List / create threads |
| `GET /chat/threads/:id/messages` | History |
| `POST /chat/threads/:id/messages` | Send message, **SSE stream** of tokens and structured card events |
| `GET /content-log?week=` · `POST /content-log` · `DELETE /content-log/:id` | What the user watched |
| `GET/POST/PATCH/DELETE /goals` | Goals and limits |
| `POST /devices` | Register push token |
| `GET /me` · `DELETE /me` · `GET /me/export` | Profile, account deletion, data export |
| `POST /webhooks/revenuecat` | Verified by shared secret. Updates `Subscription` |

All limits are enforced **server-side** from `packages/shared/plans.ts` (single source of truth for the plan matrix).

---

## 7. AI layer (server-side)

### 7.1 Input: pre-aggregated, never raw
Build a compact `UsageContext` JSON before each call: period totals, top 8 apps with minutes, category split, night-time minutes, longest sessions, deltas vs the previous period, active goals, and the content log for the week. Typically under ~1.5k tokens.

### 7.2 Structured report output (validated with zod; retry once on failure)
```ts
ReportPayload = {
  headline: string,                       // one friendly line
  totalMinutes: number, deltaPct: number,
  scoreLabel: "light" | "balanced" | "heavy",
  sections: Array<
    | { kind: "breakdown", items: { app: string, minutes: number, note?: string }[] }
    | { kind: "insight",   title: string, body: string, severity: "info"|"nudge"|"alert" }
    | { kind: "pattern",   title: string, body: string }      // e.g. late-night scrolling
    | { kind: "win",       title: string, body: string }
  >,
  actions: Array<{ id: string, title: string, why: string, effort: "tiny"|"small"|"medium",
                   goal?: { packageName?: string, dailyLimitMinutes: number } }>,
  followUpPrompts: string[]               // tappable chips that open the chat
}
```
The mobile app renders each `kind` with its own animated card component (Section 9). Never render raw model text outside these slots.

### 7.3 Chat coach
- System prompt: supportive, non-judgmental, concise, no medical or therapy claims. If the user shows signs of distress, respond kindly and suggest professional or trusted support. Stay on topic (habits, screen time, content choices).
- **Tools exposed to the model** (server executes them, the model never touches the DB directly):
  - `get_usage_summary(range)`: aggregated stats
  - `save_content_log(items[])`: store titles the user says they watched
  - `suggest_alternatives(context)`: returns a structured swap card (see below)
  - `create_goal(packageName, dailyLimitMinutes, plan?)`: needs user confirmation in UI
- **Content swap card:** `{ basedOn: string[], suggestions: [{ title, kind, whyBetter, episodesOrLength, appToWatchOn? }], reductionPlan?: { weeks: [{ week, targetMinutesPerDay }] } }`. Prefer finite series, documentaries, skill-building channels, and shorter formats. Do not claim availability on a platform unless sure. Phrase as "worth checking on {platform}".
- Streaming events: `token`, `card`, `tool_status`, `done`, `error`.
- Memory: Free = last 10 messages. Plus+ = last ~20 + rolling `summary`. Pro/Ultimate = summary plus goals and content-log history.
- Cost control: Haiku for reports and titles, Sonnet for chat. Cache the static system prompt. Hard per-tier daily message caps. Truncate history.

---

## 8. Plan matrix (config in `packages/shared/plans.ts`)

| Feature | Free | Plus | Pro | Ultimate |
|---|---|---|---|---|
| Dashboards (day/week/month), app detail | ✅ | ✅ | ✅ | ✅ |
| AI report | 1 weekly summary (short) | Daily, weekly, monthly | Same + deeper insights | Same + yearly review |
| AI chat messages / day | 3 | 20 | 100 | 300 (fair use) |
| Goals / limits | 1 | 5 | Unlimited | Unlimited |
| Content log and swap suggestions | Basic (1/week) | ✅ | ✅ Unlimited + reduction plans | ✅ |
| Chat memory | ❌ | Short | Long | Long + weekly check-in |
| Smart nudges | ❌ | Limit alerts | + doomscroll detection | + proactive coaching |
| Data export | ❌ | ❌ | ✅ | ✅ |

Trial: 7 days on Plus or Pro (configured in RevenueCat). Annual plan shown first. Regional pricing configured in Play Console and RevenueCat. Entitlement IDs: `plus`, `pro`, `ultimate`.

**Paywall triggers** (not only a settings button): hitting the chat cap, tapping a locked report section (blurred preview), setting a 2nd goal, opening a monthly report, and after the first "aha" moment (first weekly report).

---

## 9. UI / UX specification (primary focus)

### 9.1 Design language
- **Dark-first**, with a light theme fully supported through tokens. Mood: calm, premium, "Apple Fitness meets Linear".
- **Surfaces:** deep ink background (`#0B0D12`), elevated cards (`#12151C` to `#171B24`) with a 1px inner border at 6% white and soft inner gradient. Corner radius 24 for cards, 16 for chips, 999 for pills.
- **Accent:** one signature gradient (e.g. violet `#7C5CFF` to aqua `#35E0C2`), used sparingly: hero ring, primary buttons, active tab, key chart series. Semantic colors: calm green (good), amber (nudge), soft coral (alert).
- **Per-app colors:** a stable palette hashed from `packageName` for chart consistency, with known brand-ish colors for popular apps.
- **Typography:** Space Grotesk for big numbers (`4h 12m` hero), Plus Jakarta Sans for everything else. Scale: 12 / 14 / 16 / 20 / 28 / 44. Tabular numerals for time values.
- **Spacing:** 4-pt grid. Screen padding 20. Generous whitespace.
- **Iconography:** lucide, stroke 1.75.

### 9.2 Motion principles (implement in `theme/motion.ts`)
- Springs, not timings, for movement: `{ damping: 18, stiffness: 180, mass: 0.9 }` default, a snappier one for press feedback.
- **Press feedback** on every tappable: scale to 0.97 + light haptic. Build one `<Pressable3D>` primitive.
- **Staggered entrance** for lists and cards (40 ms offsets, Reanimated `entering` / layout animations).
- **Animated numbers:** count-up on mount and on range change (Reanimated shared value rendered with a text-from-shared-value technique or Skia text).
- **Charts** animate in (bars rise, lines draw), are **scrubbable** (drag to inspect, haptic tick per bar), and cross-fade on range change.
- **Shared tab-bar indicator** slides with a spring.
- **Skeleton shimmers** instead of spinners. Lottie only for empty states and celebrations.
- Respect the OS **reduce-motion** setting (`useReducedMotion`).
- All animations run on the **UI thread** (Reanimated worklets). No JS-driven animations in lists.

### 9.3 Core components (build once in `src/components/ui`)
`Screen`, `Card` (gradient + border), `GlowCard`, `Pill`/`Chip`, `SegmentedControl` (animated thumb, Day/Week/Month), `Pressable3D`, `Button` (primary gradient / secondary / ghost), `AnimatedNumber`, `ProgressRing` (Skia), `AppIcon` (cached, rounded squircle), `Skeleton`, `EmptyState`, `Sheet` (gorhom wrapper), `Toast`, `TabBar` (custom, floating pill), `Header` (collapsing large title).

### 9.4 Screens
1. **Splash / Onboarding (3 pages, swipeable, parallax):** value prop, "your time, explained", a privacy promise (data stays on device, only totals sync). Animated hero art (Skia/Lottie).
2. **Usage Access permission:** explains why in plain words, an illustrated 3-step mini-guide, a "Open settings" button, and auto-detects the grant when the user returns (AppState listener) with a success animation. Next, a notification permission ask (Android 13+) at a sensible moment, not at launch.
3. **Home:** greeting, hero **ProgressRing** with today's total and delta vs yesterday ("32m less than yesterday"), 24-hour mini timeline, top 3 apps, a **"Coach insight"** card (latest AI headline, tap opens the report), a goals strip, and a quick "Ask coach" input pill.
4. **Stats:** segmented Day / Week / Month. Scrubbable bar chart, category donut (Skia), ranked app list (FlashList) with animated bars and delta chips. Tap goes to **App Detail** (hourly heatmap, daily trend, launches, longest session, goal for this app, "Ask coach about this app" CTA).
5. **Reports:** list of daily/weekly/monthly reports. Report detail renders the structured sections as **swipeable/stacked cards** (breakdown, insight, pattern, win, actions) with a "Add this as a goal" button per action. Locked sections show a tasteful blurred preview + upgrade CTA.
6. **Coach (chat):** iMessage-quality feel: streaming text with a gentle typing cursor, **structured cards inline** (swap card, reduction-plan card, usage mini-chart), suggestion chips (`followUpPrompts`), "I watched…" quick-entry sheet (a chip input for titles, grouped by app), and a quota indicator for the free tier. Keyboard-aware layout (no jank), inverted FlashList, haptic on send.
7. **Goals:** list with progress rings, a create sheet (app picker, slider for the daily limit with haptic ticks), and a view of the coach's reduction plan as a stepped timeline.
8. **Paywall:** a full-screen sheet with 3 plan cards (Plus / Pro / Ultimate), "Most popular" on Pro, an annual/monthly toggle with the savings badge, a feature checklist that animates in, the trial CTA, restore purchases, terms and privacy links. Looks consistent with the rest of the app (no generic template).
9. **Settings and Privacy:** account, notification times, ignored apps, theme, data export, delete account, "what we collect" screen, manage subscription (deep link to Play).

### 9.5 Android performance rules
- Test on a **mid-range device**, not just a flagship. Target 60 fps in lists and charts.
- Enable Hermes (default), use `FlashList` with `estimatedItemSize`, memoize rows, avoid inline styles/closures in hot paths.
- Limit simultaneous Skia canvases per screen. Avoid more than 1 or 2 real-blur surfaces.
- Pre-cache app icons. Use `expo-image` for any bitmap with caching.
- Use release builds when judging smoothness (dev mode is much slower).

---

## 10. Notifications and background logic

- **Daily recap** at a user-chosen time (local notification built from the latest synced data).
- **Weekly report ready** push (server-triggered via FCM through Expo push, from a scheduled job on the API).
- **Limit nudges:** a background task checks usage against `Goal`s. At 80% and 100% of the limit, send a gentle local notification. (This is a nudge, not blocking.)
- **Doomscroll heuristic (Pro+, on device):** flag long continuous sessions in social/video apps (e.g. 25+ minutes across short hops of the same app) and late-night usage. Output is a local nudge and a field in the sync payload, not raw sessions.
- Respect quiet hours and Android's battery optimization. Document the manufacturer-specific background restrictions (Xiaomi, Oppo, etc.) and show a one-time help tip.

---

## 11. Security, privacy, and Play Store compliance

- Upload **only daily per-app aggregates**. Never upload raw events, notification contents, or screen contents.
- Clear in-app **prominent disclosure** before sending the user to the Usage Access screen (Play requires this for sensitive permissions). Write the **Data safety** form honestly.
- Provide privacy policy and terms URLs, account deletion in-app **and** via a web link (Play requirement), and a data export.
- HTTPS only, short-lived tokens stored in `expo-secure-store`, server rate limits, input validation on every route, secrets only in server env.
- India's DPDP Act and GDPR: consent screen, purpose limitation, deletion on request.
- Safety: the coach must not give medical or mental-health diagnoses. Add a gentle escalation message for distress signals.
- Target the current required Android API level. Use `expo-build-properties` for SDK versions. Ship an **AAB**.

---

## 12. Phased roadmap with Definition of Done

### Phase 0: Foundation (2 to 3 days)
- Monorepo, Expo dev build via EAS, TypeScript strict, ESLint/Prettier, Husky pre-commit, env handling.
- Design tokens, fonts, NativeWind config, theme provider (dark/light), Reanimated/Gesture Handler/Skia setup verified with a demo screen.
- Expo Router skeleton with the custom floating tab bar.
- **DoD:** dev APK installs and runs; the tab bar animates smoothly; `pnpm typecheck` passes.

### Phase 1: Native usage module (4 to 6 days)
- `modules/usage-stats` with all functions in Section 3, the config plugin, and Kotlin unit tests for session merging.
- Permission flow screen and `UsageRepository` + SQLite cache.
- A temporary debug screen listing today's per-app minutes.
- **DoD:** numbers match Android's Digital Wellbeing within about ±5% on a real device for the same day; permission grant is auto-detected; midnight crossing handled.

### Phase 2: Design system and onboarding (4 to 5 days)
- All core components in 9.3, the motion primitives, skeletons, and empty states.
- Onboarding (3 pages) and permission screen polished.
- **DoD:** a Storybook-like `/dev/components` screen shows every component in dark and light; no dropped frames on a mid-range device.

### Phase 3: Dashboards (6 to 8 days)
- Home, Stats (Day/Week/Month), App Detail, charts (bar, donut, ring, timeline), animated numbers, scrubbing with haptics.
- Month view backfill messaging.
- **DoD:** all screens are driven by real device data with loading/empty/error states; chart scrubbing is smooth; reduced-motion respected.

### Phase 4: Backend, auth, sync (5 to 7 days)
- Neon project, Prisma schema + migrations, Hono API scaffold, Better Auth (Google + email OTP), `/me`, `/usage/sync`, `/usage/summary`, `/devices`.
- Mobile auth screens, secure token storage, TanStack Query setup, background sync task.
- **DoD:** sign in, data syncs idempotently (re-running creates no duplicates), delete-account removes all rows, deployed API with health check.

### Phase 5: AI reports (5 to 6 days)
- `UsageContext` builder, report generation with zod validation + retry, caching in `AiReport`, scheduled weekly job.
- Reports list/detail UI with the structured card components, plus "add as goal" actions.
- **DoD:** daily/weekly/monthly reports generate with valid JSON 99%+ of the time across 20 fixture datasets; reports render with no raw text outside the slots; per-tier limits enforced server-side.

### Phase 6: AI chat coach and content log (7 to 9 days)
- SSE streaming endpoint, tool-use loop, the 4 tools, the content swap card, reduction-plan card, memory summary job.
- Chat UI (streaming, inline cards, chips, "I watched…" sheet, quota indicator), the content-log management screen.
- **DoD:** the demo conversation works end to end: coach states weekly stats, user lists dramas/k-pop/YouTube channels, coach saves them to `ContentLog`, returns a swap card and a gradual reduction plan, user accepts and a `Goal` is created. Streaming is smooth; offline/error retry works.

### Phase 7: Goals and notifications (4 to 5 days)
- Goals CRUD UI, limit nudges via background task, daily recap, weekly push, quiet hours, settings.
- **DoD:** a limit nudge fires within a reasonable window of crossing 80% and 100% on a real device, even after the app is closed (on at least two OEMs).

### Phase 8: Billing and paywall (4 to 5 days)
- RevenueCat setup (Play products: monthly + annual for 3 tiers, trial), `react-native-purchases`, webhook to `Subscription`, entitlement checks in the app and API, paywall UI, paywall triggers, restore purchases, upgrade/downgrade handling.
- **DoD:** purchases work with Play **license testers**; webhook updates plan within seconds; limits change immediately; expired subscription downgrades to Free gracefully.

### Phase 9: Polish, QA, release (5 to 7 days)
- Sentry, PostHog events (onboarding_completed, permission_granted, report_viewed, chat_message_sent, paywall_viewed, trial_started, purchase), crash-free target 99.5%+.
- Accessibility (TalkBack labels, contrast, font scaling), small-screen and tablet checks, app icon, Play listing assets, privacy policy, Data safety form.
- Play Console: internal test, then closed test, then production (note that new personal developer accounts must run a closed test with a minimum number of testers for a minimum period, so check Google's current rule and start early).
- **DoD:** release AAB passes pre-launch report, no ANRs, cold start under about 2 seconds on a mid-range device.

---

## 13. Post-MVP backlog (do not build yet)
- Netflix viewing-activity CSV import and Google Takeout (YouTube) import for automatic content logs
- Screenshot import with a vision model
- Focus sessions and hard blocking (needs additional permissions and a careful policy review)
- Home-screen widgets, streaks and badges, accountability partner / family sharing
- Voice mode, yearly review, referral program
- iOS (separate spec: Family Controls entitlement, different data model)

---

## 14. Acceptance checklist the human will use
- [ ] Usage numbers match Digital Wellbeing (±5%)
- [ ] Every screen has loading / empty / error states
- [ ] Animations are smooth on a mid-range phone (release build)
- [ ] Report and chat output are always structured cards, never raw dumps
- [ ] The AI never sees raw logs, only aggregates
- [ ] Quotas are enforced on the server, not only in the UI
- [ ] Account deletion removes everything
- [ ] Paywall appears at the right moments and purchases unlock features instantly
- [ ] Play policy items (disclosure, Data safety, no `QUERY_ALL_PACKAGES`) are in place
