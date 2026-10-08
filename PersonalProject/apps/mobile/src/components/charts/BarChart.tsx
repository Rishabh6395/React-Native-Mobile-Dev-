/**
 * BarChart — Animated, scrubbable bar chart
 * Spec Reference: Section 9.4 (Stats screen)
 *
 * Supports both hourly (24-bar day view) and daily (7/30-bar week/month view).
 * Features: animated bar entrance, scrub-to-inspect with haptics, gradient fill.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  useReducedMotion,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { useTheme } from '../../theme/ThemeContext';
import { springConfig, motionConstants, triggerHaptic } from '../../theme/motion';
import { spacing, typography, layout } from '../../theme/tokens';

export interface BarDataPoint {
  label: string;
  value: number; // milliseconds
  date?: string; // optional identifier
}

export interface BarChartProps {
  data: BarDataPoint[];
  /** Format the tooltip value */
  formatValue?: (ms: number) => string;
  /** Height of the chart area */
  height?: number;
  /** Called when a bar is scrubbed/tapped */
  onScrub?: (index: number, point: BarDataPoint) => void;
  /** Called when scrub ends */
  onScrubEnd?: () => void;
  /** Accent color for bars */
  barColor?: string;
  /** Show labels on x-axis */
  showLabels?: boolean;
  /** Maximum number of labels to show (evenly spaced) */
  maxLabels?: number;
}

const DEFAULT_FORMAT = (ms: number) => {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const BarChart: React.FC<BarChartProps> = ({
  data,
  formatValue = DEFAULT_FORMAT,
  height = 180,
  onScrub,
  onScrubEnd,
  barColor,
  showLabels = true,
  maxLabels = 7,
}) => {
  const { theme, isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lastHapticIndex = useSharedValue(-1);

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const color = barColor || theme.accent.violet;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const barWidth =
    containerWidth > 0 && data.length > 0
      ? (containerWidth - spacing.xs * (data.length - 1)) / data.length
      : 0;

  // Determine which labels to show
  const labelIndices = new Set<number>();
  if (showLabels && data.length > 0) {
    const step = Math.max(1, Math.ceil(data.length / maxLabels));
    for (let i = 0; i < data.length; i += step) {
      labelIndices.add(i);
    }
    // Always show last
    labelIndices.add(data.length - 1);
  }

  const handleScrubUpdate = useCallback(
    (index: number) => {
      if (index >= 0 && index < data.length) {
        setActiveIndex(index);
        onScrub?.(index, data[index]);
      }
    },
    [data, onScrub]
  );

  const handleScrubEndJS = useCallback(() => {
    setActiveIndex(null);
    onScrubEnd?.();
  }, [onScrubEnd]);

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      if (barWidth <= 0) return;
      const idx = Math.floor(e.x / (barWidth + spacing.xs));
      const clamped = Math.max(0, Math.min(data.length - 1, idx));
      lastHapticIndex.value = clamped;
      triggerHaptic.selection();
      runOnJS(handleScrubUpdate)(clamped);
    })
    .onUpdate((e) => {
      if (barWidth <= 0) return;
      const idx = Math.floor(e.x / (barWidth + spacing.xs));
      const clamped = Math.max(0, Math.min(data.length - 1, idx));
      if (clamped !== lastHapticIndex.value) {
        lastHapticIndex.value = clamped;
        triggerHaptic.light();
        runOnJS(handleScrubUpdate)(clamped);
      }
    })
    .onEnd(() => {
      lastHapticIndex.value = -1;
      runOnJS(handleScrubEndJS)();
    })
    .onFinalize(() => {
      lastHapticIndex.value = -1;
      runOnJS(handleScrubEndJS)();
    });

  return (
    <View onLayout={handleLayout} style={styles.container}>
      {/* Tooltip */}
      {activeIndex !== null && data[activeIndex] && (
        <View style={styles.tooltipRow}>
          <Text
            style={[
              styles.tooltipLabel,
              { color: theme.text.secondary, fontFamily: typography.fonts.uiMedium },
            ]}
          >
            {data[activeIndex].label}
          </Text>
          <Text
            style={[
              styles.tooltipValue,
              { color: theme.text.primary, fontFamily: typography.fonts.numbersBold },
            ]}
          >
            {formatValue(data[activeIndex].value)}
          </Text>
        </View>
      )}

      {/* Chart area */}
      <GestureDetector gesture={panGesture}>
        <View style={[styles.chartArea, { height }]}>
          {containerWidth > 0 &&
            data.map((point, index) => {
              const barHeight = maxValue > 0
                ? (point.value / maxValue) * (height - 4)
                : 0;
              const isActive = activeIndex === index;

              return (
                <AnimatedBar
                  key={index}
                  index={index}
                  barWidth={barWidth}
                  barHeight={Math.max(barHeight, 2)}
                  color={color}
                  isActive={isActive}
                  isDark={isDark}
                  reducedMotion={reducedMotion ?? false}
                  chartHeight={height}
                />
              );
            })}
        </View>
      </GestureDetector>

      {/* X-axis labels */}
      {showLabels && containerWidth > 0 && (
        <View style={styles.labelsRow}>
          {data.map((point, index) => (
            <View
              key={index}
              style={[styles.labelCell, { width: barWidth + spacing.xs }]}
            >
              {labelIndices.has(index) && (
                <Text
                  style={[
                    styles.labelText,
                    {
                      color:
                        activeIndex === index
                          ? theme.text.primary
                          : theme.text.tertiary,
                      fontFamily: typography.fonts.uiMedium,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {point.label}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Animated Bar ────────────────────────────────────────────

interface AnimatedBarProps {
  index: number;
  barWidth: number;
  barHeight: number;
  color: string;
  isActive: boolean;
  isDark: boolean;
  reducedMotion: boolean;
  chartHeight: number;
}

const AnimatedBar: React.FC<AnimatedBarProps> = React.memo(
  ({ index, barWidth, barHeight, color, isActive, isDark, reducedMotion, chartHeight }) => {
    const animatedHeight = useSharedValue(0);

    React.useEffect(() => {
      if (reducedMotion) {
        animatedHeight.value = barHeight;
      } else {
        animatedHeight.value = withDelay(
          index * motionConstants.staggerOffsetMs,
          withSpring(barHeight, springConfig.gentle)
        );
      }
    }, [barHeight, reducedMotion]);

    const animatedStyle = useAnimatedStyle(() => ({
      height: animatedHeight.value,
    }));

    return (
      <View style={[styles.barContainer, { width: barWidth, height: chartHeight }]}>
        <Animated.View
          style={[
            styles.bar,
            {
              width: barWidth,
              backgroundColor: isActive ? color : `${color}${isDark ? '99' : 'BB'}`,
              borderRadius: Math.min(barWidth / 2, layout.borderRadius.xs),
            },
            animatedStyle,
          ]}
        />
      </View>
    );
  }
);

AnimatedBar.displayName = 'AnimatedBar';

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    minHeight: 24,
  },
  tooltipLabel: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  tooltipValue: {
    fontSize: typography.scale.base,
    includeFontPadding: false,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  barContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    minHeight: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  labelCell: {
    alignItems: 'center',
  },
  labelText: {
    fontSize: 10,
    includeFontPadding: false,
  },
});
