import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleProp, StyleSheet } from 'react-native';
import {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { typography } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 800,
  format,
  style,
  prefix = '',
  suffix = '',
}) => {
  const { theme } = useTheme();
  const [displayValue, setDisplayValue] = useState<number>(value);
  const animValue = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    animValue.value = withTiming(
      value,
      {
        duration,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setDisplayValue)(value);
        }
      }
    );

    // Update displayed value smoothly
    const interval = 30; // ~33fps JS tick for text rendering
    const steps = duration / interval;
    const startVal = displayValue;
    const diff = value - startVal;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + diff * eased);
      setDisplayValue(current);

      if (progress >= 1) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [value, duration, reducedMotion]);

  const formattedText = format
    ? format(displayValue)
    : `${prefix}${displayValue.toLocaleString()}${suffix}`;

  return (
    <Text
      style={[
        styles.defaultStyle,
        {
          color: theme.text.primary,
          fontFamily: typography.fonts.numbersBold,
        },
        style,
      ]}
    >
      {formattedText}
    </Text>
  );
};

const styles = StyleSheet.create({
  defaultStyle: {
    fontSize: typography.scale.xl,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
});
