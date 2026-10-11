import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { fetchApi } from '../../lib/api';
import { getSessionToken } from '../../lib/auth';
import { usageRepository } from '../usage/UsageRepository';
import { SyncUsagePayload } from 'shared/src/schemas';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_USAGE_SYNC';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const token = await getSessionToken();
    if (!token) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Determine the date range to sync (e.g., last 3 days to catch late-night carryovers)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 3);
    
    // Fetch from SQLite using the initialized repository instance
    const rows = await usageRepository.getUsageForRange(start, end);
    
    if (rows.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Group by date
    const grouped: Record<string, any[]> = {};
    for (const row of rows) {
      const d = row.date.split('T')[0];
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push({
        packageName: row.packageName,
        appName: row.appName,
        category: row.category,
        foregroundMs: row.foregroundMs,
        launches: row.launches,
        sessions: row.sessions,
        nightMs: row.nightMs,
        longestSessionMs: (row as any).longestSessionMs ?? 0,
      });
    }

    const payloads: SyncUsagePayload[] = Object.keys(grouped).map(date => ({
      date,
      usage: grouped[date]
    }));

    // Send to backend (idempotent upsert)
    for (const payload of payloads) {
      await fetchApi('/usage/sync', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background sync failed", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log("Background sync registered");
  } catch (err) {
    console.error("Task register failed:", err);
  }
}
