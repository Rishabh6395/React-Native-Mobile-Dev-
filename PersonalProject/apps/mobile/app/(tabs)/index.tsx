/**
 * Home Screen — Main dashboard
 * Spec Reference: Section 9.4 Screen 3
 *
 * Greeting, hero ProgressRing with today's total and delta vs yesterday,
 * 24h MiniTimeline, top 3 apps, coach insight card.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import { router } from 'expo-router';
import {
  Sparkles,
  Clock,
  TrendingDown,
  TrendingUp,
  Minus,
  Layers,
} from 'lucide-react-native';
import { AppUsage, HourBucket } from '../../modules/usage-stats';
import { usageRepository } from '../../src/features/usage/UsageRepository';
import {
  getGreeting,
  formatMs,
  getTopApps,
  computeDeltas,
  formatDeltaTime,
  TopApp,
  Delta,
} from '../../src/features/usage/usageAggregation';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  Screen,
  Header,
  Card,
  GlowCard,
  Button,
  ProgressRing,
  AnimatedNumber,
  AppIcon,
  Skeleton,
  EmptyState,
  Pill,
  Pressable3D,
} from '../../src/components/ui';
import { MiniTimeline } from '../../src/components/charts';
import { layout, spacing, typography, getAppColor } from '../../src/theme/tokens';

export default function HomeScreen() {
  const { theme, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usage, setUsage] = useState<AppUsage[]>([]);
  const [hourlyData, setHourlyData] = useState<HourBucket[]>([]);
  const [topApps, setTopApps] = useState<TopApp[]>([]);
  const [delta, setDelta] = useState<Delta>({ deltaMs: 0, deltaPct: 0, direction: 'flat' });

  const totalMs = usage.reduce((sum, app) => sum + app.foregroundMs, 0);
  const totalMinutes = Math.floor(totalMs / 60000);

  const fetchData = useCallback(async () => {
    try {
      // Refresh today
      await usageRepository.refreshToday();

      // Get today's data
      const todayUsage = await usageRepository.getTodayUsage();
      setUsage(todayUsage);
      setTopApps(getTopApps(todayUsage, 3));

      // Get hourly data
      const hourly = usageRepository.getHourlyUsageToday();
      setHourlyData(hourly);

      // Compute delta vs yesterday
      const yesterdayUsage = await usageRepository.getPreviousDayUsage();
      const yesterdayTotal = yesterdayUsage.reduce((sum, a) => sum + a.foregroundMs, 0);
      const todayTotal = todayUsage.reduce((sum, a) => sum + a.foregroundMs, 0);
      setDelta(computeDeltas(todayTotal, yesterdayTotal));
    } catch (error) {
      console.warn('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    // Also run backfill on first mount
    usageRepository.backfillAvailableHistory().catch(() => {});

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchData();
      }
    });

    return () => sub.remove();
  }, [fetchData]);

  // ─── Loading State ─────────────────────────────────────────

  if (loading) {
    return (
      <Screen scrollable>
        <View style={styles.skeletonContainer}>
          <Skeleton
            variant="circle"
            width={170}
            height={170}
            style={{ alignSelf: 'center', marginBottom: 24 }}
          />
          <Skeleton variant="rect" height={40} style={{ marginBottom: 12 }} />
          <Skeleton variant="rect" height={80} style={{ marginBottom: 12 }} />
          <Skeleton variant="rect" height={80} style={{ marginBottom: 12 }} />
          <Skeleton variant="rect" height={80} />
        </View>
      </Screen>
    );
  }

  // ─── Delta icon and color ──────────────────────────────────

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

  return (
    <Screen
      scrollable
      onRefresh={handleRefresh}
      refreshing={refreshing}
      header={
        <Header
          title={getGreeting()}
          subtitle="Here's your screen time today"
          largeTitle
          rightAction={
            <Button
              title="Dev"
              size="sm"
              variant="secondary"
              icon={<Layers size={14} color={theme.text.primary} />}
              onPress={() => router.push('/dev/components')}
            />
          }
        />
      }
    >
      {/* Hero Progress Ring */}
      <Card style={styles.heroCard}>
        <ProgressRing
          progress={Math.min(totalMinutes / 360, 1)}
          size={170}
          strokeWidth={14}
        >
          <View style={styles.heroRingInner}>
            <AnimatedNumber
              value={totalMinutes}
              format={() => formatMs(totalMs)}
              style={[
                styles.heroTimeText,
                {
                  color: theme.text.primary,
                  fontFamily: typography.fonts.numbersBold,
                },
              ]}
            />
            <View style={styles.heroDeltaRow}>
              <DeltaIcon size={12} color={deltaColor} />
              <Text
                style={[
                  styles.heroDeltaText,
                  {
                    color: deltaColor,
                    fontFamily: typography.fonts.uiMedium,
                  },
                ]}
              >
                {delta.direction === 'flat'
                  ? 'Same as yesterday'
                  : formatDeltaTime(delta)}
              </Text>
            </View>
          </View>
        </ProgressRing>
      </Card>

      {/* 24h Mini Timeline */}
      <Card style={styles.timelineCard} padding="base">
        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.text.tertiary,
              fontFamily: typography.fonts.uiSemiBold,
            },
          ]}
        >
          TODAY'S ACTIVITY
        </Text>
        <MiniTimeline data={hourlyData} barHeight={36} />
      </Card>

      {/* Top 3 Apps */}
      {topApps.length > 0 && (
        <View style={styles.topAppsSection}>
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.text.tertiary,
                fontFamily: typography.fonts.uiSemiBold,
              },
            ]}
          >
            TOP APPS
          </Text>
          {topApps.map((app, idx) => (
            <Pressable3D
              key={app.packageName}
              onPress={() =>
                router.push({
                  pathname: '/app-detail',
                  params: {
                    packageName: app.packageName,
                    appName: app.appName,
                    category: app.category,
                  },
                })
              }
            >
              <Card style={styles.topAppCard} variant="base" padding="base">
                <View style={styles.topAppRow}>
                  <View style={styles.topAppRank}>
                    <Text
                      style={[
                        styles.rankText,
                        {
                          color: theme.text.muted,
                          fontFamily: typography.fonts.numbersBold,
                        },
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  <AppIcon
                    packageName={app.packageName}
                    appName={app.appName}
                    size={40}
                  />
                  <View style={styles.topAppInfo}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.topAppName,
                        {
                          color: theme.text.primary,
                          fontFamily: typography.fonts.uiSemiBold,
                        },
                      ]}
                    >
                      {app.appName}
                    </Text>
                    <Text
                      style={[
                        styles.topAppMeta,
                        {
                          color: theme.text.secondary,
                          fontFamily: typography.fonts.uiRegular,
                        },
                      ]}
                    >
                      {app.category} • {app.percentage}%
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.topAppTime,
                      {
                        color: app.color,
                        fontFamily: typography.fonts.numbersBold,
                      },
                    ]}
                  >
                    {formatMs(app.foregroundMs)}
                  </Text>
                </View>
              </Card>
            </Pressable3D>
          ))}
        </View>
      )}

      {/* Coach Insight Card */}
      <GlowCard style={styles.coachCard} padding="base">
        <View style={styles.coachHeader}>
          <View
            style={[
              styles.coachIconCircle,
              { backgroundColor: theme.accent.violet },
            ]}
          >
            <Sparkles size={14} color="#FFFFFF" />
          </View>
          <Text
            style={[
              styles.coachTitle,
              {
                color: theme.text.primary,
                fontFamily: typography.fonts.uiSemiBold,
              },
            ]}
          >
            Coach Insight
          </Text>
        </View>
        <Text
          style={[
            styles.coachBody,
            {
              color: theme.text.secondary,
              fontFamily: typography.fonts.uiRegular,
            },
          ]}
        >
          {usage.length > 0
            ? `${usage[0].appName} took the most focus today (${formatMs(
                usage[0].foregroundMs
              )}). Consider a gentle swap if you're winding down.`
            : 'Welcome! Your device usage metrics will calibrate as you use apps today.'}
        </Text>
        <View style={styles.coachChips}>
          <Pill label="View Full Report" size="sm" active />
          <Pill label="Ask the Coach" size="sm" />
        </View>
      </GlowCard>

      {/* Empty State */}
      {usage.length === 0 && (
        <EmptyState
          icon={<Clock size={40} color={theme.accent.violet} />}
          title="No app usage recorded yet"
          description="Open a few apps and check back. Data updates dynamically from your device."
          actionTitle="Refresh"
          onAction={handleRefresh}
        />
      )}

      {/* Bottom spacer for tab bar */}
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingVertical: spacing.xl,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  heroRingInner: {
    alignItems: 'center',
  },
  heroTimeText: {
    fontSize: typography.scale.xl,
    includeFontPadding: false,
  },
  heroDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  heroDeltaText: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  timelineCard: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  topAppsSection: {
    marginBottom: spacing.md,
  },
  topAppCard: {
    marginBottom: spacing.sm,
  },
  topAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topAppRank: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  topAppInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  topAppName: {
    fontSize: typography.scale.base,
    marginBottom: 2,
    includeFontPadding: false,
  },
  topAppMeta: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  topAppTime: {
    fontSize: typography.scale.base,
    includeFontPadding: false,
  },
  coachCard: {
    marginBottom: spacing.md,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  coachIconCircle: {
    width: 22,
    height: 22,
    borderRadius: layout.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  coachTitle: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  coachBody: {
    fontSize: typography.scale.sm,
    lineHeight: typography.lineHeight.sm + 4,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  coachChips: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  bottomSpacer: {
    height: 20,
  },
});
