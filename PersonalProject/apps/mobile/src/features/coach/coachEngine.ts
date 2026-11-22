import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { usageRepository } from '../usage/UsageRepository';
import { AppUsage } from '../../../modules/usage-stats';

export interface StructuredCoachCard {
  type: 'insight' | 'breakdown' | 'swap' | 'reductionPlan' | 'goalAction';
  title: string;
  subtitle?: string;
  badge?: string;
  items?: Array<{
    label: string;
    value: string;
    percent?: number;
    color?: string;
  }>;
  swapSuggestion?: {
    fromApp: string;
    toActivity: string;
    benefit: string;
    durationMinutes: number;
  };
  reductionPlan?: {
    appName: string;
    currentMinutes: number;
    targetMinutes: number;
    steps: Array<{ week: number; target: string; note: string }>;
  };
  goalAction?: {
    packageName?: string;
    appName: string;
    dailyLimitMinutes: number;
  };
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  cards?: StructuredCoachCard[];
  followUpChips?: string[];
  modelUsed?: 'gemini' | 'claude' | 'local';
}

export interface AggregatedUsageSnapshot {
  totalMinutes: number;
  yesterdayTotalMinutes: number;
  dayOnDayDeltaMinutes: number;
  dayOnDayDeltaPct: number;
  dayOnDayDirection: 'up' | 'down' | 'flat';
  weekAverageMinutes: number;
  topApps: Array<{
    packageName: string;
    appName: string;
    minutes: number;
    category: string;
    launches?: number;
    sessions?: number;
    nightMinutes?: number;
    yesterdayMinutes?: number;
  }>;
  yesterdayApps: Array<{
    packageName: string;
    appName: string;
    minutes: number;
  }>;
  categories: Record<string, number>;
  topCategory: string;
  nightMinutes: number;
  totalLaunches: number;
  mostLaunchedApp?: { appName: string; launches: number };
}

const EMPTY_USAGE: AggregatedUsageSnapshot = {
  totalMinutes: 0,
  yesterdayTotalMinutes: 0,
  dayOnDayDeltaMinutes: 0,
  dayOnDayDeltaPct: 0,
  dayOnDayDirection: 'flat',
  weekAverageMinutes: 0,
  topApps: [],
  yesterdayApps: [],
  categories: {},
  topCategory: 'None',
  nightMinutes: 0,
  totalLaunches: 0,
};

const GEMINI_API_KEY_STORAGE = 'hourly_gemini_api_key';

/**
 * Retrieve user-saved Gemini API key (or environment variable fallback)
 */
export async function getStoredGeminiKey(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(GEMINI_API_KEY_STORAGE);
    } catch {
      return null;
    }
  }
  return await SecureStore.getItemAsync(GEMINI_API_KEY_STORAGE);
}

/**
 * Persist user-configured Gemini / OpenAI API key
 */
export async function saveStoredGeminiKey(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (key.trim()) {
        localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
      } else {
        localStorage.removeItem(GEMINI_API_KEY_STORAGE);
      }
    } catch {}
    return;
  }
  if (key.trim()) {
    await SecureStore.setItemAsync(GEMINI_API_KEY_STORAGE, key.trim());
  } else {
    await SecureStore.deleteItemAsync(GEMINI_API_KEY_STORAGE);
  }
}

/**
 * Fetch rich device usage snapshot (today, yesterday, day-on-day, categories, launches)
 */
export async function getCoachUsageSnapshot(): Promise<AggregatedUsageSnapshot> {
  try {
    let todayUsage: AppUsage[] = await usageRepository.getTodayUsage();
    if (!todayUsage || todayUsage.length === 0) {
      await usageRepository.refreshToday();
      todayUsage = await usageRepository.getTodayUsage();
    }
    const yesterdayUsage: AppUsage[] = await usageRepository.getPreviousDayUsage();
    const weekRows = await usageRepository.getWeekUsage();

    let totalForegroundMs = 0;
    let nightMs = 0;
    let totalLaunches = 0;
    const categoryTotals: Record<string, number> = {};

    const yesterdayMap = new Map<string, number>();
    for (const y of yesterdayUsage) {
      yesterdayMap.set(y.packageName, Math.round(y.foregroundMs / 60000));
    }
    const yesterdayTotalMs = yesterdayUsage.reduce((s, a) => s + a.foregroundMs, 0);
    const yesterdayTotalMinutes = Math.round(yesterdayTotalMs / 60000);

    let mostLaunchedApp: { appName: string; launches: number } | undefined;

    const topApps = todayUsage
      .filter((app) => app.foregroundMs > 0)
      .sort((a, b) => b.foregroundMs - a.foregroundMs)
      .slice(0, 15)
      .map((app) => {
        totalForegroundMs += app.foregroundMs;
        nightMs += app.nightMs || 0;
        totalLaunches += app.launches || 0;
        const cat = app.category || 'Other';
        const mins = Math.round(app.foregroundMs / 60000);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + mins;

        if (!mostLaunchedApp || (app.launches && app.launches > mostLaunchedApp.launches)) {
          mostLaunchedApp = { appName: app.appName || app.packageName, launches: app.launches || 0 };
        }

        return {
          packageName: app.packageName,
          appName: app.appName || app.packageName,
          minutes: mins,
          category: cat,
          launches: app.launches,
          sessions: app.sessions,
          nightMinutes: Math.round((app.nightMs || 0) / 60000),
          yesterdayMinutes: yesterdayMap.get(app.packageName),
        };
      });

    const totalMinutes = Math.round(totalForegroundMs / 60000);

    // Day on day calculation
    const deltaMs = totalForegroundMs - yesterdayTotalMs;
    const dayOnDayDeltaMinutes = Math.round(deltaMs / 60000);
    const dayOnDayDeltaPct =
      yesterdayTotalMinutes > 0
        ? Math.round((Math.abs(dayOnDayDeltaMinutes) / yesterdayTotalMinutes) * 100)
        : 0;
    const dayOnDayDirection: 'up' | 'down' | 'flat' =
      dayOnDayDeltaMinutes > 5 ? 'up' : dayOnDayDeltaMinutes < -5 ? 'down' : 'flat';

    // 7-day average
    const weekTotalMs = weekRows.reduce((s, r) => s + r.foregroundMs, 0);
    const weekAverageMinutes = Math.round(weekTotalMs / 60000 / 7);

    // Top Category
    let topCat = 'Other';
    let maxCatMins = 0;
    for (const [c, m] of Object.entries(categoryTotals)) {
      if (m > maxCatMins) {
        maxCatMins = m;
        topCat = c;
      }
    }

    if (totalMinutes === 0 && topApps.length === 0) {
      return EMPTY_USAGE;
    }

    return {
      totalMinutes,
      yesterdayTotalMinutes,
      dayOnDayDeltaMinutes,
      dayOnDayDeltaPct,
      dayOnDayDirection,
      weekAverageMinutes: weekAverageMinutes > 0 ? weekAverageMinutes : totalMinutes,
      topApps,
      yesterdayApps: Array.from(yesterdayMap.entries()).map(([pkg, mins]) => ({
        packageName: pkg,
        appName: pkg,
        minutes: mins,
      })),
      categories: categoryTotals,
      topCategory: topCat,
      nightMinutes: Math.round(nightMs / 60000),
      totalLaunches,
      mostLaunchedApp,
    };
  } catch (err) {
    console.warn('[CoachEngine] Could not load usage, using empty snapshot:', err);
    return EMPTY_USAGE;
  }
}

/**
 * Format minutes into "Xh Ym"
 */
export function formatMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Try generating AI response using Google Gemini Free Tier
 */
async function callGeminiApi(
  query: string,
  usage: AggregatedUsageSnapshot,
  apiKey: string
): Promise<string | null> {
  try {
    const totalTimeStr = formatMins(usage.totalMinutes);
    const yesterdayTimeStr = formatMins(usage.yesterdayTotalMinutes);
    const appsSummary = usage.topApps
      .slice(0, 8)
      .map((a) => `- ${a.appName}: ${formatMins(a.minutes)} (${a.category}, ${a.launches || 0} opens, night: ${a.nightMinutes || 0}m)`)
      .join('\n');

    const categoriesSummary = Object.entries(usage.categories)
      .map(([cat, mins]) => `${cat}: ${formatMins(mins)}`)
      .join(', ');

    const systemPrompt = `You are the digital wellness AI Coach inside the 'Hourly' mobile app.
You have real-time access to the user's phone usage data:
- Today's Total Screen Time: ${totalTimeStr}
- Yesterday's Total Screen Time: ${yesterdayTimeStr}
- Day-on-Day Change: ${usage.dayOnDayDeltaMinutes > 0 ? `+${usage.dayOnDayDeltaMinutes}m` : `${usage.dayOnDayDeltaMinutes}m`} (${usage.dayOnDayDeltaPct}% ${usage.dayOnDayDirection})
- 7-Day Average: ${formatMins(usage.weekAverageMinutes)} / day
- Categories: ${categoriesSummary}
- Top Apps Today:
${appsSummary}
- Night Screen Time (past 9 PM): ${formatMins(usage.nightMinutes)}
- Total App Opens: ${usage.totalLaunches}

Guidelines:
1. Be concise (2-4 sentences max), friendly, non-judgmental, and practical.
2. Directly answer their question using their real phone numbers above.
3. Suggest 1 actionable micro-habit to help reduce screen time or maintain healthy momentum.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!res.ok) {
      console.warn('[Gemini API] Request failed with status:', res.status);
      return null;
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText ? candidateText.trim() : null;
  } catch (e) {
    console.warn('[Gemini API] Error calling Gemini:', e);
    return null;
  }
}

/**
 * Generate intelligent AI coach response based on query and device usage.
 * Uses Gemini free tier when available, with rich data-aware local synthesis as fallback.
 */
export async function generateCoachResponse(
  query: string,
  usageSnapshot?: AggregatedUsageSnapshot
): Promise<{ text: string; cards: StructuredCoachCard[]; followUpChips: string[]; modelUsed: 'gemini' | 'claude' | 'local' }> {
  const usage = usageSnapshot || (await getCoachUsageSnapshot());
  const q = query.toLowerCase().trim();

  const totalTimeStr = formatMins(usage.totalMinutes);
  const yesterdayTimeStr = formatMins(usage.yesterdayTotalMinutes);
  const topApp = usage.topApps[0] || { appName: 'your apps', minutes: usage.totalMinutes, category: 'Other', launches: 0 };
  const secondApp = usage.topApps[1] || { appName: 'other apps', minutes: 0, category: 'Other', launches: 0 };

  // 1. Try Gemini API first if key exists
  const geminiKey = (await getStoredGeminiKey()) || (process.env.EXPO_PUBLIC_GEMINI_API_KEY as string | undefined);
  if (geminiKey && geminiKey.trim() !== '') {
    const geminiText = await callGeminiApi(query, usage, geminiKey.trim());
    if (geminiText) {
      // Build relevant cards to complement Gemini's text
      const cards: StructuredCoachCard[] = [
        {
          type: 'breakdown',
          title: "Today's Top Apps",
          subtitle: `Total: ${totalTimeStr}`,
          items: usage.topApps.slice(0, 3).map((a) => ({
            label: a.appName,
            value: formatMins(a.minutes),
            percent: Math.min(100, Math.round((a.minutes / Math.max(1, usage.totalMinutes)) * 100)),
          })),
        },
      ];

      return {
        text: geminiText,
        cards,
        followUpChips: [
          'Want to reduce this screen time?',
          'What is my day on day progress?',
          `How can I cut 30m from ${topApp.appName}?`,
        ],
        modelUsed: 'gemini',
      };
    }
  }

  // 2. Comprehensive Local Data-Aware Synthesis Engine

  // Check if user specifically asked about day-on-day progress / yesterday
  if (
    q.includes('day on day') ||
    q.includes('day-on-day') ||
    q.includes('yesterday') ||
    q.includes('progress') ||
    q.includes('compared') ||
    q.includes('trend')
  ) {
    const deltaText =
      usage.dayOnDayDirection === 'down'
        ? `${formatMins(Math.abs(usage.dayOnDayDeltaMinutes))} LESS screen time than yesterday (-${usage.dayOnDayDeltaPct}%)`
        : usage.dayOnDayDirection === 'up'
        ? `${formatMins(usage.dayOnDayDeltaMinutes)} MORE screen time than yesterday (+${usage.dayOnDayDeltaPct}%)`
        : `virtually identical to yesterday (~${totalTimeStr})`;

    const headline =
      usage.dayOnDayDirection === 'down'
        ? `Great momentum! Today you've logged ${deltaText}. You are trending toward an intentional, screen-balanced day.`
        : usage.dayOnDayDirection === 'up'
        ? `Your screen time is up by ${deltaText}. ${topApp.appName} accounts for most of today's increase (${formatMins(topApp.minutes)}).`
        : `Your day-on-day pace is steady: today (${totalTimeStr}) is on par with yesterday (${yesterdayTimeStr}).`;

    return {
      text: headline,
      cards: [
        {
          type: 'insight',
          title: 'Day-on-Day Progress',
          subtitle: `Today: ${totalTimeStr} vs Yesterday: ${yesterdayTimeStr}`,
          badge: usage.dayOnDayDirection === 'down' ? 'Trending Down' : 'Pace Alert',
          items: [
            { label: 'Today Total', value: totalTimeStr },
            { label: 'Yesterday Total', value: yesterdayTimeStr },
            {
              label: 'Difference',
              value: `${usage.dayOnDayDirection === 'down' ? '-' : '+'}${formatMins(Math.abs(usage.dayOnDayDeltaMinutes))} (${usage.dayOnDayDeltaPct}%)`,
            },
          ],
        },
        {
          type: 'goalAction',
          title: 'Set Day-on-Day Goal',
          subtitle: `Aim to keep tomorrow's total below ${formatMins(Math.max(60, usage.totalMinutes - 20))}.`,
          goalAction: {
            appName: 'Daily Target',
            dailyLimitMinutes: Math.max(60, usage.totalMinutes - 20),
          },
        },
      ],
      followUpChips: [
        'How can I cut 30m of screen time today?',
        'Which app had the biggest increase?',
        'Suggest swaps for scrolling',
      ],
      modelUsed: 'local',
    };
  }

  // Check if user specifically asked about reducing screen time / saving time
  if (
    q.includes('reduce') ||
    q.includes('cut') ||
    q.includes('save') ||
    q.includes('limit') ||
    q.includes('less') ||
    q.includes('stop') ||
    q.includes('plan')
  ) {
    if (usage.totalMinutes === 0 || !usage.topApps[0] || usage.topApps[0].minutes === 0) {
      return {
        text: "You haven't logged any heavy screen time yet today! As you use your device, I'll detect your highest-focus apps and build gentle 15-minute reduction plans.",
        cards: [
          {
            type: 'insight',
            title: 'Digital Wellness Tip',
            subtitle: 'Start with awareness: pause for a breath before opening high-dopamine apps.',
            badge: 'Habit Anchor',
          },
        ],
        followUpChips: [
          'What is my day on day progress?',
          'Suggest alternatives to scrolling',
          'Where did my time go today?',
        ],
        modelUsed: 'local',
      };
    }

    const currentMins = topApp.minutes > 0 ? topApp.minutes : 75;
    const targetMins = Math.max(20, Math.round(currentMins * 0.65));
    const weeklyReclaimed = Math.round(((currentMins - targetMins) * 7) / 60);

    return {
      text: `Want to reduce this screen time? The highest leverage opportunity is ${topApp.appName}, which took ${formatMins(
        currentMins
      )} today (~${Math.round((currentMins / Math.max(1, usage.totalMinutes)) * 100)}% of your screen time). Trimming just 15–20 minutes daily from ${topApp.appName} reclaims ~${weeklyReclaimed} hours every single week!`,
      cards: [
        {
          type: 'reductionPlan',
          title: `2-Week Gentle Reduction: ${topApp.appName}`,
          subtitle: `Current: ${formatMins(currentMins)} daily → Target: ${formatMins(targetMins)} daily`,
          badge: 'Stepped Plan',
          reductionPlan: {
            appName: topApp.appName,
            currentMinutes: currentMins,
            targetMinutes: targetMins,
            steps: [
              {
                week: 1,
                target: `${formatMins(Math.round(currentMins * 0.85))} / day`,
                note: 'Set a soft reminder and pause after 15-minute scroll sessions.',
              },
              {
                week: 2,
                target: `${formatMins(targetMins)} / day`,
                note: 'Replace bedtime scrolling with 10 mins of audio or light reading.',
              },
            ],
          },
        },
        {
          type: 'goalAction',
          title: `Set ${formatMins(targetMins)} Daily Limit`,
          subtitle: `Gentle nudge when you reach ${formatMins(targetMins)} on ${topApp.appName}.`,
          goalAction: {
            packageName: topApp.packageName,
            appName: topApp.appName,
            dailyLimitMinutes: targetMins,
          },
        },
      ],
      followUpChips: [
        'What is my day on day progress?',
        'Suggest swaps when I get the urge to scroll',
        'Where does my evening time go?',
      ],
      modelUsed: 'local',
    };
  }

  // Check if user asked about a specific app on their phone
  const matchedApp = usage.topApps.find(
    (a) => q.includes(a.appName.toLowerCase()) || q.includes(a.packageName.toLowerCase())
  );
  if (matchedApp) {
    const appPct = Math.round((matchedApp.minutes / Math.max(1, usage.totalMinutes)) * 100);
    const yesterdayMins = matchedApp.yesterdayMinutes;
    const yDelta = typeof yesterdayMins === 'number' ? matchedApp.minutes - yesterdayMins : null;

    let deltaSentence = '';
    if (yDelta !== null) {
      deltaSentence = yDelta > 0
        ? ` That's ${formatMins(yDelta)} more than yesterday.`
        : yDelta < 0
        ? ` That's ${formatMins(Math.abs(yDelta))} less than yesterday.`
        : ' Same as yesterday.';
    }

    return {
      text: `You have spent ${formatMins(matchedApp.minutes)} on ${matchedApp.appName} today (${appPct}% of your total screen time).${deltaSentence}${
        matchedApp.launches ? ` You opened it ${matchedApp.launches} times.` : ''
      }`,
      cards: [
        {
          type: 'insight',
          title: `${matchedApp.appName} Activity Snapshot`,
          subtitle: `Category: ${matchedApp.category}`,
          items: [
            { label: 'Time Today', value: formatMins(matchedApp.minutes) },
            { label: 'Share of Screen Time', value: `${appPct}%` },
            ...(matchedApp.launches ? [{ label: 'App Opens', value: `${matchedApp.launches} times` }] : []),
            ...(matchedApp.nightMinutes ? [{ label: 'Night Usage', value: `${formatMins(matchedApp.nightMinutes)}` }] : []),
          ],
        },
        {
          type: 'goalAction',
          title: `Limit ${matchedApp.appName}`,
          subtitle: `Recommended: ${formatMins(Math.max(15, Math.round(matchedApp.minutes * 0.75)))} daily cap`,
          goalAction: {
            packageName: matchedApp.packageName,
            appName: matchedApp.appName,
            dailyLimitMinutes: Math.max(15, Math.round(matchedApp.minutes * 0.75)),
          },
        },
      ],
      followUpChips: [
        `How can I reduce ${matchedApp.appName} screen time?`,
        'What is my day on day progress?',
        'Where did the rest of my time go?',
      ],
      modelUsed: 'local',
    };
  }

  // Query: Where did time go / breakdown
  if (
    q.includes('where') ||
    q.includes('time go') ||
    q.includes('breakdown') ||
    q.includes('today') ||
    q.includes('spent')
  ) {
    const topAppPct = Math.round((topApp.minutes / Math.max(1, usage.totalMinutes)) * 100);

    return {
      text: `Today you have logged ${totalTimeStr} of active screen time across ${usage.topApps.length} apps. ${topApp.appName} took the largest portion (${formatMins(
        topApp.minutes
      )}, ~${topAppPct}% of your total), followed by ${secondApp.appName} (${formatMins(secondApp.minutes)}).`,
      cards: [
        {
          type: 'breakdown',
          title: "Today's Time Distribution",
          subtitle: `Total Screen Time: ${totalTimeStr}`,
          badge: topAppPct > 40 ? 'Heavy Focus' : 'Balanced',
          items: usage.topApps.slice(0, 4).map((app) => ({
            label: app.appName,
            value: formatMins(app.minutes),
            percent: Math.min(100, Math.round((app.minutes / Math.max(1, usage.totalMinutes)) * 100)),
          })),
        },
        {
          type: 'insight',
          title: 'Prime Opportunity Window',
          subtitle:
            usage.nightMinutes > 30
              ? `You had ${formatMins(usage.nightMinutes)} in evening use past 9 PM. Shifting 20m of this to winding down can give you back deeper sleep.`
              : `Your usage is nicely spaced across daylight hours, with low late-night eye strain.`,
          badge: 'Coach Insight',
        },
      ],
      followUpChips: [
        'Want to reduce this screen time?',
        'What is my day on day progress?',
        `How can I cut 30m from ${topApp.appName}?`,
      ],
      modelUsed: 'local',
    };
  }

  // Default intelligent assistant response
  return {
    text: `Looking at your phone activities today (${totalTimeStr} total across ${usage.topApps.length} apps): your highest category is ${usage.topCategory} (${formatMins(
      usage.categories[usage.topCategory] || topApp.minutes
    )}), led by ${topApp.appName}. Compared to yesterday (${yesterdayTimeStr}), you are ${
      usage.dayOnDayDirection === 'down'
        ? `down by ${formatMins(Math.abs(usage.dayOnDayDeltaMinutes))} (-${usage.dayOnDayDeltaPct}%)`
        : usage.dayOnDayDirection === 'up'
        ? `up by ${formatMins(usage.dayOnDayDeltaMinutes)} (+${usage.dayOnDayDeltaPct}%)`
        : `holding steady`
    }. What would you like to explore next?`,
    cards: [
      {
        type: 'breakdown',
        title: 'Quick Activity Snapshot',
        subtitle: `Total Screen Time: ${totalTimeStr}`,
        items: usage.topApps.slice(0, 3).map((a) => ({
          label: a.appName,
          value: formatMins(a.minutes),
        })),
      },
      {
        type: 'insight',
        title: 'Day-on-Day Summary',
        subtitle: `Pace: ${usage.dayOnDayDirection === 'down' ? 'Recovering time' : 'Higher usage than yesterday'}`,
        badge: 'Habit Anchor',
      },
    ],
    followUpChips: [
      'Want to reduce this screen time?',
      'What is my day on day progress?',
      `Suggest swaps for ${topApp.appName}`,
    ],
    modelUsed: 'local',
  };
}
