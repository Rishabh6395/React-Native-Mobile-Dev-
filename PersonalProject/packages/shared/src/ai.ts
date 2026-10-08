import { z } from 'zod';

export const BreakdownSectionSchema = z.object({
  kind: z.literal('breakdown'),
  items: z.array(z.object({
    app: z.string(),
    minutes: z.number(),
    note: z.string().optional()
  }))
});

export const InsightSectionSchema = z.object({
  kind: z.literal('insight'),
  title: z.string(),
  body: z.string(),
  severity: z.enum(['info', 'nudge', 'alert'])
});

export const PatternSectionSchema = z.object({
  kind: z.literal('pattern'),
  title: z.string(),
  body: z.string()
});

export const WinSectionSchema = z.object({
  kind: z.literal('win'),
  title: z.string(),
  body: z.string()
});

export const ReportSectionSchema = z.discriminatedUnion('kind', [
  BreakdownSectionSchema,
  InsightSectionSchema,
  PatternSectionSchema,
  WinSectionSchema
]);

export const ReportActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  why: z.string(),
  effort: z.enum(['tiny', 'small', 'medium']),
  goal: z.object({
    packageName: z.string().optional(),
    dailyLimitMinutes: z.number()
  }).optional()
});

export const ReportPayloadSchema = z.object({
  headline: z.string().describe('A friendly, concise one-line summary of the report'),
  totalMinutes: z.number(),
  deltaPct: z.number().describe('Percentage change compared to previous period'),
  scoreLabel: z.enum(['light', 'balanced', 'heavy']),
  sections: z.array(ReportSectionSchema),
  actions: z.array(ReportActionSchema),
  followUpPrompts: z.array(z.string()).describe('Suggested short chat prompts for the user to tap')
});

export type ReportPayload = z.infer<typeof ReportPayloadSchema>;
export type ReportSection = z.infer<typeof ReportSectionSchema>;
export type ReportAction = z.infer<typeof ReportActionSchema>;

// Context provided to the model
export const UsageContextSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']),
  periodStart: z.string(),
  periodEnd: z.string(),
  totalMinutes: z.number(),
  previousPeriodTotalMinutes: z.number().optional(),
  topApps: z.array(z.object({
    packageName: z.string(),
    appName: z.string(),
    category: z.string(),
    minutes: z.number(),
  })),
  categorySplit: z.record(z.string(), z.number()), // Category name -> minutes
  nightTimeMinutes: z.number(),
  longestSessionMinutes: z.number(),
  activeGoals: z.array(z.object({
    packageName: z.string().nullable(),
    dailyLimitMinutes: z.number()
  })),
  recentContentLog: z.array(z.object({
    title: z.string(),
    sourceApp: z.string(),
    kind: z.string()
  })).optional()
});

export type UsageContext = z.infer<typeof UsageContextSchema>;
