import * as Haptics from 'expo-haptics';
import { WithSpringConfig, runOnJS } from 'react-native-reanimated';

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

// Pure JS runners for expo-haptics
const doLight = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

const doMedium = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
};

const doHeavy = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
};

const doSuccess = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

const doWarning = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
};

const doSelection = () => {
  try {
    Haptics.selectionAsync();
  } catch {}
};

const isWorkletRuntime = () => {
  'worklet';
  return typeof _WORKLET !== 'undefined' && Boolean(_WORKLET);
};

const safeHaptic = (action: () => void) => {
  'worklet';
  if (isWorkletRuntime()) {
    runOnJS(action)();
  } else {
    action();
  }
};

/**
 * Safe haptic feedback triggers with error boundary and worklet-safe dispatch
 */
export const triggerHaptic = {
  light: () => {
    'worklet';
    safeHaptic(doLight);
  },
  medium: () => {
    'worklet';
    safeHaptic(doMedium);
  },
  heavy: () => {
    'worklet';
    safeHaptic(doHeavy);
  },
  success: () => {
    'worklet';
    safeHaptic(doSuccess);
  },
  warning: () => {
    'worklet';
    safeHaptic(doWarning);
  },
  selection: () => {
    'worklet';
    safeHaptic(doSelection);
  },
};
