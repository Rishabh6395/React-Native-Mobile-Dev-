import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import { router } from 'expo-router';
import {
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react-native';
import { hasUsageAccess, AppUsage } from '../modules/usage-stats';
import { usageRepository } from '../src/features/usage/UsageRepository';
import { useTheme } from '../src/theme/ThemeContext';
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
} from '../src/components/ui';
import { OnboardingFlow } from '../src/features/onboarding/OnboardingFlow';
import { PermissionScreen } from '../src/features/permissions/PermissionScreen';
import { layout, spacing, typography } from '../src/theme/tokens';

export default function Home() {
  const { theme } = useTheme();

  const [onboarded, setOnboarded] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [usage, setUsage] = useState<AppUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkStatusAndFetch = async () => {
    const granted = hasUsageAccess();
    setHasPermission(granted);

    if (granted) {
      await usageRepository.refreshToday();
      const todayUsage = await usageRepository.getTodayUsage();
      setUsage(todayUsage);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkStatusAndFetch();
    setRefreshing(false);
  };

  useEffect(() => {
    checkStatusAndFetch();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkStatusAndFetch();
      }
    });

    return () => sub.remove();
  }, []);

  // Format milliseconds to '2h 15m' or '45m'
  const formatMs = (ms: number) => {
    const minutes = Math.floor(ms / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Total screen time
  const totalForegroundMs = usage.reduce((acc, curr) => acc + curr.foregroundMs, 0);
  const totalMinutes = Math.floor(totalForegroundMs / 1000 / 60);

  // 1. Onboarding Flow
  if (!onboarded) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setOnboarded(true);
        }}
      />
    );
  }

  // 2. Permission Flow
  if (!hasPermission) {
    return (
      <PermissionScreen
        onGranted={() => {
          setHasPermission(true);
          checkStatusAndFetch();
        }}
      />
    );
  }

  // 3. Loading Skeleton State
  if (loading) {
    return (
      <Screen scrollable>
        <View style={styles.skeletonContainer}>
          <Skeleton variant="circle" width={160} height={160} style={{ alignSelf: 'center', marginBottom: 24 }} />
          <Skeleton variant="rect" height={32} style={{ marginBottom: 12 }} />
          <Skeleton variant="rect" height={80} style={{ marginBottom: 12 }} />
          <Skeleton variant="rect" height={80} style={{ marginBottom: 12 }} />
          <Skeleton variant="rect" height={80} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable
      onRefresh={handleRefresh}
      refreshing={refreshing}
      header={
        <Header
          title="Today's Overview"
          subtitle="Real-time device usage"
          largeTitle
          rightAction={
            <Button
              title="Dev UI"
              size="sm"
              variant="secondary"
              icon={<Layers size={14} color={theme.text.primary} />}
              onPress={() => router.push('/dev/components')}
            />
          }
        />
      }
    >
      {/* Dev Navigation Strip */}
      <Card style={styles.devBarCard} variant="highlight">
        <View style={styles.devBarRow}>
          <View style={styles.devBarTextCol}>
            <Text style={[styles.devBarTitle, { color: theme.text.primary }]}>
              Design System Ready
            </Text>
            <Text style={[styles.devBarSub, { color: theme.text.secondary }]}>
              Storybook component gallery at /dev/components
            </Text>
          </View>
          <View style={styles.devBarActions}>
            <Button
              title="Gallery"
              size="sm"
              variant="primary"
              onPress={() => router.push('/dev/components')}
            />
            <Button
              title="Re-onboard"
              size="sm"
              variant="ghost"
              onPress={() => setOnboarded(false)}
            />
          </View>
        </View>
      </Card>

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
              format={() => formatMs(totalForegroundMs)}
              style={[styles.heroTimeText, { color: theme.text.primary }]}
            />
            <Text style={[styles.heroRingSub, { color: theme.text.secondary }]}>
              total today
            </Text>
          </View>
        </ProgressRing>
      </Card>

      {/* Coach Insight Glow Card */}
      <GlowCard style={styles.coachCard} padding="base">
        <View style={styles.coachHeader}>
          <View style={[styles.coachIconCircle, { backgroundColor: theme.accent.violet }]}>
            <Sparkles size={14} color="#FFFFFF" />
          </View>
          <Text style={[styles.coachTitle, { color: theme.text.primary }]}>
            Coach Insight
          </Text>
        </View>
        <Text style={[styles.coachBody, { color: theme.text.secondary }]}>
          {usage.length > 0
            ? `${usage[0].appName} took the most focus today (${formatMs(usage[0].foregroundMs)}). Consider a gentle swap if you're winding down.`
            : 'Welcome! Your device usage metrics will calibrate as you use apps today.'}
        </Text>
      </GlowCard>

      {/* Usage List Header */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.listHeading, { color: theme.text.primary }]}>
          App Breakdown ({usage.length})
        </Text>
      </View>

      {/* App List */}
      {usage.length === 0 ? (
        <EmptyState
          icon={<Clock size={40} color={theme.accent.violet} />}
          title="No app usage recorded yet"
          description="Open a few apps and check back. Data updates dynamically from your device."
          actionTitle="Refresh Usage"
          onAction={handleRefresh}
        />
      ) : (
        usage.map((app) => (
          <Card key={app.packageName} style={styles.appCard} variant="base">
            <View style={styles.appRow}>
              <AppIcon
                packageName={app.packageName}
                appName={app.appName}
                size={44}
              />
              <View style={styles.appInfoCol}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.appNameText,
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
                    styles.appMetaText,
                    {
                      color: theme.text.secondary,
                      fontFamily: typography.fonts.uiRegular,
                    },
                  ]}
                >
                  {app.category} • {app.launches} launches
                  {app.nightMs > 0 ? ` • ${formatMs(app.nightMs)} late` : ''}
                </Text>
              </View>

              <View style={styles.appTimeCol}>
                <Text
                  style={[
                    styles.appTimeValue,
                    {
                      color: theme.accent.aqua,
                      fontFamily: typography.fonts.numbersBold,
                    },
                  ]}
                >
                  {formatMs(app.foregroundMs)}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingVertical: spacing.xl,
  },
  devBarCard: {
    marginBottom: spacing.md,
  },
  devBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devBarTextCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  devBarTitle: {
    fontSize: typography.scale.sm,
    fontFamily: typography.fonts.uiSemiBold,
  },
  devBarSub: {
    fontSize: typography.scale.xs,
    marginTop: 2,
  },
  devBarActions: {
    flexDirection: 'row',
    gap: spacing.xs,
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
  },
  heroRingSub: {
    fontSize: typography.scale.xs,
    marginTop: 2,
  },
  coachCard: {
    marginBottom: spacing.lg,
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
    fontFamily: typography.fonts.uiSemiBold,
  },
  coachBody: {
    fontSize: typography.scale.sm,
    lineHeight: typography.lineHeight.sm + 4,
  },
  listHeaderRow: {
    marginBottom: spacing.sm,
  },
  listHeading: {
    fontSize: typography.scale.sm,
    fontFamily: typography.fonts.uiSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appInfoCol: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  appNameText: {
    fontSize: typography.scale.base,
    marginBottom: 2,
  },
  appMetaText: {
    fontSize: typography.scale.xs,
  },
  appTimeCol: {
    alignItems: 'flex-end',
  },
  appTimeValue: {
    fontSize: typography.scale.base,
  },
});
