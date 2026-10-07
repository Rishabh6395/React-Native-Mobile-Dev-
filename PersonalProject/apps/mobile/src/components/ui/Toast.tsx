import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { springConfig, triggerHaptic } from '../../theme/motion';
import { layout, spacing, typography } from '../../theme/tokens';

export type ToastType = 'good' | 'alert' | 'nudge' | 'info';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss?: () => void;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  onDismiss,
  duration = 3200,
  style,
}) => {
  const { theme, isDark } = useTheme();
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const hideToast = useCallback(() => {
    if (reducedMotion) {
      opacity.value = 0;
      translateY.value = -60;
      if (onDismiss) onDismiss();
      return;
    }
    opacity.value = withTiming(0, { duration: 250 });
    translateY.value = withSpring(-60, springConfig.press, (finished) => {
      if (finished && onDismiss) {
        runOnJS(onDismiss)();
      }
    });
  }, [reducedMotion, onDismiss, opacity, translateY]);

  useEffect(() => {
    if (visible) {
      if (type === 'good') triggerHaptic.success();
      else if (type === 'alert' || type === 'nudge') triggerHaptic.warning();
      else triggerHaptic.light();

      if (reducedMotion) {
        translateY.value = 0;
        opacity.value = 1;
      } else {
        translateY.value = withSpring(0, springConfig.default);
        opacity.value = withTiming(1, { duration: 200 });
      }

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration, reducedMotion, type, hideToast, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const iconColor = {
    good: theme.semantic.good,
    nudge: theme.semantic.nudge,
    alert: theme.semantic.alert,
    info: theme.semantic.info,
  }[type];

  const renderIcon = () => {
    const size = 20;
    switch (type) {
      case 'good':
        return <CheckCircle2 size={size} color={iconColor} strokeWidth={2} />;
      case 'nudge':
        return <AlertTriangle size={size} color={iconColor} strokeWidth={2} />;
      case 'alert':
        return <AlertCircle size={size} color={iconColor} strokeWidth={2} />;
      case 'info':
      default:
        return <Info size={size} color={iconColor} strokeWidth={2} />;
    }
  };

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? theme.card.elevated
            : '#FFFFFF',
          borderColor: theme.border.strong,
        },
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.iconContainer}>{renderIcon()}</View>
      <Text
        style={[
          styles.message,
          {
            color: theme.text.primary,
            fontFamily: typography.fonts.uiMedium,
          },
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.base,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '90%',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  message: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
    flexShrink: 1,
  },
});
