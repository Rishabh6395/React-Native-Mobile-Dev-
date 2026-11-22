/**
 * CategoryBars — Horizontal glass bar breakdown for categories
 * Replaces the donut chart with a modern, readable horizontal bar layout.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { springConfig } from '../../theme/motion';
import { spacing, typography, layout } from '../../theme/tokens';
import { CategoryAggregate, formatMs } from '../../features/usage/usageAggregation';

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
}

export const CategoryBars: React.FC<CategoryBarsProps> = ({ data, totalMs }) => {
  const { theme } = useTheme();
  const total = totalMs ?? data.reduce((sum, d) => sum + d.totalMs, 0);

  const sorted = [...data]
    .filter((d) => d.totalMs > 0)
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 6);

  if (sorted.length === 0) return null;

  return (
    <View style={styles.container}>
      {sorted.map((cat, idx) => (
        <CategoryBarItem
          key={cat.category}
          category={cat}
          total={total}
          index={idx}
          theme={theme}
        />
      ))}
    </View>
  );
};

interface CategoryBarItemProps {
  category: CategoryAggregate;
  total: number;
  index: number;
  theme: any;
}

const CategoryBarItem: React.FC<CategoryBarItemProps> = React.memo(
  ({ category, total, index, theme }) => {
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
          index * 60,
          withSpring(target, springConfig.gentle),
        );
      }
    }, [fraction, reducedMotion]);

    const animatedBarStyle = useAnimatedStyle(() => ({
      width: `${progress.value * 100}%` as any,
    }));

    return (
      <View
        style={[
          styles.barItem,
          {
            backgroundColor: theme.card.base,
            borderColor: theme.border.glass,
          },
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
            <Text
              style={[
                styles.barCategoryName,
                { color: theme.text.primary, fontFamily: typography.fonts.uiMedium },
              ]}
              numberOfLines={1}
            >
              {category.category}
            </Text>
          </View>
          <View style={styles.barItemRight}>
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
        </View>
        {/* Progress bar */}
        <View
          style={[
            styles.barTrack,
            { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
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
  barItemRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  barTime: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  barPct: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
    minWidth: 30,
    textAlign: 'right',
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
});
