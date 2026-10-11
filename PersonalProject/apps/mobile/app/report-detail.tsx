import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MessageSquare, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../src/theme/ThemeContext';
import { Screen, Header, Pill, Card } from '../src/components/ui';
import { ReportCard, ReportActionCard } from '../src/components/cards/ReportCard';
import { useReportsHistory, FALLBACK_WEEKLY_REPORT } from '../src/features/reports/useReports';
import { ReportSection, ReportAction } from 'shared';
import { spacing, typography, layout } from '../src/theme/tokens';
import { triggerHaptic } from '../src/theme/motion';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();

  const { data: reports } = useReportsHistory();
  const report = reports?.find((r) => r.id === id) || reports?.[0] || FALLBACK_WEEKLY_REPORT;

  if (!report) {
    return (
      <Screen header={<Header title="Report Detail" onBack={() => router.back()} />}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: theme.text.primary }]}>
            Report not found.
          </Text>
        </View>
      </Screen>
    );
  }

  const { payload } = report;

  const scoreBadgeColor =
    payload.scoreLabel === 'light'
      ? theme.semantic.good
      : payload.scoreLabel === 'balanced'
      ? theme.accent.aqua
      : theme.semantic.nudge;

  const handlePromptPress = (prompt: string) => {
    triggerHaptic.selection();
    // Route to coach tab with prefilled question
    router.push({
      pathname: '/(tabs)/coach',
      params: { initialPrompt: prompt },
    } as any);
  };

  return (
    <Screen header={<Header title={`${report.type} Report`} onBack={() => router.back()} />} scrollable>
      <View style={styles.container}>
        {/* Score Label & Period badge */}
        <View style={styles.tagRow}>
          <Pill
            label={payload.scoreLabel ? payload.scoreLabel.toUpperCase() : 'BALANCED'}
            size="sm"
            style={{
              backgroundColor: scoreBadgeColor + '20',
              borderColor: scoreBadgeColor + '60',
            }}
          />
          <Text style={[styles.periodDateText, { color: theme.text.tertiary }]}>
            {new Date(report.periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {' – '}
            {new Date(report.periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Headline */}
        <Text
          style={[
            styles.headline,
            { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold },
          ]}
        >
          {payload.headline}
        </Text>

        {/* Key Metrics Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.text.primary, fontFamily: typography.fonts.numbersBold }]}>
              {Math.floor(payload.totalMinutes / 60)}h {payload.totalMinutes % 60}m
            </Text>
            <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>Total Screen Time</Text>
          </Card>

          <Card style={styles.statBox}>
            <View style={styles.deltaValueRow}>
              {payload.deltaPct < 0 ? (
                <TrendingDown size={18} color={theme.semantic.good} />
              ) : (
                <TrendingUp size={18} color={theme.semantic.alert} />
              )}
              <Text
                style={[
                  styles.statValue,
                  {
                    color: payload.deltaPct < 0 ? theme.semantic.good : theme.semantic.alert,
                    fontFamily: typography.fonts.numbersBold,
                    marginLeft: 4,
                  },
                ]}
              >
                {payload.deltaPct > 0 ? '+' : ''}
                {payload.deltaPct}%
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: theme.text.tertiary }]}>vs Previous Period</Text>
          </Card>
        </View>

        {/* Section Cards */}
        <Text style={[styles.sectionHeading, { color: theme.text.primary }]}>
          Structured Insights
        </Text>
        {payload.sections?.map((section: ReportSection, index: number) => (
          <ReportCard key={`section-${index}`} section={section} />
        ))}

        {/* Actions / Add as Goal Section */}
        {payload.actions && payload.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            <Text style={[styles.sectionHeading, { color: theme.text.primary }]}>
              Recommended Habits
            </Text>
            {payload.actions.map((action: ReportAction, index: number) => (
              <ReportActionCard key={`action-${index}`} action={action} />
            ))}
          </View>
        )}

        {/* Follow-up Prompts Section */}
        {payload.followUpPrompts && payload.followUpPrompts.length > 0 && (
          <View style={styles.promptsContainer}>
            <View style={styles.promptHeaderRow}>
              <MessageSquare size={16} color={theme.accent.violet} />
              <Text style={[styles.promptsHeading, { color: theme.text.primary }]}>
                Ask Your Coach
              </Text>
            </View>

            <View style={styles.chipsWrap}>
              {payload.followUpPrompts.map((prompt: string, index: number) => (
                <Pressable
                  key={`prompt-${index}`}
                  style={[
                    styles.promptChip,
                    {
                      backgroundColor: theme.card.base,
                      borderColor: theme.border.subtle,
                    },
                  ]}
                  onPress={() => handlePromptPress(prompt)}
                >
                  <Text style={[styles.promptChipText, { color: theme.text.secondary }]}>
                    {prompt}
                  </Text>
                  <ArrowRight size={12} color={theme.text.tertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxl,
  },
  notFoundContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: typography.scale.base,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  periodDateText: {
    fontSize: typography.scale.xs,
  },
  headline: {
    fontSize: typography.scale.xl,
    lineHeight: typography.lineHeight.xl + 4,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    padding: spacing.base,
    borderRadius: layout.borderRadius.card,
    alignItems: 'center',
  },
  deltaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.scale.lg,
  },
  statLabel: {
    fontSize: typography.scale.xs,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: typography.scale.base,
    fontFamily: typography.fonts.uiSemiBold,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  actionsContainer: {
    marginTop: spacing.md,
  },
  promptsContainer: {
    marginTop: spacing.lg,
  },
  promptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  promptsHeading: {
    fontSize: typography.scale.base,
    fontFamily: typography.fonts.uiSemiBold,
  },
  chipsWrap: {
    gap: spacing.xs,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: typography.scale.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
});
