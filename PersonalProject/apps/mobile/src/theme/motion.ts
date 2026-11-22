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

/**
 * Safe haptic feedback triggers with worklet-safe direct dispatch.
 * Calls runOnJS only when executed on UI runtime, or calls directly on JS thread.
 */
export const triggerHaptic = {
  light: () => {
    'worklet';
    if (typeof _WORKLET !== 'undefined' && _WORKLET) {
      runOnJS(doLight)();
    } else {
      doLight();
    }
  },
  medium: () => {
    'worklet';
    if (typeof _WORKLET !== 'undefined' && _WORKLET) {
      runOnJS(doMedium)();
    } else {
      doMedium();
    }
  },
  heavy: () => {
    'worklet';
    if (typeof _WORKLET !== 'undefined' && _WORKLET) {
      runOnJS(doHeavy)();
    } else {
      doHeavy();
    }
  },
  success: () => {
    'worklet';
    if (typeof _WORKLET !== 'undefined' && _WORKLET) {
      runOnJS(doSuccess)();
    } else {
      doSuccess();
    }
  },
  warning: () => {
    'worklet';
    if (typeof _WORKLET !== 'undefined' && _WORKLET) {
      runOnJS(doWarning)();
    } else {
      doWarning();
    }
  },
  selection: () => {
    'worklet';
    if (typeof _WORKLET !== 'undefined' && _WORKLET) {
      runOnJS(doSelection)();
    } else {
      doSelection();
    }
  },
};
