import { Hono } from 'hono';
import { prisma } from '../db.js';
import { Plan } from '@prisma/client';

export const coachRouter = new Hono<{ Variables: { user?: any } }>();

const DEFAULT_FREE_SUGGESTIONS = 10;
const AD_REWARD_SUGGESTIONS = 3;

// In-memory fallback quota store if database is offline during development
const memoryQuotaStore = new Map<string, { remaining: number; totalUsed: number; isPremium: boolean }>();

function getUserQuota(userId: string) {
  if (!memoryQuotaStore.has(userId)) {
    memoryQuotaStore.set(userId, {
      remaining: DEFAULT_FREE_SUGGESTIONS,
      totalUsed: 0,
      isPremium: false,
    });
  }
  return memoryQuotaStore.get(userId)!;
}

// GET /v1/coach/quota
coachRouter.get('/quota', async (c) => {
  const userId = 'dev_user_1';
  const quota = getUserQuota(userId);
  return c.json({
    remaining: quota.isPremium ? Infinity : quota.remaining,
    totalUsed: quota.totalUsed,
    isPremium: quota.isPremium,
  });
});

// POST /v1/coach/ad-reward
coachRouter.post('/ad-reward', async (c) => {
  const userId = 'dev_user_1';
  const quota = getUserQuota(userId);
  quota.remaining += AD_REWARD_SUGGESTIONS;

  return c.json({
    success: true,
    message: '+3 AI suggestions unlocked!',
    remaining: quota.remaining,
  });
});

// POST /v1/coach/upgrade
coachRouter.post('/upgrade', async (c) => {
  const userId = 'dev_user_1';
  const quota = getUserQuota(userId);
  quota.isPremium = true;
  quota.remaining = 999999;

  return c.json({
    success: true,
    message: 'Upgraded to Hourly Pro!',
    isPremium: true,
    remaining: Infinity,
  });
});

// POST /v1/coach/chat
coachRouter.post('/chat', async (c) => {
  const userId = 'dev_user_1';
  const body = await c.req.json().catch(() => ({}));
  const message = body.message || 'Where did my time go?';
  const context = body.context;

  const quota = getUserQuota(userId);
  if (!quota.isPremium && quota.remaining <= 0) {
    return c.json(
      {
        error: 'QUOTA_EXHAUSTED',
        message: 'You have used all 10 free AI suggestions. Watch a 30s ad for +3 or upgrade to Pro.',
        remaining: 0,
      },
      403
    );
  }

  if (!quota.isPremium) {
    quota.remaining = Math.max(0, quota.remaining - 1);
    quota.totalUsed += 1;
  }

  const topAppName = context?.topApps?.[0]?.appName || 'Entertainment';
  const totalMins = context?.totalMinutes || 180;

  return c.json({
    text: `Based on your recent phone activity (${Math.floor(totalMins / 60)}h ${totalMins % 60}m logged), ${topAppName} accounted for the highest share of engagement. Taking small 10-minute pauses before bedtime is the easiest way to regain calm focus.`,
    cards: [
      {
        type: 'insight',
        title: 'Coach Focus Insight',
        subtitle: `You spend significant focus on ${topAppName}. Replacing late-night scroll loops with audio or light reading can save up to 4 hours weekly.`,
        badge: 'Habit Anchor',
      },
    ],
    followUpChips: [
      'Where did my time go today?',
      `How can I cut 30m of ${topAppName}?`,
      'Suggest swaps for mindless scrolling',
    ],
    remaining: quota.isPremium ? Infinity : quota.remaining,
  });
});
