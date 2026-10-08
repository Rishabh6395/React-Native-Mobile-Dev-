/**
 * CategoryDonut — Animated SVG donut chart for category breakdown
 * Spec Reference: Section 9.4 (Stats screen)
 *
 * Shows a donut/ring chart with colored segments for each usage category.
 * Features: animated draw-in, center stats, and a compact legend.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, layout } from '../../theme/tokens';
import { CategoryAggregate, formatMs } from '../../features/usage/usageAggregation';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CategoryDonutProps {
  /** Category data to display */
  data: CategoryAggregate[];
  /** Diameter of the donut */
  size?: number;
  /** Thickness of the ring */
  strokeWidth?: number;
  /** Show legend below */
  showLegend?: boolean;
  /** Total time to display in center */
  totalMs?: number;
  /** Center label */
  centerLabel?: string;
}

export const CategoryDonut: React.FC<CategoryDonutProps> = ({
  data,
  size = 160,
  strokeWidth = 20,
  showLegend = true,
  totalMs,
  centerLabel = 'total',
}) => {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const total = totalMs ?? data.reduce((sum, d) => sum + d.totalMs, 0);

  // Calculate segment angles
  const segments = React.useMemo(() => {
    if (total === 0) return [];

    let currentAngle = 0;
    return data
      .filter((d) => d.totalMs > 0)
      .map((d) => {
        const fraction = d.totalMs / total;
        const dashLength = fraction * circumference;
        const gapLength = circumference - dashLength;
        const rotation = currentAngle;
        currentAngle += fraction * 360;
        return {
          ...d,
          fraction,
          dashLength,
          gapLength,
          rotation,
        };
      });
  }, [data, total, circumference]);

  return (
    <View style={styles.container}>
      {/* Donut */}
      <View style={[styles.donutContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.card.elevated}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Category segments */}
          {segments.map((seg, idx) => (
            <AnimatedDonutSegment
              key={seg.category}
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={strokeWidth}
              color={seg.color}
              dashLength={seg.dashLength}
              gapLength={seg.gapLength}
              rotation={seg.rotation}
              index={idx}
              reducedMotion={reducedMotion ?? false}
            />
          ))}
        </Svg>

        {/* Center content */}
        <View style={[styles.centerContent, { width: size, height: size }]}>
          {total > 0 && (
            <>
              <Text
                style={[
                  styles.centerValue,
                  {
                    color: theme.text.primary,
                    fontFamily: typography.fonts.numbersBold,
                  },
                ]}
              >
                {formatMs(total)}
              </Text>
              <Text
                style={[
                  styles.centerLabel,
                  {
                    color: theme.text.tertiary,
                    fontFamily: typography.fonts.uiMedium,
                  },
                ]}
              >
                {centerLabel}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Legend */}
      {showLegend && segments.length > 0 && (
        <View style={styles.legend}>
          {segments.slice(0, 6).map((seg) => (
            <View key={seg.category} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: seg.color }]}
              />
              <Text
                style={[
                  styles.legendLabel,
                  {
                    color: theme.text.secondary,
                    fontFamily: typography.fonts.uiMedium,
                  },
                ]}
                numberOfLines={1}
              >
                {seg.category}
              </Text>
              <Text
                style={[
                  styles.legendValue,
                  {
                    color: theme.text.tertiary,
                    fontFamily: typography.fonts.numbersRegular,
                  },
                ]}
              >
                {formatMs(seg.totalMs)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Animated Segment ────────────────────────────────────────

interface AnimatedDonutSegmentProps {
  cx: number;
  cy: number;
  r: number;
  strokeWidth: number;
  color: string;
  dashLength: number;
  gapLength: number;
  rotation: number;
  index: number;
  reducedMotion: boolean;
}

const AnimatedDonutSegment: React.FC<AnimatedDonutSegmentProps> = React.memo(
  ({ cx, cy, r, strokeWidth, color, dashLength, gapLength, rotation, index, reducedMotion }) => {
    const progress = useSharedValue(0);

    React.useEffect(() => {
      if (reducedMotion) {
        progress.value = 1;
      } else {
        progress.value = withDelay(
          index * 80,
          withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
        );
      }
    }, [dashLength, reducedMotion]);

    const animatedProps = useAnimatedProps(() => ({
      strokeDashoffset: dashLength * (1 - progress.value),
    }));

    return (
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${dashLength} ${gapLength}`}
        strokeLinecap="round"
        transform={`rotate(${rotation - 90} ${cx} ${cy})`}
        animatedProps={animatedProps}
      />
    );
  }
);

AnimatedDonutSegment.displayName = 'AnimatedDonutSegment';

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  donutContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: typography.scale.lg,
    includeFontPadding: false,
  },
  centerLabel: {
    fontSize: typography.scale.xs,
    marginTop: 2,
    includeFontPadding: false,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.base,
    paddingHorizontal: spacing.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
    maxWidth: 70,
  },
  legendValue: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
});
