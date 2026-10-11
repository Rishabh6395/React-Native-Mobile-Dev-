import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Sparkles,
  Moon,
  AlertCircle,
  Info,
  CheckCircle2,
  Target,
} from 'lucide-react-native';
import { ReportSection, ReportAction } from 'shared';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../ui/Card';
import { GlowCard } from '../ui/GlowCard';
import { Pill } from '../ui/Pill';
import { AppIcon } from '../ui/AppIcon';
import { triggerHaptic } from '../../theme/motion';
import { spacing, typography, layout } from '../../theme/tokens';

interface ReportCardProps {
  section: ReportSection;
}

export const ReportCard: React.FC<ReportCardProps> = ({ section }) => {
  const { theme } = useTheme();

  switch (section.kind) {
    case 'breakdown':
      return (
        <Card style={styles.cardContainer}>
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: theme.accent.violet + '20' }]}>
              <Target size={16} color={theme.accent.violet} />
            </View>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              Usage Breakdown
            </Text>
          </View>

          <View style={styles.breakdownList}>
            {section.items.map((item, i) => (
              <View key={i} style={styles.breakdownRow}>
                <View style={styles.appInfo}>
                  <AppIcon packageName={item.app.toLowerCase().replace(/\s+/g, '.')} size={32} />
                  <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                    <Text style={[styles.appName, { color: theme.text.primary }]}>
                      {item.app}
                    </Text>
                    {item.note && (
                      <Text style={[styles.appNote, { color: theme.text.tertiary }]}>
                        {item.note}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.timeText, { color: theme.accent.aqua, fontFamily: typography.fonts.numbersBold }]}>
                  {Math.floor(item.minutes / 60)}h {item.minutes % 60}m
                </Text>
              </View>
            ))}
          </View>
        </Card>
      );

    case 'insight': {
      const severityColor =
        section.severity === 'alert'
          ? theme.semantic.alert
          : section.severity === 'nudge'
          ? theme.semantic.nudge
          : theme.accent.violet;

      return (
        <GlowCard
          style={[styles.cardContainer, { borderColor: severityColor + '40', borderWidth: 1 }]}
          padding="base"
        >
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: severityColor + '20' }]}>
              {section.severity === 'alert' ? (
                <AlertCircle size={16} color={severityColor} />
              ) : section.severity === 'nudge' ? (
                <Info size={16} color={severityColor} />
              ) : (
                <Sparkles size={16} color={severityColor} />
              )}
            </View>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              {section.title}
            </Text>
          </View>
          <Text style={[styles.bodyText, { color: theme.text.secondary }]}>
            {section.body}
          </Text>
        </GlowCard>
      );
    }

    case 'pattern':
      return (
        <Card style={styles.cardContainer}>
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: theme.accent.violet + '20' }]}>
              <Moon size={16} color={theme.accent.violet} />
            </View>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              {section.title}
            </Text>
          </View>
          <Text style={[styles.bodyText, { color: theme.text.secondary }]}>
            {section.body}
          </Text>
        </Card>
      );

    case 'win':
      return (
        <Card
          style={[
            styles.cardContainer,
            { borderColor: theme.semantic.good + '40', borderWidth: 1 },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: theme.semantic.good + '20' }]}>
              <CheckCircle2 size={16} color={theme.semantic.good} />
            </View>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              {section.title}
            </Text>
          </View>
          <Text style={[styles.bodyText, { color: theme.text.secondary }]}>
            {section.body}
          </Text>
        </Card>
      );

    default:
      return null;
  }
};

interface ReportActionCardProps {
  action: ReportAction;
  onAddGoal?: (action: ReportAction) => void;
}

export const ReportActionCard: React.FC<ReportActionCardProps> = ({ action, onAddGoal }) => {
  const { theme } = useTheme();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    triggerHaptic.selection();
    setAdded(true);
    if (onAddGoal) {
      onAddGoal(action);
    }
  };

  const effortColor =
    action.effort === 'tiny'
      ? theme.semantic.good
      : action.effort === 'small'
      ? theme.accent.aqua
      : theme.semantic.nudge;

  return (
    <Card style={styles.actionCard}>
      <View style={styles.actionTopRow}>
        <View style={styles.actionTitleArea}>
          <Text style={[styles.actionTitle, { color: theme.text.primary }]}>
            {action.title}
          </Text>
          <Text style={[styles.actionWhy, { color: theme.text.secondary }]}>
            {action.why}
          </Text>
        </View>
        <Pill
          label={`${action.effort.toUpperCase()}`}
          size="sm"
          style={{ backgroundColor: effortColor + '20', borderColor: effortColor + '50' }}
        />
      </View>

      <View style={styles.actionBottomRow}>
        <Pressable
          style={[
            styles.addGoalBtn,
            {
              backgroundColor: added ? theme.semantic.good + '25' : theme.accent.violet + '25',
              borderColor: added ? theme.semantic.good : theme.accent.violet,
            },
          ]}
          onPress={handleAdd}
          disabled={added}
        >
          {added ? (
            <>
              <CheckCircle2 size={14} color={theme.semantic.good} />
              <Text style={[styles.addGoalBtnText, { color: theme.semantic.good }]}>
                Goal Added
              </Text>
            </>
          ) : (
            <>
              <Target size={14} color={theme.accent.violet} />
              <Text style={[styles.addGoalBtnText, { color: theme.accent.violet }]}>
                Add this as a goal
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: spacing.base,
    marginBottom: spacing.base,
    borderRadius: layout.borderRadius.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.scale.base,
    fontFamily: typography.fonts.uiSemiBold,
    flex: 1,
  },
  bodyText: {
    fontSize: typography.scale.sm,
    lineHeight: typography.lineHeight.sm + 4,
    fontFamily: typography.fonts.uiRegular,
  },
  breakdownList: {
    marginTop: spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appName: {
    fontSize: typography.scale.sm,
    fontFamily: typography.fonts.uiMedium,
  },
  appNote: {
    fontSize: typography.scale.xs,
    fontFamily: typography.fonts.uiRegular,
    marginTop: 2,
  },
  timeText: {
    fontSize: typography.scale.sm,
  },
  actionCard: {
    padding: spacing.base,
    marginBottom: spacing.md,
    borderRadius: layout.borderRadius.card,
  },
  actionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  actionTitleArea: {
    flex: 1,
    marginRight: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.scale.sm,
    fontFamily: typography.fonts.uiSemiBold,
    marginBottom: 4,
  },
  actionWhy: {
    fontSize: typography.scale.xs,
    fontFamily: typography.fonts.uiRegular,
    lineHeight: typography.lineHeight.xs + 3,
  },
  actionBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  addGoalBtnText: {
    fontSize: typography.scale.xs,
    fontFamily: typography.fonts.uiSemiBold,
  },
});
