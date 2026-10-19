import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, ArrowRight, Check, Zap, Target, Clock, ShieldCheck } from 'lucide-react-native';
import { StructuredCoachCard } from './coachEngine';
import { useTheme } from '../../theme/ThemeContext';
import { typography, spacing, layout } from '../../theme/tokens';
import { Card, Pill, Button } from '../../components/ui';
import { triggerHaptic } from '../../theme/motion';

interface CoachCardProps {
  card: StructuredCoachCard;
  onGoalAdded?: (packageName?: string, minutes?: number) => void;
}

export const CoachCard: React.FC<CoachCardProps> = ({ card, onGoalAdded }) => {
  const { theme } = useTheme();
  const [goalAdded, setGoalAdded] = useState(false);

  // ── 1. Breakdown Card ──────────────────────────────────────────
  if (card.type === 'breakdown') {
    return (
      <Card style={styles.card} padding="base">
        <View style={styles.headerRow}>
          <View style={styles.titleWithIcon}>
            <Clock size={16} color={theme.accent.aqua} />
            <Text style={[styles.cardTitle, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
              {card.title}
            </Text>
          </View>
          {card.badge && (
            <Pill
              label={card.badge}
              size="sm"
              style={{
                backgroundColor: theme.accent.violet + '25',
                borderColor: theme.accent.violet + '60',
              }}
            />
          )}
        </View>

        {card.subtitle && (
          <Text style={[styles.cardSubtitle, { color: theme.text.secondary }]}>
            {card.subtitle}
          </Text>
        )}

        <View style={styles.itemsContainer}>
          {card.items?.map((item, idx) => (
            <View key={idx} style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <Text style={[styles.itemLabel, { color: theme.text.primary }]}>{item.label}</Text>
                <Text style={[styles.itemValue, { color: theme.accent.aqua, fontFamily: typography.fonts.numbersBold }]}>
                  {item.value}
                </Text>
              </View>
              {typeof item.percent === 'number' && (
                <View style={[styles.progressBarTrack, { backgroundColor: theme.card.highlight }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.max(6, item.percent)}%`,
                        backgroundColor: idx === 0 ? theme.accent.violet : idx === 1 ? theme.accent.aqua : theme.text.tertiary,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      </Card>
    );
  }

  // ── 2. Swap Suggestion Card ────────────────────────────────────
  if (card.type === 'swap') {
    const swap = card.swapSuggestion;
    return (
      <Card style={[styles.card, { borderColor: theme.accent.violet + '40' }]} padding="base">
        <View style={styles.headerRow}>
          <View style={styles.titleWithIcon}>
            <Zap size={16} color={theme.accent.violet} />
            <Text style={[styles.cardTitle, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
              {card.title}
            </Text>
          </View>
          <Pill
            label={card.badge || 'Recommended Swap'}
            size="sm"
            style={{
              backgroundColor: theme.accent.violet + '20',
              borderColor: theme.accent.violet + '60',
            }}
          />
        </View>

        {swap && (
          <View style={styles.swapBox}>
            <View style={styles.swapVisualRow}>
              <View style={[styles.swapPill, { backgroundColor: theme.card.highlight }]}>
                <Text style={[styles.swapLabel, { color: theme.text.secondary }]}>Replace</Text>
                <Text style={[styles.swapAppName, { color: theme.semantic.alert }]}>{swap.fromApp}</Text>
              </View>

              <View style={styles.arrowCircle}>
                <ArrowRight size={14} color={theme.text.primary} />
              </View>

              <View style={[styles.swapPill, { backgroundColor: theme.card.highlight, borderColor: theme.accent.aqua + '50' }]}>
                <Text style={[styles.swapLabel, { color: theme.text.secondary }]}>With</Text>
                <Text style={[styles.swapAppName, { color: theme.accent.aqua }]}>{swap.durationMinutes}m Intentional</Text>
              </View>
            </View>

            <View style={[styles.swapTargetCard, { backgroundColor: theme.card.highlight }]}>
              <Text style={[styles.swapTargetTitle, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
                🎯 {swap.toActivity}
              </Text>
              <Text style={[styles.swapTargetBenefit, { color: theme.text.secondary }]}>
                {swap.benefit}
              </Text>
            </View>
          </View>
        )}
      </Card>
    );
  }

  // ── 3. Reduction Plan Card ─────────────────────────────────────
  if (card.type === 'reductionPlan') {
    const plan = card.reductionPlan;
    return (
      <Card style={styles.card} padding="base">
        <View style={styles.headerRow}>
          <View style={styles.titleWithIcon}>
            <Target size={16} color={theme.accent.aqua} />
            <Text style={[styles.cardTitle, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
              {card.title}
            </Text>
          </View>
          <Pill
            label={card.badge || 'Gradual Plan'}
            size="sm"
            style={{
              backgroundColor: theme.accent.aqua + '20',
              borderColor: theme.accent.aqua + '60',
            }}
          />
        </View>

        {card.subtitle && (
          <Text style={[styles.cardSubtitle, { color: theme.text.secondary }]}>
            {card.subtitle}
          </Text>
        )}

        {plan && (
          <View style={styles.stepsContainer}>
            {plan.steps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={[styles.stepNumberBadge, { backgroundColor: theme.accent.violet }]}>
                  <Text style={styles.stepNumberText}>{step.week}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTarget, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
                    Week {step.week}: Target {step.target}
                  </Text>
                  <Text style={[styles.stepNote, { color: theme.text.secondary }]}>
                    {step.note}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>
    );
  }

  // ── 4. Goal Action Card ────────────────────────────────────────
  if (card.type === 'goalAction') {
    const ga = card.goalAction;
    return (
      <Card style={[styles.card, { borderColor: theme.accent.aqua + '40' }]} padding="base">
        <View style={styles.headerRow}>
          <View style={styles.titleWithIcon}>
            <Target size={16} color={theme.accent.aqua} />
            <Text style={[styles.cardTitle, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
              {card.title}
            </Text>
          </View>
          <Pill label="Action" size="sm" active />
        </View>

        {card.subtitle && (
          <Text style={[styles.cardSubtitle, { color: theme.text.secondary }]}>
            {card.subtitle}
          </Text>
        )}

        <View style={styles.goalButtonContainer}>
          <Button
            title={goalAdded ? 'Goal Added to Schedule ✓' : `Set ${ga?.appName || 'Limit'} Goal`}
            variant={goalAdded ? 'secondary' : 'primary'}
            size="md"
            fullWidth
            icon={goalAdded ? <Check size={16} color={theme.semantic.good} /> : <Target size={16} color="#FFFFFF" />}
            onPress={() => {
              if (!goalAdded) {
                triggerHaptic.success();
                setGoalAdded(true);
                onGoalAdded?.(ga?.packageName, ga?.dailyLimitMinutes);
              }
            }}
          />
        </View>
      </Card>
    );
  }

  // ── 5. Standard Insight Card ───────────────────────────────────
  return (
    <Card style={styles.card} padding="base">
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Sparkles size={16} color={theme.accent.violet} />
          <Text style={[styles.cardTitle, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
            {card.title}
          </Text>
        </View>
        {card.badge && (
          <Pill
            label={card.badge}
            size="sm"
            style={{
              backgroundColor: theme.accent.violet + '20',
              borderColor: theme.accent.violet + '50',
            }}
          />
        )}
      </View>

      {card.subtitle && (
        <Text style={[styles.cardSubtitle, { color: theme.text.secondary }]}>
          {card.subtitle}
        </Text>
      )}

      {card.items && card.items.length > 0 && (
        <View style={styles.insightItems}>
          {card.items.map((item, idx) => (
            <View key={idx} style={styles.insightItemRow}>
              <View style={[styles.bulletPoint, { backgroundColor: theme.accent.aqua }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.insightItemLabel, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
                  {item.label}
                </Text>
                <Text style={[styles.insightItemValue, { color: theme.text.secondary }]}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: layout.borderRadius.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.scale.sm,
  },
  cardSubtitle: {
    fontSize: typography.scale.xs,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  itemsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  breakdownRow: {
    gap: 4,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: typography.scale.xs,
  },
  itemValue: {
    fontSize: typography.scale.xs,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  swapBox: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  swapVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  swapPill: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  swapLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  swapAppName: {
    fontSize: typography.scale.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapTargetCard: {
    padding: spacing.sm,
    borderRadius: layout.borderRadius.sm,
    gap: 4,
  },
  swapTargetTitle: {
    fontSize: typography.scale.xs,
  },
  swapTargetBenefit: {
    fontSize: typography.scale.xs,
    lineHeight: 16,
  },
  stepsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTarget: {
    fontSize: typography.scale.xs,
  },
  stepNote: {
    fontSize: 11,
    lineHeight: 16,
  },
  goalButtonContainer: {
    marginTop: spacing.sm,
  },
  insightItems: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  insightItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  insightItemLabel: {
    fontSize: typography.scale.xs,
  },
  insightItemValue: {
    fontSize: 11,
    lineHeight: 16,
  },
});
