/**
 * Usage Data Aggregation Utilities
 * Spec Reference: Section 9.4 (Screens 3-4)
 *
 * Pure utility functions for transforming raw usage data into
 * dashboard-ready aggregates. No side effects, no state.
 */

import { AppUsage } from '../../../modules/usage-stats';
import { getAppColor } from '../../theme/tokens';

// ─── Types ───────────────────────────────────────────────────

export interface CategoryAggregate {
  category: string;
  totalMs: number;
  appCount: number;
  color: string;
}

export interface DailyAggregate {
  date: string; // YYYY-MM-DD
  totalMs: number;
  appCount: number;
}

export interface HourlyAggregate {
  hour: number; // 0-23
  totalMs: number;
}

export interface Delta {
  deltaMs: number;
  deltaPct: number;
  direction: 'up' | 'down' | 'flat';
}

export interface TopApp {
  packageName: string;
  appName: string;
  category: string;
  foregroundMs: number;
  launches: number;
  sessions: number;
  nightMs: number;
  percentage: number;
  color: string;
}

export interface DateUsageRow extends AppUsage {
  date: string;
}

// ─── Category Colors ─────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Social: '#E1306C',
  Video: '#FF0000',
  Games: '#10B981',
  Productivity: '#3B82F6',
  Communication: '#25D366',
  Music: '#1DB954',
  Other: '#64748B',
  Entertainment: '#8B5CF6',
  News: '#F59E0B',
  Shopping: '#FF9900',
  Education: '#06B6D4',
  Health: '#EC4899',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#64748B';
}

// ─── Aggregation Functions ───────────────────────────────────

/**
 * Group usage data by category with totals
 */
export function aggregateByCategory(usage: AppUsage[]): CategoryAggregate[] {
  const map = new Map<string, { totalMs: number; appCount: number }>();

  for (const app of usage) {
    const existing = map.get(app.category);
    if (existing) {
      existing.totalMs += app.foregroundMs;
      existing.appCount += 1;
    } else {
      map.set(app.category, { totalMs: app.foregroundMs, appCount: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      totalMs: data.totalMs,
      appCount: data.appCount,
      color: getCategoryColor(category),
    }))
    .sort((a, b) => b.totalMs - a.totalMs);
}

/**
 * Group usage rows (with dates) into daily totals
 */
export function aggregateByDay(rows: DateUsageRow[]): DailyAggregate[] {
  const map = new Map<string, { totalMs: number; apps: Set<string> }>();

  for (const row of rows) {
    const existing = map.get(row.date);
    if (existing) {
      existing.totalMs += row.foregroundMs;
      existing.apps.add(row.packageName);
    } else {
      map.set(row.date, {
        totalMs: row.foregroundMs,
        apps: new Set([row.packageName]),
      });
    }
  }

  return Array.from(map.entries())
    .map(([date, data]) => ({
      date,
      totalMs: data.totalMs,
      appCount: data.apps.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compute delta between current and previous period totals
 */
export function computeDeltas(currentMs: number, previousMs: number): Delta {
  if (previousMs === 0 && currentMs === 0) {
    return { deltaMs: 0, deltaPct: 0, direction: 'flat' };
  }
  if (previousMs === 0) {
    return { deltaMs: currentMs, deltaPct: 100, direction: 'up' };
  }

  const deltaMs = currentMs - previousMs;
  const deltaPct = Math.round((deltaMs / previousMs) * 100);

  return {
    deltaMs,
    deltaPct,
    direction: deltaMs > 0 ? 'up' : deltaMs < 0 ? 'down' : 'flat',
  };
}

/**
 * Get top N apps by foreground time
 */
export function getTopApps(usage: AppUsage[], count: number = 3): TopApp[] {
  const totalMs = usage.reduce((sum, app) => sum + app.foregroundMs, 0);
  if (totalMs === 0) return [];

  return [...usage]
    .sort((a, b) => b.foregroundMs - a.foregroundMs)
    .slice(0, count)
    .map((app) => ({
      ...app,
      percentage: Math.round((app.foregroundMs / totalMs) * 100),
      color: getAppColor(app.packageName),
    }));
}

// ─── Formatting ──────────────────────────────────────────────

/**
 * Format milliseconds to human-readable time string
 * e.g. 7920000 → '2h 12m', 2700000 → '45m', 45000 → '<1m'
 */
export function formatMs(ms: number): string {
  if (ms < 60000) return '<1m';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Format milliseconds to just minutes (for charts)
 */
export function formatMsToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}

/**
 * Format a delta percentage with sign and arrow
 * e.g. +12% ↑, -8% ↓, 0%
 */
export function formatDelta(delta: Delta): string {
  if (delta.direction === 'flat') return '0%';
  const sign = delta.direction === 'up' ? '+' : '';
  const arrow = delta.direction === 'up' ? '↑' : '↓';
  return `${sign}${delta.deltaPct}% ${arrow}`;
}

/**
 * Format delta in human-readable time
 * e.g. "32m less", "1h 10m more"
 */
export function formatDeltaTime(delta: Delta): string {
  if (delta.direction === 'flat') return 'Same as before';
  const absMs = Math.abs(delta.deltaMs);
  const timeStr = formatMs(absMs);
  return delta.direction === 'down' ? `${timeStr} less` : `${timeStr} more`;
}

// ─── Greeting ────────────────────────────────────────────────

/**
 * Get a time-of-day appropriate greeting
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

// ─── Date Helpers ────────────────────────────────────────────

/**
 * Get start of a day as Date
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get date string in YYYY-MM-DD format
 */
export function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get an array of date strings for the last N days (including today)
 */
export function getLastNDays(n: number, from: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    dates.push(toDateStr(d));
  }
  return dates;
}

/**
 * Get short day label from date string (e.g. "Mon", "Tue")
 */
export function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Get short date label (e.g. "Oct 5")
 */
export function getShortDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format hour to display label (e.g. 0 → "12a", 13 → "1p")
 */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}
