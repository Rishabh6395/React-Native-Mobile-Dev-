/**
 * AiSuggestionCard — Contextual, data-aware AI assistant widget
 * Appears across screens (Home, Stats, App Detail, Reports) offering:
 * - Smart "Want to reduce screen time?" action prompts
 * - Real-time day-on-day progress updates
 * - One-tap navigation to In-Built AI with contextual prefilled prompts
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import {
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Zap,
  Target,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { layout, spacing, typography } from '../../theme/tokens';
import { triggerHaptic } from '../../theme/motion';
import { Card } from './Card';
import {
  getCoachUsageSnapshot,
  formatMins,
  AggregatedUsageSnapshot,
} from '../../features/coach/coachEngine';

export interface AiSuggestionCardProps {
  screen: 'home' | 'stats' | 'app-detail' | 'reports';
  appName?: string;
  packageName?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  totalMinutes?: number;
  topApp?: { appName: string; minutes: number; category?: string };
  deltaMinutes?: number;
  deltaPct?: number;
  deltaDirection?: 'up' | 'down' | 'flat';
}

export const AiSuggestionCard: React.FC<AiSuggestionCardProps> = ({
  screen,
  appName,
  packageName,
  style,
  compact = false,
  totalMinutes,
  topApp,
  deltaMinutes,
  deltaPct,
  deltaDirection,
}) => {
  const { theme, isDark } = useTheme();
  const [snapshot, setSnapshot] = useState<AggregatedUsageSnapshot | null>(null);

  const loadSnapshot = useCallback(async () => {
    try {
      const data = await getCoachUsageSnapshot();
      setSnapshot(data);
    } catch {}
  }, []);

  useEffect(() => {
    // Only load snapshot if parent did not provide full props
    if (totalMinutes === undefined || !topApp) {
      loadSnapshot();
    }
  }, [loadSnapshot, totalMinutes, topApp]);

  const handleAskAi = (prompt: string) => {
    triggerHaptic.selection();
    router.push({
      pathname: '/(tabs)/coach',
      params: { initialPrompt: prompt },
    });
  };

  const effectiveTotalMinutes = totalMinutes !== undefined ? totalMinutes : (snapshot?.totalMinutes ?? 0);
  const effectiveTopApp = topApp || snapshot?.topApps[0];
  const effectiveDeltaMinutes = deltaMinutes !== undefined ? deltaMinutes : (snapshot?.dayOnDayDeltaMinutes ?? 0);
  const effectiveDeltaPct = deltaPct !== undefined ? deltaPct : (snapshot?.dayOnDayDeltaPct ?? 0);
  const effectiveDeltaDirection = deltaDirection || snapshot?.dayOnDayDirection || 'flat';

  const targetApp = appName || effectiveTopApp?.appName || 'your apps';
  const totalStr = formatMins(effectiveTotalMinutes);

  // Day on day message
  const dayOnDayText =
    effectiveDeltaDirection === 'down'
      ? `${formatMins(Math.abs(effectiveDeltaMinutes))} less than yesterday (-${effectiveDeltaPct}%)`
      : effectiveDeltaDirection === 'up'
      ? `${formatMins(effectiveDeltaMinutes)} more than yesterday (+${effectiveDeltaPct}%)`
      : 'steady pace with yesterday';

  const DeltaIcon = effectiveDeltaDirection === 'down' ? TrendingDown : TrendingUp;
  const deltaColor = effectiveDeltaDirection === 'down' ? theme.semantic.good : theme.semantic.nudge;

  // Screen-specific content
  let title = 'Want to reduce screen time?';
  let body = effectiveTopApp && effectiveTopApp.minutes > 0
    ? `${effectiveTopApp.appName} takes ${formatMins(effectiveTopApp.minutes)} today. Setting a ${Math.max(15, Math.round(effectiveTopApp.minutes * 0.75))}m cap could save you ~2 hrs this week.`
    : 'Track your daily usage to receive personalized AI reduction targets and habit swaps.';
  let primaryPrompt = effectiveTopApp
    ? `How can I reduce my screen time on ${effectiveTopApp.appName}?`
    : 'Give me smart tips to reduce screen time';
  let secondaryPrompt = 'Explain my day on day progress and habit trends';
  let secondaryLabel = 'Day-on-day trend';

  if (screen === 'stats') {
    title = 'AI Day-on-Day Insight';
    body = `Today is ${dayOnDayText}.${snapshot?.topCategory && snapshot.topCategory !== 'None' ? ` Highest category is ${snapshot.topCategory}.` : ''} Tap for AI breakdown.`;
    primaryPrompt = 'Give me a daily breakdown and reduction plan for my top categories';
    secondaryPrompt = 'What is my day on day progress across all apps?';
    secondaryLabel = 'Category plan';
  } else if (screen === 'app-detail') {
    title = `AI Tip: Reduce ${targetApp}`;
    body = `Want to reduce ${targetApp}? Setting a gentle daily cap or replacing scroll sessions with intentional pauses builds lasting momentum.`;
    primaryPrompt = `How can I sustainably reduce my screen time on ${targetApp}?`;
    secondaryPrompt = `Suggest healthy swaps for ${targetApp}`;
    secondaryLabel = 'Smart swaps';
  } else if (screen === 'reports') {
    title = 'AI Habit Synthesis';
    body = effectiveTotalMinutes > 0
      ? `Logged ${totalStr} today. Day-on-day trajectory is ${effectiveDeltaDirection === 'down' ? 'improving' : 'steady'}. Ready to build habit goals?`
      : 'Review your weekly patterns and set AI-assisted screen time targets.';
    primaryPrompt = 'Summarize my digital wellness habits and suggest weekly goals';
    secondaryPrompt = 'How can I build better evening phone habits?';
    secondaryLabel = 'Weekly review';
  }

  return (
    <Card
      style={[
        styles.card,
        {
          borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(168, 85, 247, 0.25)',
          backgroundColor: isDark ? 'rgba(23, 14, 40, 0.55)' : 'rgba(245, 240, 255, 0.7)',
        },
        style,
      ]}
      padding="base"
      variant="highlight"
    >
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badgeWrapper}>
          <View style={[styles.sparkleCircle, { backgroundColor: 'rgba(168, 85, 247, 0.18)' }]}>
            <Sparkles size={13} color={theme.accent.violet} />
          </View>
          <Text
            style={[
              styles.badgeText,
              { color: theme.accent.violet, fontFamily: typography.fonts.uiSemiBold },
            ]}
          >
            HOURLY AI • GEMINI
          </Text>
        </View>

        {/* Day-on-day badge */}
        <View style={[styles.dayOnDayChip, { backgroundColor: `${deltaColor}15` }]}>
          <DeltaIcon size={11} color={deltaColor} />
          <Text style={[styles.dayOnDayText, { color: deltaColor, fontFamily: typography.fonts.uiMedium }]}>
            {effectiveDeltaDirection === 'down' ? '-' : '+'}
            {Math.abs(effectiveDeltaMinutes)}m DoD
          </Text>
        </View>
      </View>

      {/* Main Suggestion Text */}
      <Text
        style={[
          styles.titleText,
          { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.bodyText,
          { color: theme.text.secondary, fontFamily: typography.fonts.uiRegular },
        ]}
      >
        {body}
      </Text>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => handleAskAi(primaryPrompt)}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.accent.violet },
            pressed && { opacity: 0.85 },
          ]}
        >
          <MessageCircle size={13} color="#FFFFFF" />
          <Text style={[styles.primaryButtonText, { fontFamily: typography.fonts.uiSemiBold }]}>
            Ask AI Coach
          </Text>
          <ArrowRight size={12} color="#FFFFFF" />
        </Pressable>

        {!compact && (
          <Pressable
            onPress={() => handleAskAi(secondaryPrompt)}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: theme.border.glass,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: theme.text.secondary, fontFamily: typography.fonts.uiMedium },
              ]}
              numberOfLines={1}
            >
              {secondaryLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.borderRadius.card,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.8,
    includeFontPadding: false,
  },
  dayOnDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dayOnDayText: {
    fontSize: 10,
    includeFontPadding: false,
  },
  titleText: {
    fontSize: typography.scale.sm,
    marginBottom: 4,
    includeFontPadding: false,
  },
  bodyText: {
    fontSize: typography.scale.xs,
    lineHeight: 18,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: layout.borderRadius.pill,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    includeFontPadding: false,
  },
  secondaryButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 11,
    includeFontPadding: false,
  },
});
