import { z } from 'zod';

export const SyncUsageSchema = z.object({
  date: z.string(),
  usage: z.array(z.object({
    packageName: z.string(),
    appName: z.string(),
    category: z.string(),
    foregroundMs: z.number(),
    launches: z.number(),
    sessions: z.number(),
    nightMs: z.number(),
    longestSessionMs: z.number()
  }))
});

export type SyncUsagePayload = z.infer<typeof SyncUsageSchema>;
