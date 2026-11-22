import * as SQLite from 'expo-sqlite';
import { 
  hasUsageAccess, 
  getDailyUsage, 
  getHourlyUsage,
  AppUsage,
  HourBucket,
} from '../../../modules/usage-stats';
import { DateUsageRow, toDateStr, startOfDay } from './usageAggregation';

const DB_NAME = 'usage_cache.db';

export class UsageRepository {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private isBackfilling = false;

  private runSerializedWrite<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.writeQueue.then(fn, fn);
    this.writeQueue = next.then(
      () => {},
      () => {}
    );
    return next;
  }

  async init(): Promise<SQLite.SQLiteDatabase> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const db = await SQLite.openDatabaseAsync(DB_NAME);
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS daily_usage (
            date TEXT NOT NULL,
            packageName TEXT NOT NULL,
            appName TEXT,
            category TEXT,
            foregroundMs INTEGER NOT NULL,
            launches INTEGER NOT NULL,
            sessions INTEGER NOT NULL,
            nightMs INTEGER NOT NULL,
            longestSessionMs INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (date, packageName)
          );
        `);

        // Migration: add longestSessionMs if missing (from Phase 1 schema)
        try {
          const columns = await db.getAllAsync<{ name: string }>(
            `PRAGMA table_info(daily_usage);`
          );
          const hasColumn = columns.some((c) => c.name === 'longestSessionMs');
          if (!hasColumn) {
            await db.execAsync(
              `ALTER TABLE daily_usage ADD COLUMN longestSessionMs INTEGER NOT NULL DEFAULT 0;`
            );
          }
        } catch {
          // Column already exists or schema intact — safe to ignore
        }

        this.db = db;
        return db;
      })();
    }
    return this.initPromise;
  }

  private async ensureDb() {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // ─── Refresh / Fetch ────────────────────────────────────────

  /**
   * Refresh today's usage data from the native module into SQLite
   */
  async refreshToday() {
    if (!hasUsageAccess()) return;

    const now = new Date();
    const dayStart = startOfDay(now).getTime();
    const dayEnd = now.getTime();

    await this.cacheUsageForRange(dayStart, dayEnd, toDateStr(now));
  }

  /**
   * Refreshes today and yesterday to ensure day-on-day data is fully accurate
   */
  async refreshAllRecent() {
    await this.refreshToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await this.refreshDate(yesterday);
  }

  /**
   * Refresh a specific date's usage data
   */
  async refreshDate(date: Date) {
    if (!hasUsageAccess()) return;

    const dayStart = startOfDay(date).getTime();
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayEnd = startOfDay(nextDay).getTime();

    await this.cacheUsageForRange(dayStart, dayEnd, toDateStr(date));
  }

  /**
   * Backfill as many past days as Android allows (~7-14 days).
   * Called to populate history for week/month views.
   */
  async backfillAvailableHistory() {
    if (!hasUsageAccess() || this.isBackfilling) return;
    this.isBackfilling = true;

    try {
      const today = new Date();
      // Android typically keeps 7-14 days of usage events
      const maxDays = 14;

      for (let i = 1; i <= maxDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = toDateStr(date);

        // Only backfill if we don't already have data for that date
        const db = await this.ensureDb();
        const existing = await db.getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM daily_usage WHERE date = ?`,
          [dateStr]
        );
        if (existing && existing.cnt > 0) continue;

        await this.refreshDate(date);
      }
    } catch (e) {
      console.warn('Backfill history error:', e);
    } finally {
      this.isBackfilling = false;
    }
  }

  /**
   * Internal: fetch usage from native module and cache in SQLite
   */
  private async cacheUsageForRange(startMs: number, endMs: number, dateStr: string) {
    const usage = getDailyUsage(startMs, endMs);
    if (!usage || usage.length === 0) return;
    const db = await this.ensureDb();

    await this.runSerializedWrite(async () => {
      await db.withTransactionAsync(async () => {
        // Clean out stale records for this specific date before inserting fresh batch
        await db.runAsync(`DELETE FROM daily_usage WHERE date = ?`, [dateStr]);
        for (const app of usage) {
          await db.runAsync(
            `INSERT OR REPLACE INTO daily_usage 
            (date, packageName, appName, category, foregroundMs, launches, sessions, nightMs, longestSessionMs) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              dateStr, 
              app.packageName, 
              app.appName ?? app.packageName, 
              app.category ?? 'Other', 
              app.foregroundMs ?? 0, 
              app.launches ?? 0, 
              app.sessions ?? 0, 
              app.nightMs ?? 0,
              0, // longestSessionMs — placeholder until we compute from sessions
            ]
          );
        }
      });
    });
  }

  // ─── Queries ────────────────────────────────────────────────

  /**
   * Get today's usage, sorted by foregroundMs descending
   */
  async getTodayUsage(): Promise<AppUsage[]> {
    const db = await this.ensureDb();
    const dateStr = toDateStr(new Date());
    return await db.getAllAsync<AppUsage>(
      `SELECT packageName, appName, category, foregroundMs, launches, sessions, nightMs 
       FROM daily_usage WHERE date = ? ORDER BY foregroundMs DESC`,
      [dateStr]
    );
  }

  /**
   * Get usage for a specific date
   */
  async getUsageForDate(date: Date): Promise<AppUsage[]> {
    const db = await this.ensureDb();
    const dateStr = toDateStr(date);
    return await db.getAllAsync<AppUsage>(
      `SELECT packageName, appName, category, foregroundMs, launches, sessions, nightMs 
       FROM daily_usage WHERE date = ? ORDER BY foregroundMs DESC`,
      [dateStr]
    );
  }

  /**
   * Get usage for a date range (returns rows with date field)
   */
  async getUsageForRange(startDate: Date, endDate: Date): Promise<DateUsageRow[]> {
    const db = await this.ensureDb();
    const startStr = toDateStr(startDate);
    const endStr = toDateStr(endDate);
    return await db.getAllAsync<DateUsageRow>(
      `SELECT date, packageName, appName, category, foregroundMs, launches, sessions, nightMs 
       FROM daily_usage 
       WHERE date >= ? AND date <= ? 
       ORDER BY date ASC, foregroundMs DESC`,
      [startStr, endStr]
    );
  }

  /**
   * Get this week's usage (Mon–Sun or last 7 days)
   */
  async getWeekUsage(): Promise<DateUsageRow[]> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6); // Last 7 days including today
    return this.getUsageForRange(weekStart, today);
  }

  /**
   * Get this month's usage (last 30 days)
   */
  async getMonthUsage(): Promise<DateUsageRow[]> {
    const today = new Date();
    const monthStart = new Date(today);
    monthStart.setDate(monthStart.getDate() - 29); // Last 30 days including today
    return this.getUsageForRange(monthStart, today);
  }

  /**
   * Get previous period usage for delta comparison
   */
  async getPreviousDayUsage(): Promise<AppUsage[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.getUsageForDate(yesterday);
  }

  async getPreviousWeekUsage(): Promise<DateUsageRow[]> {
    const today = new Date();
    const prevWeekEnd = new Date(today);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
    const prevWeekStart = new Date(prevWeekEnd);
    prevWeekStart.setDate(prevWeekStart.getDate() - 6);
    return this.getUsageForRange(prevWeekStart, prevWeekEnd);
  }

  async getPreviousMonthUsage(): Promise<DateUsageRow[]> {
    const today = new Date();
    const prevMonthEnd = new Date(today);
    prevMonthEnd.setDate(prevMonthEnd.getDate() - 30);
    const prevMonthStart = new Date(prevMonthEnd);
    prevMonthStart.setDate(prevMonthStart.getDate() - 29);
    return this.getUsageForRange(prevMonthStart, prevMonthEnd);
  }

  /**
   * Get usage for a specific app across a date range
   */
  async getAppUsageHistory(
    packageName: string,
    days: number = 7
  ): Promise<DateUsageRow[]> {
    const db = await this.ensureDb();
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    const startStr = toDateStr(start);
    const endStr = toDateStr(today);

    return await db.getAllAsync<DateUsageRow>(
      `SELECT date, packageName, appName, category, foregroundMs, launches, sessions, nightMs 
       FROM daily_usage 
       WHERE packageName = ? AND date >= ? AND date <= ?
       ORDER BY date ASC`,
      [packageName, startStr, endStr]
    );
  }

  /**
   * Get hourly usage buckets for today (from native module, not cached)
   */
  getHourlyUsageToday(): HourBucket[] {
    if (!hasUsageAccess()) return [];
    const dayStart = startOfDay(new Date()).getTime();
    return getHourlyUsage(dayStart);
  }

  /**
   * Get total foreground time for a specific date
   */
  async getDayTotal(date: Date): Promise<number> {
    const db = await this.ensureDb();
    const dateStr = toDateStr(date);
    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(foregroundMs), 0) as total FROM daily_usage WHERE date = ?`,
      [dateStr]
    );
    return result?.total ?? 0;
  }
}

export const usageRepository = new UsageRepository();
