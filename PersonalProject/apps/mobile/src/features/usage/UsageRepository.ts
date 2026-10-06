import * as SQLite from 'expo-sqlite';
import { 
  hasUsageAccess, 
  openUsageAccessSettings, 
  getDailyUsage, 
  AppUsage 
} from '../../../modules/usage-stats';

const DB_NAME = 'usage_cache.db';

export class UsageRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_usage (
        date TEXT NOT NULL,
        packageName TEXT NOT NULL,
        appName TEXT,
        category TEXT,
        foregroundMs INTEGER NOT NULL,
        launches INTEGER NOT NULL,
        sessions INTEGER NOT NULL,
        nightMs INTEGER NOT NULL,
        PRIMARY KEY (date, packageName)
      );
    `);
  }

  async refreshToday() {
    if (!hasUsageAccess()) {
      return;
    }
    
    // Get start of today in MS
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = now.getTime();
    
    const usage = getDailyUsage(startOfToday, endOfToday);
    const dateStr = now.toISOString().split('T')[0];

    if (!this.db) await this.init();

    await this.db!.withTransactionAsync(async () => {
      for (const app of usage) {
        await this.db!.runAsync(
          `INSERT OR REPLACE INTO daily_usage 
          (date, packageName, appName, category, foregroundMs, launches, sessions, nightMs) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dateStr, 
            app.packageName, 
            app.appName, 
            app.category, 
            app.foregroundMs, 
            app.launches, 
            app.sessions, 
            app.nightMs
          ]
        );
      }
    });
  }

  async getTodayUsage(): Promise<AppUsage[]> {
    if (!this.db) await this.init();
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    return await this.db!.getAllAsync<AppUsage>(
      `SELECT * FROM daily_usage WHERE date = ? ORDER BY foregroundMs DESC`,
      [dateStr]
    );
  }
}

export const usageRepository = new UsageRepository();
