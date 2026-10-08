/**
 * UsageBar — Inline animated horizontal bar for ranked app list
 * Spec Reference: Section 9.4 (Stats screen)
 *
 * Shows a proportional horizontal bar next to the app time value.
 * Animates on mount with spring physics.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  useReducedMotion,
} from 'react-native-reanimated';
import { springConfig, motionConstants } from '../../theme/motion';
import { layout } from '../../theme/tokens';

export interface UsageBarProps {
  /** Fraction of the bar to fill (0 to 1) */
  progress: number;
  /** Color of the filled portion */
  color: string;
  /** Background color of the track */
  trackColor?: string;
  /** Height of the bar */
  height?: number;
  /** Stagger delay index for entrance animation */
  index?: number;
}

export const UsageBar: React.FC<UsageBarProps> = ({
  progress,
  color,
  trackColor,
  height = 4,
  index = 0,
}) => {
  const reducedMotion = useReducedMotion();
  const animatedProgress = useSharedValue(0);

  React.useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    if (reducedMotion) {
      animatedProgress.value = clamped;
    } else {
      animatedProgress.value = withDelay(
        index * motionConstants.staggerOffsetMs,
        withSpring(clamped, springConfig.gentle)
      );
    }
  }, [progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%` as unknown as number,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor || 'rgba(255, 255, 255, 0.06)',
          borderRadius: height / 2,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: color,
            borderRadius: height / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
