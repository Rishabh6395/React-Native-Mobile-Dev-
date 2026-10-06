import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, AppState } from 'react-native';
import { hasUsageAccess, openUsageAccessSettings, AppUsage } from '../modules/usage-stats';
import { usageRepository } from '../src/features/usage/UsageRepository';
import { colors, typography, spacing, layout } from '../src/theme/tokens';

export default function Home() {
  const [hasPermission, setHasPermission] = useState(false);
  const [usage, setUsage] = useState<AppUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const checkPermissionAndFetch = async () => {
    const granted = hasUsageAccess();
    setHasPermission(granted);
    if (granted) {
      await usageRepository.refreshToday();
      const todayUsage = await usageRepository.getTodayUsage();
      setUsage(todayUsage);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkPermissionAndFetch();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkPermissionAndFetch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Permission Required</Text>
        <Text style={styles.text}>
          We need Usage Access to show you where your time goes.
        </Text>
        <Button 
          title="Grant Usage Access" 
          onPress={() => openUsageAccessSettings()} 
          color={colors.accent.violet} 
        />
      </View>
    );
  }

  const formatMs = (ms: number) => {
    const minutes = Math.floor(ms / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Today's Usage</Text>
      {usage.map((app, index) => (
        <View key={app.packageName} style={styles.card}>
          <Text style={styles.appName}>{app.appName}</Text>
          <Text style={styles.appTime}>{formatMs(app.foregroundMs)}</Text>
          <Text style={styles.appMeta}>
            {app.category} • {app.launches} launches • {formatMs(app.nightMs)} at night
          </Text>
        </View>
      ))}
      {usage.length === 0 && (
        <Text style={styles.text}>No usage data found for today.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenPadding,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: layout.screenPadding,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.scale.xl,
    fontFamily: typography.fonts.numbers,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  text: {
    color: colors.text.secondary,
    fontSize: typography.scale.base,
    fontFamily: typography.fonts.ui,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card.primary,
    padding: spacing.lg,
    borderRadius: layout.borderRadius.card,
    marginBottom: spacing.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  appName: {
    color: colors.text.primary,
    fontSize: typography.scale.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  appTime: {
    color: colors.accent.aqua,
    fontSize: typography.scale.lg,
    fontFamily: typography.fonts.numbers,
    marginBottom: spacing.xs,
  },
  appMeta: {
    color: colors.text.secondary,
    fontSize: typography.scale.sm,
  }
});
