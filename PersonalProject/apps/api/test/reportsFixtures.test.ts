import { ReportPayloadSchema, UsageContext } from 'shared';
import { generateReport } from '../src/ai/reportGenerator.js';

// 20 diverse, realistic fixture datasets spanning daily, weekly, and monthly contexts
export const FIXTURE_DATASETS: UsageContext[] = [
  // 1. Daily: Heavy Instagram / Doomscroll
  {
    period: 'daily',
    periodStart: '2026-10-10',
    periodEnd: '2026-10-10',
    totalMinutes: 360,
    previousPeriodTotalMinutes: 310,
    topApps: [
      { packageName: 'com.instagram.android', appName: 'Instagram', category: 'Social', minutes: 240 },
      { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Video', minutes: 70 },
      { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Communication', minutes: 35 },
    ],
    categorySplit: { Social: 240, Video: 70, Communication: 35, Other: 15 },
    nightTimeMinutes: 90,
    longestSessionMinutes: 85,
    activeGoals: [],
  },
  // 2. Daily: Balanced work day
  {
    period: 'daily',
    periodStart: '2026-10-09',
    periodEnd: '2026-10-09',
    totalMinutes: 125,
    previousPeriodTotalMinutes: 150,
    topApps: [
      { packageName: 'com.Slack', appName: 'Slack', category: 'Productivity', minutes: 50 },
      { packageName: 'com.google.android.gm', appName: 'Gmail', category: 'Productivity', minutes: 30 },
      { packageName: 'com.google.android.apps.maps', appName: 'Google Maps', category: 'Productivity', minutes: 25 },
    ],
    categorySplit: { Productivity: 105, Other: 20 },
    nightTimeMinutes: 10,
    longestSessionMinutes: 25,
    activeGoals: [],
  },
  // 3. Daily: Weekend gaming binge
  {
    period: 'daily',
    periodStart: '2026-10-08',
    periodEnd: '2026-10-08',
    totalMinutes: 310,
    previousPeriodTotalMinutes: 140,
    topApps: [
      { packageName: 'com.roblox.client', appName: 'Roblox', category: 'Games', minutes: 180 },
      { packageName: 'com.kiloo.subwaysurf', appName: 'Subway Surfers', category: 'Games', minutes: 80 },
      { packageName: 'com.discord', appName: 'Discord', category: 'Social', minutes: 35 },
    ],
    categorySplit: { Games: 260, Social: 35, Other: 15 },
    nightTimeMinutes: 45,
    longestSessionMinutes: 90,
    activeGoals: [],
  },
  // 4. Daily: Minimal digital detox
  {
    period: 'daily',
    periodStart: '2026-10-07',
    periodEnd: '2026-10-07',
    totalMinutes: 38,
    previousPeriodTotalMinutes: 190,
    topApps: [
      { packageName: 'com.google.android.dialer', appName: 'Phone', category: 'Communication', minutes: 18 },
      { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Communication', minutes: 12 },
    ],
    categorySplit: { Communication: 30, Other: 8 },
    nightTimeMinutes: 0,
    longestSessionMinutes: 10,
    activeGoals: [{ packageName: null, dailyLimitMinutes: 60 }],
  },
  // 5. Daily: Late-night scrolling
  {
    period: 'daily',
    periodStart: '2026-10-06',
    periodEnd: '2026-10-06',
    totalMinutes: 210,
    previousPeriodTotalMinutes: 200,
    topApps: [
      { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Video', minutes: 140 },
      { packageName: 'com.twitter.android', appName: 'X', category: 'Social', minutes: 50 },
    ],
    categorySplit: { Video: 140, Social: 50, Other: 20 },
    nightTimeMinutes: 110,
    longestSessionMinutes: 65,
    activeGoals: [],
  },
  // 6. Daily: High communication
  {
    period: 'daily',
    periodStart: '2026-10-05',
    periodEnd: '2026-10-05',
    totalMinutes: 240,
    previousPeriodTotalMinutes: 230,
    topApps: [
      { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Communication', minutes: 150 },
      { packageName: 'org.telegram.messenger', appName: 'Telegram', category: 'Communication', minutes: 60 },
    ],
    categorySplit: { Communication: 210, Other: 30 },
    nightTimeMinutes: 20,
    longestSessionMinutes: 30,
    activeGoals: [],
  },
  // 7. Daily: Audio & podcast focus
  {
    period: 'daily',
    periodStart: '2026-10-04',
    periodEnd: '2026-10-04',
    totalMinutes: 175,
    previousPeriodTotalMinutes: 180,
    topApps: [
      { packageName: 'com.spotify.music', appName: 'Spotify', category: 'Video', minutes: 95 },
      { packageName: 'au.com.shiftyjelly.pocketcasts', appName: 'Pocket Casts', category: 'Other', minutes: 55 },
    ],
    categorySplit: { Video: 95, Other: 80 },
    nightTimeMinutes: 15,
    longestSessionMinutes: 40,
    activeGoals: [],
  },
  // 8. Weekly: Average student profile
  {
    period: 'weekly',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-07',
    totalMinutes: 1680,
    previousPeriodTotalMinutes: 1620,
    topApps: [
      { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Video', minutes: 650 },
      { packageName: 'com.instagram.android', appName: 'Instagram', category: 'Social', minutes: 520 },
      { packageName: 'com.android.chrome', appName: 'Chrome', category: 'Productivity', minutes: 280 },
    ],
    categorySplit: { Video: 650, Social: 520, Productivity: 280, Other: 230 },
    nightTimeMinutes: 320,
    longestSessionMinutes: 80,
    activeGoals: [],
  },
  // 9. Weekly: Busy professional profile
  {
    period: 'weekly',
    periodStart: '2026-09-24',
    periodEnd: '2026-09-30',
    totalMinutes: 840,
    previousPeriodTotalMinutes: 920,
    topApps: [
      { packageName: 'com.Slack', appName: 'Slack', category: 'Productivity', minutes: 350 },
      { packageName: 'notion.id', appName: 'Notion', category: 'Productivity', minutes: 220 },
      { packageName: 'com.ubercab', appName: 'Uber', category: 'Other', minutes: 90 },
    ],
    categorySplit: { Productivity: 570, Other: 270 },
    nightTimeMinutes: 40,
    longestSessionMinutes: 30,
    activeGoals: [],
  },
  // 10. Weekly: Heavy social & video
  {
    period: 'weekly',
    periodStart: '2026-09-17',
    periodEnd: '2026-09-23',
    totalMinutes: 2520,
    previousPeriodTotalMinutes: 2400,
    topApps: [
      { packageName: 'com.instagram.android', appName: 'Instagram', category: 'Social', minutes: 1100 },
      { packageName: 'com.netflix.mediaclient', appName: 'Netflix', category: 'Video', minutes: 820 },
      { packageName: 'com.reddit.frontpage', appName: 'Reddit', category: 'Social', minutes: 410 },
    ],
    categorySplit: { Social: 1510, Video: 820, Other: 190 },
    nightTimeMinutes: 620,
    longestSessionMinutes: 115,
    activeGoals: [],
  },
  // 11. Weekly: Substantial time reduction win
  {
    period: 'weekly',
    periodStart: '2026-09-10',
    periodEnd: '2026-09-16',
    totalMinutes: 1200,
    previousPeriodTotalMinutes: 1850,
    topApps: [
      { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Communication', minutes: 420 },
      { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Video', minutes: 380 },
    ],
    categorySplit: { Communication: 420, Video: 380, Other: 400 },
    nightTimeMinutes: 80,
    longestSessionMinutes: 40,
    activeGoals: [{ packageName: 'com.instagram.android', dailyLimitMinutes: 45 }],
  },
  // 12. Weekly: Late-night habit focus
  {
    period: 'weekly',
    periodStart: '2026-09-03',
    periodEnd: '2026-09-09',
    totalMinutes: 1500,
    previousPeriodTotalMinutes: 1450,
    topApps: [
      { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Video', minutes: 700 },
      { packageName: 'com.twitter.android', appName: 'X', category: 'Social', minutes: 450 },
    ],
    categorySplit: { Video: 700, Social: 450, Other: 350 },
    nightTimeMinutes: 680,
    longestSessionMinutes: 90,
    activeGoals: [],
  },
  // 13. Weekly: Balanced habit
  {
    period: 'weekly',
    periodStart: '2026-08-27',
    periodEnd: '2026-09-02',
    totalMinutes: 920,
    previousPeriodTotalMinutes: 950,
    topApps: [
      { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Communication', minutes: 260 },
      { packageName: 'com.spotify.music', appName: 'Spotify', category: 'Video', minutes: 210 },
      { packageName: 'com.google.android.gm', appName: 'Gmail', category: 'Productivity', minutes: 180 },
    ],
    categorySplit: { Communication: 260, Video: 210, Productivity: 180, Other: 270 },
    nightTimeMinutes: 45,
    longestSessionMinutes: 30,
    activeGoals: [],
  },
  // 14. Weekly: Active goal follower
  {
    period: 'weekly',
    periodStart: '2026-08-20',
    periodEnd: '2026-08-26',
    totalMinutes: 1100,
    previousPeriodTotalMinutes: 1250,
    topApps: [
      { packageName: 'com.twitter.android', appName: 'X', category: 'Social', minutes: 210 },
      { packageName: 'com.Slack', appName: 'Slack', category: 'Productivity', minutes: 420 },
    ],
    categorySplit: { Productivity: 420, Social: 210, Other: 470 },
    nightTimeMinutes: 50,
    longestSessionMinutes: 35,
    activeGoals: [{ packageName: 'com.twitter.android', dailyLimitMinutes: 30 }],
  },
  // 15. Monthly: High-screen user
  {
    period: 'monthly',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    totalMinutes: 9600,
    previousPeriodTotalMinutes: 9400,
    topApps: [
      { packageName: 'com.instagram.android', appName: 'Instagram', category: 'Social', minutes: 3800 },
      { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Video', minutes: 2900 },
      { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Communication', minutes: 1500 },
    ],
    categorySplit: { Social: 3800, Video: 2900, Communication: 1500, Other: 1400 },
    nightTimeMinutes: 1800,
    longestSessionMinutes: 120,
    activeGoals: [],
  },
  // 16. Monthly: Mindful habit shift
  {
    period: 'monthly',
    periodStart: '2026-08-01',
    periodEnd: '2026-08-31',
    totalMinutes: 3900,
    previousPeriodTotalMinutes: 5200,
    topApps: [
      { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Communication', minutes: 1200 },
      { packageName: 'com.Slack', appName: 'Slack', category: 'Productivity', minutes: 1100 },
      { packageName: 'com.spotify.music', appName: 'Spotify', category: 'Video', minutes: 800 },
    ],
    categorySplit: { Communication: 1200, Productivity: 1100, Video: 800, Other: 800 },
    nightTimeMinutes: 210,
    longestSessionMinutes: 40,
    activeGoals: [{ packageName: null, dailyLimitMinutes: 150 }],
  },
  // 17. Monthly: Late-night streaming
  {
    period: 'monthly',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    totalMinutes: 6600,
    previousPeriodTotalMinutes: 6400,
    topApps: [
      { packageName: 'com.netflix.mediaclient', appName: 'Netflix', category: 'Video', minutes: 3100 },
      { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Video', minutes: 1800 },
    ],
    categorySplit: { Video: 4900, Other: 1700 },
    nightTimeMinutes: 2400,
    longestSessionMinutes: 130,
    activeGoals: [],
  },
  // 18. Monthly: Student exam season
  {
    period: 'monthly',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
    totalMinutes: 2700,
    previousPeriodTotalMinutes: 3800,
    topApps: [
      { packageName: 'com.ichi2.anki', appName: 'AnkiDroid', category: 'Productivity', minutes: 1400 },
      { packageName: 'cc.forestapp', appName: 'Forest', category: 'Productivity', minutes: 600 },
      { packageName: 'com.android.chrome', appName: 'Chrome', category: 'Productivity', minutes: 400 },
    ],
    categorySplit: { Productivity: 2400, Other: 300 },
    nightTimeMinutes: 60,
    longestSessionMinutes: 45,
    activeGoals: [],
  },
  // 19. Monthly: Extreme phone user
  {
    period: 'monthly',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    totalMinutes: 13200,
    previousPeriodTotalMinutes: 12900,
    topApps: [
      { packageName: 'com.instagram.android', appName: 'Instagram', category: 'Social', minutes: 5400 },
      { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Video', minutes: 4200 },
      { packageName: 'com.roblox.client', appName: 'Roblox', category: 'Games', minutes: 2100 },
    ],
    categorySplit: { Social: 5400, Video: 4200, Games: 2100, Other: 1500 },
    nightTimeMinutes: 3100,
    longestSessionMinutes: 140,
    activeGoals: [],
  },
  // 20. Monthly: Balanced mindful baseline
  {
    period: 'monthly',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    totalMinutes: 4800,
    previousPeriodTotalMinutes: 4900,
    topApps: [
      { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Communication', minutes: 1600 },
      { packageName: 'com.spotify.music', appName: 'Spotify', category: 'Video', minutes: 1200 },
      { packageName: 'com.android.chrome', appName: 'Chrome', category: 'Productivity', minutes: 900 },
    ],
    categorySplit: { Communication: 1600, Video: 1200, Productivity: 900, Other: 1100 },
    nightTimeMinutes: 180,
    longestSessionMinutes: 35,
    activeGoals: [],
  },
];

async function runDoDVerification() {
  console.log(`=== Phase 5 Definition of Done: Validating 20 Fixture Datasets ===`);
  let validCount = 0;

  for (let i = 0; i < FIXTURE_DATASETS.length; i++) {
    const fixture = FIXTURE_DATASETS[i];
    try {
      const { payload } = await generateReport(fixture);
      // Strict schema validation
      ReportPayloadSchema.parse(payload);

      // Verify no raw unassigned strings
      if (
        !payload.headline ||
        !payload.scoreLabel ||
        !Array.isArray(payload.sections) ||
        !Array.isArray(payload.actions) ||
        !Array.isArray(payload.followUpPrompts)
      ) {
        throw new Error('Payload contains empty or invalid structural slots');
      }

      validCount++;
      console.log(`✓ Fixture #${i + 1} (${fixture.period.toUpperCase()} - ${payload.scoreLabel}): Valid JSON`);
    } catch (err) {
      console.error(`✗ Fixture #${i + 1} failed validation:`, err);
    }
  }

  const successRate = (validCount / FIXTURE_DATASETS.length) * 100;
  console.log(`\nResults: ${validCount}/${FIXTURE_DATASETS.length} passed (${successRate}% validity)`);

  if (successRate >= 99) {
    console.log('✅ Definition of Done SATISFIED: 99%+ valid JSON generation achieved across 20 fixture datasets.');
    process.exit(0);
  } else {
    console.error('❌ Definition of Done FAILED: Validity under 99%.');
    process.exit(1);
  }
}

runDoDVerification();
