import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { layout, spacing } from '../../theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'base' | 'elevated' | 'highlight';
  hasGradient?: boolean;
  padding?: keyof typeof spacing | number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'base',
  hasGradient = true,
  padding = 'base',
}) => {
  const { theme, isDark } = useTheme();

  const paddingVal = typeof padding === 'number' ? padding : spacing[padding];
  const cardBg = theme.card[variant];

  // Soft subtle gradient highlight at top of card
  const gradientColors = isDark
    ? (['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.00)'] as const)
    : (['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.4)'] as const);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: cardBg,
          borderColor: theme.border.subtle,
          padding: paddingVal,
        },
        style,
      ]}
    >
      {hasGradient && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.8 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {children}
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
});
