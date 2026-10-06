import { requireNativeModule } from 'expo-modules-core';

export interface AppUsage {
  packageName: string;
  appName: string;
  category: string;
  foregroundMs: number;
  launches: number;
  sessions: number;
  nightMs: number;
}

export interface HourBucket {
  hour: number;
  foregroundMs: number;
}

export interface SessionData {
  packageName: string;
  startMs: number;
  endMs: number;
}

export interface AppInfo {
  packageName: string;
  label: string;
  category: string;
  iconBase64: string | null;
}

const UsageStats = requireNativeModule('UsageStats');

export function hasUsageAccess(): boolean {
  return UsageStats.hasUsageAccess();
}

export function openUsageAccessSettings(): void {
  UsageStats.openUsageAccessSettings();
}

export function getDailyUsage(startMs: number, endMs: number): AppUsage[] {
  return UsageStats.getDailyUsage(startMs, endMs);
}

export function getHourlyUsage(dayStartMs: number): HourBucket[] {
  return UsageStats.getHourlyUsage(dayStartMs);
}

export function getRecentSessions(dayStartMs: number): SessionData[] {
  return UsageStats.getRecentSessions(dayStartMs);
}

export function getInstalledApps(): AppInfo[] {
  return UsageStats.getInstalledApps();
}
