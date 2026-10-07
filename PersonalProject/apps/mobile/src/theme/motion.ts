import * as Haptics from 'expo-haptics';
import { WithSpringConfig } from 'react-native-reanimated';

/**
 * Motion Principles for Hourly
 * Spec Reference: Section 9.2
 * Springs, not timings, for buttery smooth 60fps+ transitions.
 */

export const springConfig: Record<'default' | 'press' | 'gentle' | 'bouncy', WithSpringConfig> = {
  default: {
    damping: 18,
    stiffness: 180,
    mass: 0.9,
  },
  press: {
    damping: 15,
    stiffness: 300,
    mass: 0.8,
  },
  gentle: {
    damping: 24,
    stiffness: 160,
    mass: 1.0,
  },
  bouncy: {
    damping: 12,
    stiffness: 220,
    mass: 0.8,
  },
};

export const motionConstants = {
  pressScale: 0.97,
  staggerOffsetMs: 40,
  durationFast: 200,
  durationNormal: 350,
};

/**
 * Safe haptic feedback triggers with error boundary protection
 */
export const triggerHaptic = {
  light: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics may fail in emulator or unprivileged contexts
    }
  },
  medium: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  },
  heavy: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  },
  success: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  },
  warning: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  },
  selection: () => {
    try {
      Haptics.selectionAsync();
    } catch {}
  },
};
