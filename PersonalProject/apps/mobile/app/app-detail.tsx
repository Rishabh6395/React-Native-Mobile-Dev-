/**
 * App Detail Screen — Per-app usage deep dive
 * Spec Reference: Section 9.4 Screen 4 (App Detail)
 *
 * Daily usage trend, hourly heatmap for today, stats row,
 * goal CTA, and "Ask coach about this app" button.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Zap,
  Moon,
  Timer,
  Target,
  MessageCircle,
} from 'lucide-react-native';
import { HourBucket } from '../modules/usage-stats';
import { usageRepository } from '../src/features/usage/UsageRepository';
import {
  formatMs,
  formatHourLabel,
  getDayLabel,
  getLastNDays,
  aggregateByDay,
  DateUsageRow,
} from '../src/features/usage/usageAggregation';
import { useTheme } from '../src/theme/ThemeContext';
import {
  Screen,
  Header,
  Card,
  Button,
  AppIcon,
  Skeleton,
  Pressable3D,
} from '../src/components/ui';
import { BarChart, MiniTimeline, BarDataPoint } from '../src/components/charts';
import { layout, spacing, typography, getAppColor } from '../src/theme/tokens';

export default function AppDetailScreen() {
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams<{
    packageName: string;
    appName: string;
    category: string;
  }>();

  const { packageName, appName, category } = params;
  const appColor = getAppColor(packageName ?? '');

  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<BarDataPoint[]>([]);
  const [hourlyData, setHourlyData] = useState<HourBucket[]>([]);
  const [todayMs, setTodayMs] = useState(0);
  const [totalLaunches, setTotalLaunches] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalNightMs, setTotalNightMs] = useState(0);
  const [weekTotalMs, setWeekTotalMs] = useState(0);

  const fetchData = useCallback(async () => {
    if (!packageName) return;

    try {
      // Get last 7 days of usage for this app
      const history = await usageRepository.getAppUsageHistory(packageName, 7);

      // Build 7-day trend bar chart
      const dateStrs = getLastNDays(7);
      const bars: BarDataPoint[] = dateStrs.map((dateStr) => {
        const row = history.find((r) => r.date === dateStr);
        return {
          label: getDayLabel(dateStr),
          value: row?.foregroundMs ?? 0,
          date: dateStr,
        };
      });
      setTrendData(bars);

      // Today's stats
      const todayRow = history.find(
        (r) => r.date === dateStrs[dateStrs.length - 1]
      );
      setTodayMs(todayRow?.foregroundMs ?? 0);

      // Week totals
      const weekTotal = history.reduce((s, r) => s + r.foregroundMs, 0);
      setWeekTotalMs(weekTotal);
      setTotalLaunches(history.reduce((s, r) => s + r.launches, 0));
      setTotalSessions(history.reduce((s, r) => s + r.sessions, 0));
      setTotalNightMs(history.reduce((s, r) => s + r.nightMs, 0));

      // Hourly breakdown for today (filter from overall hourly data)
      const allHourly = usageRepository.getHourlyUsageToday();
      // Note: getHourlyUsage is for ALL apps. We'll show it as context.
      // For per-app hourly, we'd need a new native method. For now, show overall.
      setHourlyData(allHourly);
    } catch (error) {
      console.warn('Failed to fetch app detail:', error);
    } finally {
      setLoading(false);
    }
  }, [packageName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Screen scrollable>
        <Header
          title={appName ?? 'App'}
          onBack={() => router.back()}
        />
        <View style={{ paddingVertical: spacing.xl }}>
          <Skeleton variant="rect" height={48} style={{ marginBottom: 16 }} />
          <Skeleton variant="rect" height={180} style={{ marginBottom: 16 }} />
          <Skeleton variant="rect" height={80} style={{ marginBottom: 12 }} />
          <Skeleton variant="rect" height={80} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable
      header={
        <Header
          title={appName ?? 'App Detail'}
          subtitle={category}
          onBack={() => router.back()}
        />
      }
    >
      {/* App Identity */}
      <Card style={styles.identityCard} padding="base">
        <View style={styles.identityRow}>
          <AppIcon
            packageName={packageName ?? ''}
            appName={appName ?? ''}
            size={56}
          />
          <View style={styles.identityInfo}>
            <Text
              style={[
                styles.identityName,
                { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold },
              ]}
              numberOfLines={1}
            >
              {appName}
            </Text>
            <Text
              style={[
                styles.identityCategory,
                { color: theme.text.secondary, fontFamily: typography.fonts.uiRegular },
              ]}
            >
              {category}
            </Text>
          </View>
          <View style={styles.identityTime}>
            <Text
              style={[
                styles.identityTodayValue,
                { color: appColor, fontFamily: typography.fonts.numbersBold },
              ]}
            >
              {formatMs(todayMs)}
            </Text>
            <Text
              style={[
                styles.identityTodayLabel,
                { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium },
              ]}
            >
              today
            </Text>
          </View>
        </View>
      </Card>

      {/* 7-Day Trend */}
      <Card style={styles.chartCard} padding="base">
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.text.tertiary, fontFamily: typography.fonts.uiSemiBold },
          ]}
        >
          LAST 7 DAYS
        </Text>
        <BarChart
          data={trendData}
          height={140}
          barColor={appColor}
          showLabels
          maxLabels={7}
        />
        <View style={styles.weekTotalRow}>
          <Text
            style={[
              styles.weekTotalLabel,
              { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium },
            ]}
          >
            Week total
          </Text>
          <Text
            style={[
              styles.weekTotalValue,
              { color: theme.text.primary, fontFamily: typography.fonts.numbersBold },
            ]}
          >
            {formatMs(weekTotalMs)}
          </Text>
        </View>
      </Card>

      {/* Today's Activity (hourly) */}
      <Card style={styles.timelineCard} padding="base">
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.text.tertiary, fontFamily: typography.fonts.uiSemiBold },
          ]}
        >
          TODAY'S ACTIVITY
        </Text>
        <MiniTimeline data={hourlyData} barHeight={28} />
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon={<Zap size={18} color={theme.semantic.nudge} />}
          label="Launches"
          value={`${totalLaunches}`}
          sublabel="this week"
          theme={theme}
        />
        <StatCard
          icon={<Clock size={18} color={theme.semantic.info} />}
          label="Sessions"
          value={`${totalSessions}`}
          sublabel="this week"
          theme={theme}
        />
        <StatCard
          icon={<Moon size={18} color={theme.accent.violet} />}
          label="Night Usage"
          value={formatMs(totalNightMs)}
          sublabel="22:00–06:00"
          theme={theme}
        />
        <StatCard
          icon={<Timer size={18} color={theme.semantic.good} />}
          label="Avg / Day"
          value={formatMs(Math.round(weekTotalMs / 7))}
          sublabel="last 7 days"
          theme={theme}
        />
      </View>

      {/* Action CTAs */}
      <View style={styles.actionsSection}>
        <Button
          title="Set a daily limit"
          variant="primary"
          size="lg"
          fullWidth
          icon={<Target size={18} color="#FFFFFF" />}
          iconPosition="left"
          onPress={() => {
            // Placeholder for Phase 7
          }}
        />
        <Button
          title="Ask coach about this app"
          variant="secondary"
          size="lg"
          fullWidth
          icon={<MessageCircle size={18} color={theme.text.primary} />}
          iconPosition="left"
          onPress={() => {
            // Placeholder for Phase 6
          }}
        />
      </View>

      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

// ─── Stat Card Sub-component ─────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  theme: ReturnType<typeof useTheme>['theme'];
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sublabel, theme }) => (
  <Card style={styles.statCard} variant="base" padding="base">
    <View style={styles.statIconRow}>
      {icon}
      <Text
        style={[
          styles.statLabel,
          { color: theme.text.secondary, fontFamily: typography.fonts.uiMedium },
        ]}
      >
        {label}
      </Text>
    </View>
    <Text
      style={[
        styles.statValue,
        { color: theme.text.primary, fontFamily: typography.fonts.numbersBold },
      ]}
    >
      {value}
    </Text>
    <Text
      style={[
        styles.statSublabel,
        { color: theme.text.tertiary, fontFamily: typography.fonts.uiRegular },
      ]}
    >
      {sublabel}
    </Text>
  </Card>
);

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  identityCard: {
    marginBottom: spacing.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identityInfo: {
    flex: 1,
    marginLeft: spacing.base,
    marginRight: spacing.sm,
  },
  identityName: {
    fontSize: typography.scale.lg,
    includeFontPadding: false,
    marginBottom: 2,
  },
  identityCategory: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  identityTime: {
    alignItems: 'flex-end',
  },
  identityTodayValue: {
    fontSize: typography.scale.xl,
    includeFontPadding: false,
  },
  identityTodayLabel: {
    fontSize: typography.scale.xs,
    marginTop: 2,
    includeFontPadding: false,
  },
  chartCard: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  weekTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  weekTotalLabel: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  weekTotalValue: {
    fontSize: typography.scale.base,
    includeFontPadding: false,
  },
  timelineCard: {
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  statValue: {
    fontSize: typography.scale.lg,
    includeFontPadding: false,
    marginBottom: 2,
  },
  statSublabel: {
    fontSize: 10,
    includeFontPadding: false,
  },
  actionsSection: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  bottomSpacer: {
    height: 20,
  },
});
