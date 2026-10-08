/**
 * MiniTimeline — Compact 24-hour usage density strip
 * Spec Reference: Section 9.4 (Home screen)
 *
 * Shows a horizontal bar representing 24 hours with colored segments
 * indicating usage density. Compact enough for the Home screen.
 */

import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  useReducedMotion,
} from 'react-native-reanimated';
import { HourBucket } from '../../../modules/usage-stats';
import { useTheme } from '../../theme/ThemeContext';
import { springConfig, motionConstants } from '../../theme/motion';
import { spacing, typography, layout } from '../../theme/tokens';
import { formatHourLabel } from '../../features/usage/usageAggregation';

export interface MiniTimelineProps {
  /** 24 hourly buckets */
  data: HourBucket[];
  /** Height of the bars */
  barHeight?: number;
  /** Show hour labels */
  showLabels?: boolean;
}

export const MiniTimeline: React.FC<MiniTimelineProps> = ({
  data,
  barHeight = 32,
  showLabels = true,
}) => {
  const { theme, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Ensure we always have 24 buckets
  const buckets: HourBucket[] = React.useMemo(() => {
    const filled: HourBucket[] = [];
    for (let h = 0; h < 24; h++) {
      const existing = data.find((b) => b.hour === h);
      filled.push(existing || { hour: h, foregroundMs: 0 });
    }
    return filled;
  }, [data]);

  const maxMs = Math.max(...buckets.map((b) => b.foregroundMs), 1);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const segmentWidth = containerWidth > 0 ? (containerWidth - 23) / 24 : 0; // 1px gap between
  const currentHour = new Date().getHours();

  // Show labels every 6 hours: 12a, 6a, 12p, 6p
  const labelHours = [0, 6, 12, 18];

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Timeline bars */}
      <View style={[styles.barsRow, { height: barHeight }]}>
        {containerWidth > 0 &&
          buckets.map((bucket, idx) => {
            const intensity = maxMs > 0 ? bucket.foregroundMs / maxMs : 0;
            const isCurrent = idx === currentHour;

            return (
              <TimelineSegment
                key={idx}
                index={idx}
                width={segmentWidth}
                height={barHeight}
                intensity={intensity}
                isCurrent={isCurrent}
                isDark={isDark}
                accentColor={theme.accent.violet}
                reducedMotion={reducedMotion ?? false}
              />
            );
          })}
      </View>

      {/* Hour labels */}
      {showLabels && containerWidth > 0 && (
        <View style={styles.labelsRow}>
          {buckets.map((bucket, idx) => (
            <View
              key={idx}
              style={[styles.labelCell, { width: segmentWidth + 1 }]}
            >
              {labelHours.includes(idx) && (
                <Text
                  style={[
                    styles.labelText,
                    {
                      color: idx === currentHour
                        ? theme.text.primary
                        : theme.text.tertiary,
                      fontFamily: typography.fonts.uiMedium,
                    },
                  ]}
                >
                  {formatHourLabel(idx)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Timeline Segment ────────────────────────────────────────

interface TimelineSegmentProps {
  index: number;
  width: number;
  height: number;
  intensity: number; // 0 to 1
  isCurrent: boolean;
  isDark: boolean;
  accentColor: string;
  reducedMotion: boolean;
}

const TimelineSegment: React.FC<TimelineSegmentProps> = React.memo(
  ({ index, width, height, intensity, isCurrent, isDark, accentColor, reducedMotion }) => {
    const animatedScale = useSharedValue(0);

    React.useEffect(() => {
      const target = Math.max(intensity, 0.05); // minimum visible bar
      if (reducedMotion) {
        animatedScale.value = target;
      } else {
        animatedScale.value = withDelay(
          index * 15, // faster stagger for 24 items
          withSpring(target, springConfig.gentle)
        );
      }
    }, [intensity, reducedMotion]);

    const animatedStyle = useAnimatedStyle(() => ({
      height: animatedScale.value * height,
    }));

    // Color based on intensity
    const bgColor = intensity > 0
      ? isCurrent
        ? accentColor
        : `${accentColor}${isDark ? Math.round(intensity * 200 + 55).toString(16).padStart(2, '0') : Math.round(intensity * 180 + 60).toString(16).padStart(2, '0')}`
      : isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';

    return (
      <View style={[styles.segmentContainer, { width, height }]}>
        <Animated.View
          style={[
            styles.segment,
            {
              width,
              backgroundColor: bgColor,
              borderRadius: Math.min(width / 2, 3),
            },
            animatedStyle,
          ]}
        />
      </View>
    );
  }
);

TimelineSegment.displayName = 'TimelineSegment';

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  segmentContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  segment: {
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
    fontSize: 9,
    includeFontPadding: false,
  },
});
