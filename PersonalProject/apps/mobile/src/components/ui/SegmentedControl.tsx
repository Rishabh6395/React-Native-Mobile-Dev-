import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { springConfig, triggerHaptic } from '../../theme/motion';
import { layout, spacing, typography } from '../../theme/tokens';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const { theme, isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const reducedMotion = useReducedMotion();

  const activeIndex = options.findIndex((opt) => opt.value === value);
  const segmentWidth =
    containerWidth > 0 && options.length > 0
      ? (containerWidth - spacing.xs * 2) / options.length
      : 0;

  const translateX = useSharedValue(0);

  React.useEffect(() => {
    if (segmentWidth > 0 && activeIndex >= 0) {
      const targetX = spacing.xs + activeIndex * segmentWidth;
      if (reducedMotion) {
        translateX.value = targetX;
      } else {
        translateX.value = withSpring(targetX, springConfig.default);
      }
    }
  }, [activeIndex, segmentWidth, reducedMotion]);

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: segmentWidth,
    };
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth(width);
  };

  const handleSelect = (optionValue: T) => {
    if (optionValue !== value) {
      triggerHaptic.selection();
      onChange(optionValue);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? theme.card.base : theme.card.elevated,
          borderColor: theme.border.subtle,
        },
        style,
      ]}
    >
      {/* Animated Sliding Thumb */}
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: isDark
                ? theme.card.highlight
                : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
            animatedThumbStyle,
          ]}
        />
      )}

      {/* Segment Labels */}
      <View style={styles.segmentsRow}>
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={styles.segmentButton}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? theme.text.primary
                      : theme.text.tertiary,
                    fontFamily: isActive
                      ? typography.fonts.uiSemiBold
                      : typography.fonts.uiMedium,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    padding: spacing.xs,
    justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    zIndex: 1,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  label: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
});
