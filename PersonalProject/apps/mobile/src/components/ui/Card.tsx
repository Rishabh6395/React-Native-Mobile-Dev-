import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeContext';
import { layout, spacing } from '../../theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'base' | 'elevated' | 'highlight';
  hasGradient?: boolean;
  /** Use real blur (expensive — limit to 1-2 per screen) */
  glassBlur?: boolean;
  padding?: keyof typeof spacing | number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'base',
  hasGradient = true,
  glassBlur = false,
  padding = 'base',
}) => {
  const { theme, isDark } = useTheme();

  const paddingVal = typeof padding === 'number' ? padding : spacing[padding];
  const cardBg = theme.card[variant];

  // Glass edge highlight gradient
  const gradientColors = isDark
    ? (['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.00)'] as const)
    : (['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.4)'] as const);

  const content = (
    <>
      {hasGradient && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      <View style={{ padding: paddingVal }}>{children}</View>
    </>
  );

  if (glassBlur && Platform.OS !== 'web') {
    return (
      <View
        style={[
          styles.container,
          { borderColor: theme.border.glass },
          style,
        ]}
      >
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, styles.blurFill]}
        />
        {/* Tinted overlay on top of blur */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: cardBg },
          ]}
          pointerEvents="none"
        />
        {content}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: cardBg,
          borderColor: theme.border.glass,
        },
        style,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: layout.borderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  blurFill: {
    borderRadius: layout.borderRadius.card,
  },
});
