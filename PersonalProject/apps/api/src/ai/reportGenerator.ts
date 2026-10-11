import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { ReportPayload, ReportPayloadSchema, UsageContext } from 'shared';

export interface GeneratedReportResult {
  payload: ReportPayload;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Generates an AI screen time report based on pre-aggregated UsageContext.
 * Retries up to 2 times on failure and adheres to strict Zod validation.
 */
export async function generateReport(
  context: UsageContext,
  maxRetries = 2
): Promise<GeneratedReportResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no Anthropic API key is provided, use structured algorithmic synthesis (for dev/fixtures)
  if (!apiKey || apiKey.includes('dummy') || apiKey.trim() === '') {
    return synthesizeReportFromContext(context);
  }

  const model = anthropic('claude-3-haiku-20240307');

  const systemPrompt = `You are the AI Screen-Time Coach for the 'Hourly' app.
Your tone is warm, non-judgmental, specific, and short.
CRITICAL TONE RULES:
- Never use negative words like 'wasted', 'addicted', 'guilty', or 'bad'.
- Say 'where your time went' and focus on intentionality and awareness.
- Keep headlines concise, positive, and insightful.
- Suggest 2 to 3 actionable, low-effort changes.
- Return structured JSON strictly adhering to the schema.`;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { object, usage } = await generateObject({
        model,
        schema: ReportPayloadSchema,
        system: systemPrompt,
        prompt: `Generate a ${context.period} screen-time report based on this pre-aggregated context:\n${JSON.stringify(context, null, 2)}`,
        temperature: 0.3,
      });

      // Explicit Zod validation check
      const validated = ReportPayloadSchema.parse(object);

      return {
        payload: validated,
        usage: {
          inputTokens: (usage as any).inputTokens ?? (usage as any).promptTokens ?? 450,
          outputTokens: (usage as any).outputTokens ?? (usage as any).completionTokens ?? 320,
        },
      };
    } catch (err) {
      lastError = err;
      console.warn(`[reportGenerator] Attempt ${attempt + 1} failed:`, err);
    }
  }

  console.error('[reportGenerator] All Anthropic attempts failed. Falling back to rule-based synthesis.');
  return synthesizeReportFromContext(context);
}

/**
 * Deterministic, high-fidelity report synthesizer for offline testing,
 * fixture validation, and fallback when LLM API is unavailable.
 */
export function synthesizeReportFromContext(context: UsageContext): GeneratedReportResult {
  const totalMinutes = context.totalMinutes;
  const prevMinutes = context.previousPeriodTotalMinutes ?? totalMinutes;
  const deltaPct = prevMinutes > 0 
    ? Math.round(((totalMinutes - prevMinutes) / prevMinutes) * 100) 
    : 0;

  const scoreLabel: 'light' | 'balanced' | 'heavy' = 
    totalMinutes < 120 ? 'light' : totalMinutes <= 300 ? 'balanced' : 'heavy';

  const topApp = context.topApps[0];
  const secondApp = context.topApps[1];

  let headline = `Your ${context.period} overview: balanced time across essential apps.`;
  if (scoreLabel === 'light') {
    headline = `A mindful ${context.period}: plenty of screen-free time reclaimed.`;
  } else if (scoreLabel === 'heavy') {
    headline = `${topApp?.appName || 'Entertainment'} took the lead this ${context.period} (${Math.round((topApp?.minutes || 0) / 60)}h ${Math.round((topApp?.minutes || 0) % 60)}m).`;
  }

  const sections: ReportPayload['sections'] = [
    {
      kind: 'breakdown',
      items: context.topApps.slice(0, 5).map((app) => ({
        app: app.appName,
        minutes: app.minutes,
        note: app.category === 'Social' || app.category === 'Video' ? 'High engagement' : undefined,
      })),
    },
    {
      kind: 'insight',
      title: `${topApp ? topApp.appName : 'Screen time'} focus`,
      body: topApp 
        ? `${topApp.appName} accounted for ${Math.round((topApp.minutes / (totalMinutes || 1)) * 100)}% of your phone time. Consider moving it to your second home-screen.`
        : 'Your app usage was evenly distributed across productivity and communication.',
      severity: scoreLabel === 'heavy' ? 'nudge' : 'info',
    },
  ];

  if (context.nightTimeMinutes && context.nightTimeMinutes > 30) {
    sections.push({
      kind: 'pattern',
      title: 'Late-night winding down',
      body: `You spent ${context.nightTimeMinutes}m after 10 PM on your phone. Dimming screen brightness or setting a 10:30 PM wind-down chime can help sleep quality.`,
    });
  }

  if (deltaPct < 0) {
    sections.push({
      kind: 'win',
      title: `${Math.abs(deltaPct)}% reduction vs last ${context.period}`,
      body: `You spent ${Math.round(Math.abs(totalMinutes - prevMinutes) / 60)} hours less on your device compared to the previous period!`,
    });
  } else {
    sections.push({
      kind: 'win',
      title: 'Consistent daily awareness',
      body: `Tracking where your hours go is the foundational step toward intentional device use.`,
    });
  }

  const actions: ReportPayload['actions'] = [];
  if (topApp && (topApp.category === 'Social' || topApp.category === 'Video')) {
    actions.push({
      id: `action-${topApp.packageName}`,
      title: `Cap ${topApp.appName} at ${Math.max(30, Math.round(topApp.minutes * 0.8))}m`,
      why: 'Shaving 20% off your top entertainment app gives you ~30 free minutes every day.',
      effort: 'small',
      goal: {
        packageName: topApp.packageName,
        dailyLimitMinutes: Math.max(30, Math.round(topApp.minutes * 0.8)),
      },
    });
  }

  actions.push({
    id: 'action-night-shift',
    title: 'Enable Bedtime grayscale 30m before sleep',
    why: 'Grayscale significantly reduces the dopamine loop of feed scrolling.',
    effort: 'tiny',
  });

  const followUpPrompts = [
    `How can I reduce my ${topApp?.appName || 'social'} time without feeling restricted?`,
    'Suggest productive podcast or reading alternatives',
    'Help me create a gradual 3-week reduction plan',
  ];

  const payload: ReportPayload = {
    headline,
    totalMinutes,
    deltaPct,
    scoreLabel,
    sections,
    actions,
    followUpPrompts,
  };

  return {
    payload: ReportPayloadSchema.parse(payload),
    usage: {
      inputTokens: 420,
      outputTokens: 310,
    },
  };
}
