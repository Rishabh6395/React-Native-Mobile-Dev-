/**
 * CategoryBars — Horizontal glass bar breakdown for categories
 * Features:
 * - Animated horizontal progress bars with category color
 * - Interactive drill-down: click any category to see apps used in it
 * - App icons, per-app screen time, percentage of category, and session counts
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  Smartphone,
  Film,
  Gamepad2,
  MessageCircle,
  Music,
  Globe,
  Briefcase,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { springConfig, triggerHaptic } from '../../theme/motion';
import { spacing, typography, layout } from '../../theme/tokens';
import { CategoryAggregate, formatMs } from '../../features/usage/usageAggregation';
import { AppUsage } from '../../../modules/usage-stats';
import { AppIcon } from '../ui/AppIcon';

const CATEGORY_ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  Social: MessageCircle,
  Video: Film,
  Games: Gamepad2,
  Communication: MessageCircle,
  Music: Music,
  Productivity: Briefcase,
  Browser: Globe,
  Other: MoreHorizontal,
};

export interface CategoryBarsProps {
  data: CategoryAggregate[];
  totalMs?: number;
  apps?: AppUsage[];
  onAppPress?: (app: AppUsage) => void;
}

export const CategoryBars: React.FC<CategoryBarsProps> = ({
  data,
  totalMs,
  apps = [],
  onAppPress,
}) => {
  const { theme } = useTheme();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const total = totalMs ?? data.reduce((sum, d) => sum + d.totalMs, 0);

  const sorted = [...data]
    .filter((d) => d.totalMs > 0)
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 8);

  if (sorted.length === 0) return null;

  const handleToggle = (catName: string) => {
    triggerHaptic.selection();
    setExpandedCategory((prev) => (prev === catName ? null : catName));
  };

  return (
    <View style={styles.container}>
      {sorted.map((cat, idx) => {
        const isExpanded = expandedCategory === cat.category;
        const categoryApps = apps
          .filter((a) => a.category === cat.category && a.foregroundMs > 0)
          .sort((a, b) => b.foregroundMs - a.foregroundMs);

        return (
          <CategoryBarItem
            key={cat.category}
            category={cat}
            total={total}
            index={idx}
            theme={theme}
            isExpanded={isExpanded}
            categoryApps={categoryApps}
            onToggle={() => handleToggle(cat.category)}
            onAppPress={onAppPress}
          />
        );
      })}
    </View>
  );
};

interface CategoryBarItemProps {
  category: CategoryAggregate;
  total: number;
  index: number;
  theme: any;
  isExpanded: boolean;
  categoryApps: AppUsage[];
  onToggle: () => void;
  onAppPress?: (app: AppUsage) => void;
}

const CategoryBarItem: React.FC<CategoryBarItemProps> = React.memo(
  ({
    category,
    total,
    index,
    theme,
    isExpanded,
    categoryApps,
    onToggle,
    onAppPress,
  }) => {
    const reducedMotion = useReducedMotion();
    const progress = useSharedValue(0);
    const fraction = total > 0 ? category.totalMs / total : 0;
    const percentage = Math.round(fraction * 100);

    const IconComponent = CATEGORY_ICONS[category.category] || Smartphone;

    React.useEffect(() => {
      const target = Math.max(fraction, 0.02);
      if (reducedMotion) {
        progress.value = target;
      } else {
        progress.value = withDelay(
          index * 50,
          withSpring(target, springConfig.gentle),
        );
      }
    }, [fraction, reducedMotion]);

    const animatedBarStyle = useAnimatedStyle(() => ({
      width: `${Math.min(100, Math.max(0, progress.value * 100))}%` as any,
    }));

    return (
      <View
        style={[
          styles.barItem,
          {
            backgroundColor: theme.card.base,
            borderColor: isExpanded ? `${category.color}60` : theme.border.glass,
          },
        ]}
      >
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [
            styles.pressableHeader,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={styles.barItemHeader}>
            <View style={styles.barItemLeft}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${category.color}20` },
                ]}
              >
                <IconComponent size={14} color={category.color} />
              </View>
              <View>
                <Text
                  style={[
                    styles.barCategoryName,
                    { color: theme.text.primary, fontFamily: typography.fonts.uiMedium },
                  ]}
                  numberOfLines={1}
                >
                  {category.category}
                </Text>
                {categoryApps.length > 0 && (
                  <Text
                    style={[
                      styles.barSubCount,
                      { color: theme.text.tertiary, fontFamily: typography.fonts.uiRegular },
                    ]}
                  >
                    {categoryApps.length} {categoryApps.length === 1 ? 'app' : 'apps'} • tap to {isExpanded ? 'hide' : 'view'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.barItemRight}>
              <View style={styles.timeWrapper}>
                <Text
                  style={[
                    styles.barTime,
                    { color: theme.text.primary, fontFamily: typography.fonts.numbersBold },
                  ]}
                >
                  {formatMs(category.totalMs)}
                </Text>
                <Text
                  style={[
                    styles.barPct,
                    { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium },
                  ]}
                >
                  {percentage}%
                </Text>
              </View>
              {isExpanded ? (
                <ChevronUp size={16} color={category.color} />
              ) : (
                <ChevronDown size={16} color={theme.text.tertiary} />
              )}
            </View>
          </View>

          {/* Progress bar */}
          <View
            style={[
              styles.barTrack,
              { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            ]}
          >
            <Animated.View
              style={[
                styles.barFill,
                { backgroundColor: category.color },
                animatedBarStyle,
              ]}
            />
          </View>
        </Pressable>

        {/* Drill-down list of apps in this category */}
        {isExpanded && (
          <View
            style={[
              styles.drilldownContainer,
              {
                borderTopColor: theme.border.subtle,
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              },
            ]}
          >
            {categoryApps.length === 0 ? (
              <Text
                style={[
                  styles.emptySubText,
                  { color: theme.text.tertiary, fontFamily: typography.fonts.uiRegular },
                ]}
              >
                No specific app data recorded for this period.
              </Text>
            ) : (
              categoryApps.map((app, appIdx) => {
                const appFraction = category.totalMs > 0 ? app.foregroundMs / category.totalMs : 0;
                const appPct = Math.round(appFraction * 100);

                return (
                  <Pressable
                    key={app.packageName}
                    onPress={() => onAppPress?.(app)}
                    style={({ pressed }) => [
                      styles.appRow,
                      appIdx < categoryApps.length - 1 && styles.appRowBorder,
                      { borderBottomColor: theme.border.subtle },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <AppIcon
                      packageName={app.packageName}
                      appName={app.appName}
                      size={28}
                    />
                    <View style={styles.appRowCenter}>
                      <View style={styles.appNameRow}>
                        <Text
                          style={[
                            styles.subAppName,
                            { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold },
                          ]}
                          numberOfLines={1}
                        >
                          {app.appName}
                        </Text>
                        <Text
                          style={[
                            styles.subAppPct,
                            { color: category.color, fontFamily: typography.fonts.numbersBold },
                          ]}
                        >
                          {appPct}%
                        </Text>
                      </View>

                      {/* Mini app usage bar */}
                      <View
                        style={[
                          styles.subAppTrack,
                          { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                        ]}
                      >
                        <View
                          style={[
                            styles.subAppFill,
                            {
                              backgroundColor: category.color,
                              width: `${Math.min(100, Math.max(2, appPct))}%`,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.subAppDetailsRow}>
                        <Text
                          style={[
                            styles.subAppDetailText,
                            { color: theme.text.secondary, fontFamily: typography.fonts.numbersBold },
                          ]}
                        >
                          {formatMs(app.foregroundMs)}
                        </Text>
                        {app.sessions > 0 && (
                          <Text
                            style={[
                              styles.subAppDetailSub,
                              { color: theme.text.tertiary, fontFamily: typography.fonts.uiRegular },
                            ]}
                          >
                            • {app.sessions} {app.sessions === 1 ? 'session' : 'sessions'}
                          </Text>
                        )}
                        {app.launches > 0 && app.sessions === 0 && (
                          <Text
                            style={[
                              styles.subAppDetailSub,
                              { color: theme.text.tertiary, fontFamily: typography.fonts.uiRegular },
                            ]}
                          >
                            • {app.launches} opens
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </View>
    );
  },
);

CategoryBarItem.displayName = 'CategoryBarItem';

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  barItem: {
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressableHeader: {
    padding: spacing.md,
  },
  barItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  barItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barCategoryName: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  barSubCount: {
    fontSize: 10,
    marginTop: 2,
    includeFontPadding: false,
  },
  barItemRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeWrapper: {
    alignItems: 'flex-end',
  },
  barTime: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  barPct: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  barTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  barFill: {
    height: 5,
    borderRadius: 2.5,
  },
  drilldownContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  emptySubText: {
    fontSize: typography.scale.xs,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  appRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appRowCenter: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subAppName: {
    fontSize: typography.scale.xs,
    flex: 1,
    marginRight: spacing.xs,
    includeFontPadding: false,
  },
  subAppPct: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  subAppTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  subAppFill: {
    height: 3,
    borderRadius: 1.5,
  },
  subAppDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subAppDetailText: {
    fontSize: 11,
    includeFontPadding: false,
  },
  subAppDetailSub: {
    fontSize: 10,
    includeFontPadding: false,
  },
});
