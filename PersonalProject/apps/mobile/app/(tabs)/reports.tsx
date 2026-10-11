import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import {
  FileText,
  Sparkles,
  Lock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  Screen,
  Header,
  EmptyState,
  Button,
  SegmentedControl,
  Pill,
  Card,
  Skeleton,
} from '../../src/components/ui';
import {
  useReports,
  useGenerateReport,
  AiReport,
} from '../../src/features/reports/useReports';
import { layout, spacing, typography } from '../../src/theme/tokens';
import { triggerHaptic } from '../../src/theme/motion';

type ReportPeriod = 'WEEKLY' | 'DAILY' | 'MONTHLY';

const REPORT_TABS = [
  { value: 'WEEKLY' as const, label: 'Weekly' },
  { value: 'DAILY' as const, label: 'Daily' },
  { value: 'MONTHLY' as const, label: 'Monthly' },
];

export default function ReportsScreen() {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<ReportPeriod>('WEEKLY');

  // Currently on Free tier by default
  const isFreePlan = true;
  const isLockedTab = isFreePlan && selectedTab !== 'WEEKLY';

  const periodStart = new Date();
  periodStart.setHours(0, 0, 0, 0);
  if (selectedTab === 'WEEKLY') {
    periodStart.setDate(periodStart.getDate() - periodStart.getDay());
  } else if (selectedTab === 'MONTHLY') {
    periodStart.setDate(1);
  }

  const { data: reports, isLoading } = useReports(selectedTab, periodStart.toISOString());
  const generate = useGenerateReport();

  const handleGenerate = () => {
    triggerHaptic.selection();
    const end = new Date(periodStart);
    if (selectedTab === 'WEEKLY') {
      end.setDate(end.getDate() + 7);
    } else if (selectedTab === 'DAILY') {
      end.setDate(end.getDate() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }

    generate.mutate({
      type: selectedTab,
      periodStart: periodStart.toISOString(),
      periodEnd: end.toISOString(),
    });
  };

  const handleOpenDetail = (reportId: string) => {
    triggerHaptic.selection();
    router.push(`/report-detail?id=${reportId}` as any);
  };

  return (
    <Screen
      scrollable
      header={<Header title="Reports" largeTitle />}
    >
      <View style={styles.container}>
        {/* Segmented Period Tabs */}
        <View style={styles.segmentedWrap}>
          <SegmentedControl
            options={REPORT_TABS}
            value={selectedTab}
            onChange={(tab) => {
              triggerHaptic.selection();
              setSelectedTab(tab);
            }}
          />
        </View>

        {/* Free Plan Lock Notice for Daily & Monthly */}
        {isLockedTab && (
          <Card
            style={[
              styles.paywallBanner,
              { borderColor: theme.accent.violet + '50', borderWidth: 1 },
            ]}
          >
            <View style={styles.paywallHeaderRow}>
              <View
                style={[
                  styles.lockBadge,
                  { backgroundColor: theme.accent.violet + '25' },
                ]}
              >
                <Lock size={16} color={theme.accent.violet} />
              </View>
              <Text
                style={[
                  styles.paywallTitle,
                  { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold },
                ]}
              >
                {selectedTab === 'DAILY' ? 'Daily Deep Dives' : 'Monthly Retrospectives'}
              </Text>
            </View>
            <Text style={[styles.paywallDescription, { color: theme.text.secondary }]}>
              {selectedTab === 'DAILY'
                ? 'Get morning breakdowns of yesterday’s screen time habits with actionable micro-nudges on Plus.'
                : 'Track month-over-month trend shifts and long-term digital wellness milestones on Plus.'}
            </Text>
            <Button
              title="Unlock with Plus"
              size="sm"
              variant="primary"
              onPress={() => {
                triggerHaptic.selection();
                // Opens paywall sheet
              }}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}

        {/* Loading Skeletons */}
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <Skeleton width="100%" height={140} borderRadius={layout.borderRadius.card} />
            <View style={{ height: spacing.base }} />
            <Skeleton width="100%" height={140} borderRadius={layout.borderRadius.card} />
          </View>
        ) : reports && reports.length > 0 ? (
          <View style={styles.reportsList}>
            {reports.map((report: AiReport) => {
              const deltaColor =
                report.payload.deltaPct < 0 ? theme.semantic.good : theme.semantic.alert;
              const scoreColor =
                report.payload.scoreLabel === 'light'
                  ? theme.semantic.good
                  : report.payload.scoreLabel === 'balanced'
                  ? theme.accent.aqua
                  : theme.semantic.nudge;

              return (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    styles.reportCard,
                    {
                      backgroundColor: theme.card.base,
                      borderColor: theme.border.subtle,
                    },
                  ]}
                  onPress={() => handleOpenDetail(report.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTopRow}>
                    <Pill
                      label={report.payload.scoreLabel.toUpperCase()}
                      size="sm"
                      style={{
                        backgroundColor: scoreColor + '20',
                        borderColor: scoreColor + '60',
                      }}
                    />
                    <Text style={[styles.cardDateText, { color: theme.text.tertiary }]}>
                      {new Date(report.periodStart).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.cardHeadline,
                      { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold },
                    ]}
                  >
                    {report.payload.headline}
                  </Text>

                  <View style={styles.cardBottomRow}>
                    <View style={styles.statChip}>
                      <Clock size={14} color={theme.text.tertiary} />
                      <Text
                        style={[
                          styles.cardMinutes,
                          {
                            color: theme.text.primary,
                            fontFamily: typography.fonts.numbersBold,
                          },
                        ]}
                      >
                        {Math.floor(report.payload.totalMinutes / 60)}h{' '}
                        {report.payload.totalMinutes % 60}m
                      </Text>
                    </View>

                    <View style={styles.statChip}>
                      {report.payload.deltaPct < 0 ? (
                        <TrendingDown size={14} color={deltaColor} />
                      ) : (
                        <TrendingUp size={14} color={deltaColor} />
                      )}
                      <Text
                        style={[
                          styles.cardDelta,
                          { color: deltaColor, fontFamily: typography.fonts.uiMedium },
                        ]}
                      >
                        {report.payload.deltaPct > 0 ? '+' : ''}
                        {report.payload.deltaPct}%
                      </Text>
                    </View>

                    <View style={{ flex: 1 }} />
                    <ArrowRight size={16} color={theme.text.tertiary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon={<FileText size={48} color={theme.accent.violet} />}
            title={`Your ${selectedTab.toLowerCase()} report is ready to generate`}
            description="Our AI coach analyzes your pre-aggregated phone usage to provide structured cards and gentle habit nudges."
            actionTitle={generate.isPending ? 'Generating...' : 'Generate AI Report'}
            onAction={handleGenerate}
          />
        )}

        {/* Generate / Refresh CTA Button */}
        {reports && reports.length > 0 && (
          <View style={styles.generateBtnContainer}>
            <Button
              title={generate.isPending ? 'Analyzing Usage...' : 'Generate Fresh Report'}
              onPress={handleGenerate}
              disabled={generate.isPending}
              variant="secondary"
              icon={<Sparkles size={18} color={theme.accent.violet} />}
            />
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
  segmentedWrap: {
    marginBottom: spacing.base,
  },
  paywallBanner: {
    padding: spacing.base,
    borderRadius: layout.borderRadius.card,
    marginBottom: spacing.base,
  },
  paywallHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallTitle: {
    fontSize: typography.scale.sm,
  },
  paywallDescription: {
    fontSize: typography.scale.xs,
    lineHeight: typography.lineHeight.xs + 3,
    marginBottom: spacing.xs,
  },
  skeletonContainer: {
    marginTop: spacing.base,
  },
  reportsList: {
    marginTop: spacing.xs,
    gap: spacing.base,
  },
  reportCard: {
    padding: spacing.base,
    borderRadius: layout.borderRadius.card,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardDateText: {
    fontSize: typography.scale.xs,
  },
  cardHeadline: {
    fontSize: typography.scale.base,
    lineHeight: typography.lineHeight.base,
    marginBottom: spacing.md,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMinutes: {
    fontSize: typography.scale.sm,
  },
  cardDelta: {
    fontSize: typography.scale.xs,
  },
  generateBtnContainer: {
    marginTop: spacing.xl,
  },
});
