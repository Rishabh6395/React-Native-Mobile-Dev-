import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  gradientColors?: readonly [string, string];
  trackColor?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 180,
  strokeWidth = 14,
  gradientColors,
  trackColor,
  children,
  style,
  duration = 1000,
}) => {
  const { theme, isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(progress, 1));
    if (reducedMotion) {
      animatedProgress.value = clamped;
    } else {
      animatedProgress.value = withTiming(clamped, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [progress, duration, reducedMotion]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const activeColors = gradientColors || theme.accent.gradient;
  const activeTrackColor =
    trackColor ||
    (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={activeColors[0]} />
            <Stop offset="100%" stopColor={activeColors[1]} />
          </LinearGradient>
        </Defs>

        {/* Background Track Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={activeTrackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Progress Circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="none"
          // Start from top (-90 deg)
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Centered Content (e.g. Hero Time & Delta) */}
      {children && <View style={styles.contentOverlay}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  contentOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
