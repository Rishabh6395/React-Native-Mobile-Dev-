/**
 * Stats Screen — Day/Week/Month usage dashboards (Glassmorphism redesign)
 *
 * Line charts with glow, horizontal category bars, glass app cards.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import { router } from 'expo-router';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
} from 'lucide-react-native';
import { AppUsage } from '../../modules/usage-stats';
import { usageRepository } from '../../src/features/usage/UsageRepository';
import {
  formatMs,
  aggregateByCategory,
  aggregateByDay,
  computeDeltas,
  formatDelta,
  getTopApps,
  getLastNDays,
  getDayLabel,
  getShortDateLabel,
  formatHourLabel,
  DateUsageRow,
  CategoryAggregate,
  Delta,
  TopApp,
} from '../../src/features/usage/usageAggregation';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  Screen,
  Header,
  Card,
  SegmentedControl,
  AppIcon,
  Skeleton,
  EmptyState,
  Pressable3D,
  AiSuggestionCard,
} from '../../src/components/ui';
import {
  ActivityLineChart,
  LineDataPoint,
  CategoryBars,
  UsageBar,
} from '../../src/components/charts';
import { layout, spacing, typography, getAppColor } from '../../src/theme/tokens';

type TimeRange = 'day' | 'week' | 'month';

const RANGE_OPTIONS = [
  { value: 'day' as const, label: 'Day' },
  { value: 'week' as const, label: 'Week' },
  { value: 'month' as const, label: 'Month' },
];

interface AppRankedItem extends AppUsage {
  percentage: number;
  color: string;
  delta?: Delta;
}

export default function StatsScreen() {
  const { theme, isDark } = useTheme();

  const [range, setRange] = useState<TimeRange>('day');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [lineData, setLineData] = useState<LineDataPoint[]>([]);
  const [categories, setCategories] = useState<CategoryAggregate[]>([]);
  const [allApps, setAllApps] = useState<AppUsage[]>([]);
  const [rankedApps, setRankedApps] = useState<AppRankedItem[]>([]);
  const [totalMs, setTotalMs] = useState(0);
  const [delta, setDelta] = useState<Delta>({ deltaMs: 0, deltaPct: 0, direction: 'flat' });
  const [isBackfillNeeded, setIsBackfillNeeded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (range === 'day') {
        await fetchDayData();
      } else if (range === 'week') {
        await fetchWeekData();
      } else {
        await fetchMonthData();
      }
    } catch (error) {
      console.warn('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [range]);

  const fetchDayData = async () => {
    await usageRepository.refreshAllRecent();
    const todayUsage = await usageRepository.getTodayUsage();
    const hourly = usageRepository.getHourlyUsageToday();

    // Line chart: 24 hourly buckets
    const hourlyPoints: LineDataPoint[] = Array.from({ length: 24 }, (_, h) => {
      const bucket = hourly.find((b) => b.hour === h);
      return {
        label: formatHourLabel(h),
        value: bucket?.foregroundMs ?? 0,
      };
    });
    setLineData(hourlyPoints);

    setCategories(aggregateByCategory(todayUsage));
    setAllApps(todayUsage);

    const total = todayUsage.reduce((s, a) => s + a.foregroundMs, 0);
    setTotalMs(total);
    setRankedApps(
      todayUsage.map((app) => ({
        ...app,
        percentage: total > 0 ? Math.round((app.foregroundMs / total) * 100) : 0,
        color: getAppColor(app.packageName),
      })),
    );

    const yesterdayUsage = await usageRepository.getPreviousDayUsage();
    const yesterdayTotal = yesterdayUsage.reduce((s, a) => s + a.foregroundMs, 0);
    setDelta(computeDeltas(total, yesterdayTotal));
    setIsBackfillNeeded(false);
  };

  const fetchWeekData = async () => {
    await usageRepository.backfillAvailableHistory();
    const weekRows = await usageRepository.getWeekUsage();
    const prevWeekRows = await usageRepository.getPreviousWeekUsage();
    processRangeData(weekRows, prevWeekRows, 7, false);
  };

  const fetchMonthData = async () => {
    await usageRepository.backfillAvailableHistory();
    const monthRows = await usageRepository.getMonthUsage();
    const prevMonthRows = await usageRepository.getPreviousMonthUsage();
    processRangeData(monthRows, prevMonthRows, 30, true);
  };

  const processRangeData = (
    rows: DateUsageRow[],
    prevRows: DateUsageRow[],
    days: number,
    checkBackfill: boolean,
  ) => {
    const dailyAggs = aggregateByDay(rows);
    const dateStrs = getLastNDays(days);

    const points: LineDataPoint[] = dateStrs.map((dateStr) => {
      const agg = dailyAggs.find((d) => d.date === dateStr);
      return {
        label: days <= 7 ? getDayLabel(dateStr) : getShortDateLabel(dateStr),
        value: agg?.totalMs ?? 0,
        date: dateStr,
      };
    });
    setLineData(points);

    const mergedUsage = mergeUsageRows(rows);
    setCategories(aggregateByCategory(mergedUsage));
    setAllApps(mergedUsage);

    const total = mergedUsage.reduce((s, a) => s + a.foregroundMs, 0);
    setTotalMs(total);
    setRankedApps(
      mergedUsage
        .sort((a, b) => b.foregroundMs - a.foregroundMs)
        .map((app) => ({
          ...app,
          percentage: total > 0 ? Math.round((app.foregroundMs / total) * 100) : 0,
          color: getAppColor(app.packageName),
        })),
    );

    const prevTotal = prevRows.reduce((s, r) => s + r.foregroundMs, 0);
    setDelta(computeDeltas(total, prevTotal));

    if (checkBackfill) {
      const uniqueDates = new Set(rows.map((r) => r.date));
      setIsBackfillNeeded(uniqueDates.size < 10);
    } else {
      setIsBackfillNeeded(false);
    }
  };

  const mergeUsageRows = (rows: DateUsageRow[]): AppUsage[] => {
    const map = new Map<string, AppUsage>();
    for (const row of rows) {
      const existing = map.get(row.packageName);
      if (existing) {
        existing.foregroundMs += row.foregroundMs;
        existing.launches += row.launches;
        existing.sessions += row.sessions;
        existing.nightMs += row.nightMs;
      } else {
        map.set(row.packageName, {
          packageName: row.packageName,
          appName: row.appName,
          category: row.category,
          foregroundMs: row.foregroundMs,
          launches: row.launches,
          sessions: row.sessions,
          nightMs: row.nightMs,
        });
      }
    }
    return Array.from(map.values());
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchData();
      }
    });
    return () => sub.remove();
  }, [fetchData]);

  // ─── Delta display ─────────────────────────────────────────

  const deltaColor =
    delta.direction === 'down'
      ? theme.semantic.good
      : delta.direction === 'up'
      ? theme.semantic.nudge
      : theme.text.tertiary;

  const DeltaIcon =
    delta.direction === 'down'
      ? TrendingDown
      : delta.direction === 'up'
      ? TrendingUp
      : Minus;

  const periodLabel =
    range === 'day'
      ? 'vs yesterday'
      : range === 'week'
      ? 'vs last week'
      : 'vs last month';

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <Screen scrollable>
        <Header title="Stats" largeTitle />
        <View style={styles.segmentWrapper}>
          <Skeleton variant="rect" height={44} />
        </View>
        <Skeleton variant="rect" height={180} style={{ marginBottom: 16, borderRadius: 20 }} />
        <Skeleton variant="rect" height={60} style={{ marginBottom: 8, borderRadius: 12 }} />
        <Skeleton variant="rect" height={60} style={{ marginBottom: 8, borderRadius: 12 }} />
        <Skeleton variant="rect" height={60} style={{ borderRadius: 12 }} />
      </Screen>
    );
  }

  const renderAppItem = ({ item, index }: { item: AppRankedItem; index: number }) => (
    <Pressable3D
      onPress={() =>
        router.push({
          pathname: '/app-detail',
          params: {
            packageName: item.packageName,
            appName: item.appName,
            category: item.category,
          },
        })
      }
    >
      <Card style={styles.appCard} variant="base" padding="base">
        <View style={styles.appRow}>
          <View
            style={[
              styles.appRank,
              {
                backgroundColor: `${item.color}18`,
                borderColor: `${item.color}30`,
              },
            ]}
          >
            <Text
              style={[
                styles.rankText,
                {
                  color: item.color,
                  fontFamily: typography.fonts.numbersBold,
                },
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <AppIcon packageName={item.packageName} appName={item.appName} size={38} />
          <View style={styles.appInfo}>
            <Text
              numberOfLines={1}
              style={[
                styles.appName,
                { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold },
              ]}
            >
              {item.appName}
            </Text>
            <View style={styles.appBarWrapper}>
              <UsageBar
                progress={item.percentage / 100}
                color={item.color}
                index={index}
                trackColor={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
              />
            </View>
          </View>
          <View style={styles.appTimeCol}>
            <Text
              style={[
                styles.appTime,
                { color: item.color, fontFamily: typography.fonts.numbersBold },
              ]}
            >
              {formatMs(item.foregroundMs)}
            </Text>
            <Text
              style={[
                styles.appPct,
                { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium },
              ]}
            >
              {item.percentage}%
            </Text>
          </View>
        </View>
      </Card>
    </Pressable3D>
  );

  return (
    <Screen
      scrollable
      onRefresh={handleRefresh}
      refreshing={refreshing}
      header={<Header title="Stats" largeTitle />}
    >
      {/* Segmented Control */}
      <View style={styles.segmentWrapper}>
        <SegmentedControl
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
        />
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View>
          <Text
            style={[
              styles.summaryTotal,
              { color: theme.text.primary, fontFamily: typography.fonts.numbersBold },
            ]}
          >
            {formatMs(totalMs)}
          </Text>
          <Text
            style={[
              styles.summaryLabel,
              { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium },
            ]}
          >
            {range === 'day' ? 'screen time today' : range === 'week' ? 'this week' : 'this month'}
          </Text>
        </View>
        <View style={styles.deltaChip}>
          <DeltaIcon size={12} color={deltaColor} />
          <Text
            style={[
              styles.deltaText,
              { color: deltaColor, fontFamily: typography.fonts.uiMedium },
            ]}
          >
            {formatDelta(delta)} {periodLabel}
          </Text>
        </View>
      </View>

      {/* AI Contextual Suggestion (Gemini / Free Tier) */}
      <AiSuggestionCard
        screen="stats"
        totalMinutes={Math.round(totalMs / 60000)}
        topApp={rankedApps[0] ? { appName: rankedApps[0].appName, minutes: Math.round(rankedApps[0].foregroundMs / 60000), category: rankedApps[0].category } : undefined}
        deltaMinutes={Math.round(delta.deltaMs / 60000)}
        deltaPct={delta.deltaPct}
        deltaDirection={delta.direction}
      />

      {/* Line Chart */}
      <Card style={styles.chartCard} padding="base">
        <ActivityLineChart
          data={lineData}
          height={160}
          showLabels
          maxLabels={range === 'day' ? 5 : range === 'week' ? 7 : 8}
        />
      </Card>

      {/* Category Bars */}
      {categories.length > 0 && (
        <View style={styles.categorySection}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.text.tertiary, fontFamily: typography.fonts.uiSemiBold },
            ]}
          >
            CATEGORIES
          </Text>
          <CategoryBars
            data={categories}
            totalMs={totalMs}
            apps={allApps}
            onAppPress={(app) =>
              router.push({
                pathname: '/app-detail',
                params: {
                  packageName: app.packageName,
                  appName: app.appName,
                  category: app.category,
                },
              })
            }
          />
        </View>
      )}

      {/* Backfill Notice (Month view) */}
      {isBackfillNeeded && range === 'month' && (
        <Card style={styles.backfillCard} variant="highlight" padding="base">
          <View style={styles.backfillRow}>
            <Info size={16} color={theme.semantic.info} />
            <Text
              style={[
                styles.backfillText,
                { color: theme.text.secondary, fontFamily: typography.fonts.uiRegular },
              ]}
            >
              Your monthly view fills in as days pass. Android keeps ~7-10 days of history.
            </Text>
          </View>
        </Card>
      )}

      {/* Ranked App List */}
      <View style={styles.listSection}>
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.text.tertiary, fontFamily: typography.fonts.uiSemiBold },
          ]}
        >
          APP RANKING ({rankedApps.length})
        </Text>

        {rankedApps.length === 0 ? (
          <EmptyState
            title="No usage data"
            description={
              range === 'month'
                ? 'Your monthly stats will build up over time.'
                : 'Use some apps and check back!'
            }
          />
        ) : (
          <View style={styles.appListContainer}>
            {rankedApps.map((item, index) => (
              <React.Fragment key={item.packageName}>
                {renderAppItem({ item, index })}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentWrapper: {
    marginBottom: spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  summaryTotal: {
    fontSize: typography.scale.xl,
    includeFontPadding: false,
  },
  summaryLabel: {
    fontSize: typography.scale.xs,
    marginTop: 2,
    includeFontPadding: false,
  },
  deltaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deltaText: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  chartCard: {
    marginBottom: spacing.md,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  backfillCard: {
    marginBottom: spacing.md,
  },
  backfillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backfillText: {
    flex: 1,
    fontSize: typography.scale.xs,
    lineHeight: typography.lineHeight.xs + 4,
    includeFontPadding: false,
  },
  listSection: {
    marginBottom: spacing.md,
  },
  appListContainer: {
    minHeight: 200,
  },
  appCard: {
    marginBottom: spacing.sm,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appRank: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  appInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  appName: {
    fontSize: typography.scale.sm,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  appBarWrapper: {
    width: '100%',
  },
  appTimeCol: {
    alignItems: 'flex-end',
  },
  appTime: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  appPct: {
    fontSize: 10,
    marginTop: 2,
    includeFontPadding: false,
  },
  bottomSpacer: {
    height: 20,
  },
});
