import { Hono } from 'hono';
import { generateReport } from '../ai/reportGenerator.js';
import { PrismaClient, ReportType } from '@prisma/client';
import { z } from 'zod';
import { UsageContext } from 'shared';

const prisma = new PrismaClient(); // Note: in real app, inject this or get from context

export const reportsRouter = new Hono<{ Variables: { user: any } }>();

// GET /reports?type=&periodStart=
reportsRouter.get('/', async (c) => {
  const type = c.req.query('type') as ReportType;
  const periodStart = c.req.query('periodStart');
  const user = c.get('user');

  if (!type || !periodStart) {
    return c.json({ error: 'Missing type or periodStart' }, 400);
  }

  const report = await prisma.aiReport.findUnique({
    where: {
      userId_type_periodStart: {
        userId: user.id,
        type,
        periodStart: new Date(periodStart)
      }
    }
  });

  return c.json(report ? [report] : []);
});

// POST /reports/generate
const generateSchema = z.object({
  type: z.nativeEnum(ReportType),
  periodStart: z.string(),
  periodEnd: z.string(),
});

reportsRouter.post('/generate', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = generateSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400);
  }

  const { type, periodStart, periodEnd } = parsed.data;

  // In a real app, query DailyAppUsage to build the context
  // Here we mock the context for Phase 5 DoD
  const mockContext: UsageContext = {
    period: type === ReportType.DAILY ? 'daily' : type === ReportType.WEEKLY ? 'weekly' : 'monthly',
    periodStart,
    periodEnd,
    totalMinutes: 245,
    previousPeriodTotalMinutes: 210,
    topApps: [
      { packageName: 'com.instagram.android', appName: 'Instagram', category: 'Social', minutes: 120 },
      { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Video', minutes: 90 },
    ],
    categorySplit: { Social: 120, Video: 90, Other: 35 },
    nightTimeMinutes: 45,
    longestSessionMinutes: 60,
    activeGoals: []
  };

  try {
    const { payload, usage } = await generateReport(mockContext);

    // Save to DB
    const report = await prisma.aiReport.upsert({
      where: {
        userId_type_periodStart: {
          userId: user.id,
          type,
          periodStart: new Date(periodStart)
        }
      },
      update: {
        payload: payload as any,
        model: 'claude-3-haiku',
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
      },
      create: {
        userId: user.id,
        type,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        payload: payload as any,
        model: 'claude-3-haiku',
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
      }
    });

    return c.json({ success: true, report });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});
