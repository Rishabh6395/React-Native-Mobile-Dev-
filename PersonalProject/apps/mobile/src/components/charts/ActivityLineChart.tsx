/**
 * ActivityLineChart — Smooth curved line chart with glow effect
 * 
 * Replaces the bar-style MiniTimeline with a modern glowing area chart.
 * Features: cubic bezier curve, gradient glow fill, animated draw-in,
 * scrub-to-inspect with glowing dot and haptics.
 */

import React, { useCallback, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { useTheme } from '../../theme/ThemeContext';
import { triggerHaptic } from '../../theme/motion';
import { spacing, typography } from '../../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface LineDataPoint {
  label: string;
  value: number; // milliseconds
  date?: string;
}

export interface ActivityLineChartProps {
  data: LineDataPoint[];
  height?: number;
  formatValue?: (ms: number) => string;
  showLabels?: boolean;
  maxLabels?: number;
  accentColor?: string;
  accentColorEnd?: string;
  onScrub?: (index: number, point: LineDataPoint) => void;
  onScrubEnd?: () => void;
}

const DEFAULT_FORMAT = (ms: number) => {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/**
 * Build a smooth SVG path using monotone cubic interpolation.
 * This avoids overshooting and creates a natural-looking curve.
 */
function buildSmoothPath(
  points: { x: number; y: number }[],
): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  }

  let path = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
}

export const ActivityLineChart: React.FC<ActivityLineChartProps> = ({
  data,
  height = 140,
  formatValue = DEFAULT_FORMAT,
  showLabels = true,
  maxLabels = 5,
  accentColor,
  accentColorEnd,
  onScrub,
  onScrubEnd,
}) => {
  const { theme, isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lastHapticIndex = useRef(-1);

  const startColor = accentColor || theme.accent.violet;
  const endColor = accentColorEnd || theme.accent.aqua;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const paddingTop = 8;
  const paddingBottom = 4;
  const chartHeight = height - paddingTop - paddingBottom;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Compute points and paths
  const { linePath, areaPath, points } = useMemo(() => {
    if (containerWidth <= 0 || data.length < 2) {
      return { linePath: '', areaPath: '', points: [] };
    }

    const hPad = 2;
    const usableWidth = containerWidth - hPad * 2;
    const pts = data.map((d, i) => ({
      x: hPad + (i / (data.length - 1)) * usableWidth,
      y:
        paddingTop +
        chartHeight -
        (maxValue > 0 ? (d.value / maxValue) * chartHeight : 0),
    }));

    const line = buildSmoothPath(pts);
    // Area: same path but close back to bottom
    const lastPt = pts[pts.length - 1];
    const firstPt = pts[0];
    const area = `${line} L${lastPt.x},${paddingTop + chartHeight} L${firstPt.x},${paddingTop + chartHeight} Z`;

    return { linePath: line, areaPath: area, points: pts };
  }, [data, containerWidth, maxValue, chartHeight]);

  // Animated stroke draw-in
  const drawProgress = useSharedValue(0);

  React.useEffect(() => {
    if (linePath) {
      drawProgress.value = 0;
      if (reducedMotion) {
        drawProgress.value = 1;
      } else {
        drawProgress.value = withTiming(1, {
          duration: 1000,
          easing: Easing.out(Easing.cubic),
        });
      }
    }
  }, [linePath, reducedMotion]);

  // We approximate the total length for dashoffset animation
  const approxLength = containerWidth * 2;

  const animatedLineProps = useAnimatedProps(() => ({
    strokeDashoffset: approxLength * (1 - drawProgress.value),
  }));

  const animatedAreaProps = useAnimatedProps(() => ({
    opacity: drawProgress.value,
  }));

  // Label items with positions
  const visibleLabels = useMemo(() => {
    if (data.length === 0 || points.length === 0) return [];
    const step = Math.max(1, Math.ceil(data.length / maxLabels));
    const indices: number[] = [];
    for (let i = 0; i < data.length; i += step) indices.push(i);
    if (!indices.includes(data.length - 1)) {
      indices.push(data.length - 1);
    }
    return indices.map((idx) => ({
      index: idx,
      label: data[idx].label,
      x: points[idx]?.x ?? (idx / (data.length - 1)) * containerWidth,
    }));
  }, [data, points, maxLabels, containerWidth]);

  // Scrubbing
  const handleScrubUpdate = useCallback(
    (index: number) => {
      if (index >= 0 && index < data.length) {
        setActiveIndex(index);
        onScrub?.(index, data[index]);
      }
    },
    [data, onScrub],
  );

  const handleScrubEndJS = useCallback(() => {
    setActiveIndex(null);
    onScrubEnd?.();
  }, [onScrubEnd]);

  const getIndexFromX = useCallback(
    (x: number) => {
      if (points.length < 2) return 0;
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - x);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      return closest;
    },
    [points],
  );

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => {
      const idx = getIndexFromX(e.x);
      lastHapticIndex.current = idx;
      triggerHaptic.selection();
      handleScrubUpdate(idx);
    })
    .onUpdate((e) => {
      const idx = getIndexFromX(e.x);
      if (idx !== lastHapticIndex.current) {
        lastHapticIndex.current = idx;
        triggerHaptic.light();
        handleScrubUpdate(idx);
      }
    })
    .onEnd(() => {
      lastHapticIndex.current = -1;
      handleScrubEndJS();
    })
    .onFinalize(() => {
      lastHapticIndex.current = -1;
      handleScrubEndJS();
    });

  const activePt = activeIndex !== null ? points[activeIndex] : null;

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

      {/* Chart */}
      <GestureDetector gesture={panGesture}>
        <View style={{ height }}>
          {containerWidth > 0 && linePath ? (
            <Svg width={containerWidth} height={height}>
              <Defs>
                <SvgLinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={startColor} stopOpacity="1" />
                  <Stop offset="1" stopColor={endColor} stopOpacity="1" />
                </SvgLinearGradient>
                <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={startColor} stopOpacity={isDark ? '0.25' : '0.18'} />
                  <Stop offset="0.7" stopColor={endColor} stopOpacity="0.05" />
                  <Stop offset="1" stopColor={endColor} stopOpacity="0" />
                </SvgLinearGradient>
                <SvgLinearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={startColor} stopOpacity="0.12" />
                  <Stop offset="1" stopColor={startColor} stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>

              {/* Glow area fill */}
              <AnimatedPath
                d={areaPath}
                fill="url(#areaGrad)"
                animatedProps={animatedAreaProps}
              />

              {/* Main line */}
              <AnimatedPath
                d={linePath}
                stroke="url(#lineGrad)"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${approxLength}`}
                animatedProps={animatedLineProps}
              />

              {/* Glow duplicate (thicker, more transparent) */}
              <AnimatedPath
                d={linePath}
                stroke={startColor}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${approxLength}`}
                animatedProps={animatedLineProps}
                opacity={0.15}
              />

              {/* Active scrub dot */}
              {activePt && (
                <>
                  {/* Outer glow */}
                  <Circle
                    cx={activePt.x}
                    cy={activePt.y}
                    r={10}
                    fill={startColor}
                    opacity={0.25}
                  />
                  {/* Inner dot */}
                  <Circle
                    cx={activePt.x}
                    cy={activePt.y}
                    r={5}
                    fill="#FFFFFF"
                    stroke={startColor}
                    strokeWidth={2}
                  />
                </>
              )}
            </Svg>
          ) : null}
        </View>
      </GestureDetector>

      {/* X-axis labels */}
      {showLabels && containerWidth > 0 && visibleLabels.length > 0 && (
        <View style={styles.labelsRow}>
          {visibleLabels.map((item) => {
            const labelWidth = 56;
            const left = Math.max(0, Math.min(containerWidth - labelWidth, item.x - labelWidth / 2));
            const isSelected = activeIndex === item.index;

            return (
              <View
                key={item.index}
                style={[styles.labelAbsoluteWrapper, { left, width: labelWidth }]}
              >
                <Text
                  style={[
                    styles.labelText,
                    {
                      color: isSelected ? theme.text.primary : theme.text.tertiary,
                      fontFamily: typography.fonts.uiMedium,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    minHeight: 22,
  },
  tooltipLabel: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  tooltipValue: {
    fontSize: typography.scale.base,
    includeFontPadding: false,
  },
  labelsRow: {
    position: 'relative',
    marginTop: spacing.xs,
    height: 18,
  },
  labelAbsoluteWrapper: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 10,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
