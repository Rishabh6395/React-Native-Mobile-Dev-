import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { layout, spacing } from '../../theme/tokens';

export interface GlowCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  glowOpacity?: number;
  variant?: 'base' | 'elevated' | 'highlight';
  padding?: keyof typeof spacing | number;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  style,
  glowColor,
  glowOpacity = 0.18,
  variant = 'elevated',
  padding = 'base',
}) => {
  const { theme, isDark } = useTheme();
  const paddingVal = typeof padding === 'number' ? padding : spacing[padding];
  const activeGlowColor = glowColor || theme.accent.violet;

  return (
    <View style={[styles.outerContainer, style]}>
      {/* Outer subtle glow/shadow aura */}
      <View
        style={[
          styles.glowAura,
          {
            backgroundColor: activeGlowColor,
            opacity: isDark ? glowOpacity : glowOpacity * 0.5,
          },
        ]}
      />
      {/* Glowing border gradient container */}
      <LinearGradient
        colors={[
          activeGlowColor,
          theme.accent.aqua,
          'rgba(255, 255, 255, 0.05)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderGradient}
      >
        <View
          style={[
            styles.innerCard,
            {
              backgroundColor: theme.card[variant],
              padding: paddingVal,
            },
          ]}
        >
          {children}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: layout.borderRadius.card + 4,
    transform: [{ scale: 1.02 }],
  },
  borderGradient: {
    borderRadius: layout.borderRadius.card,
    padding: 1, // 1px glowing border
    overflow: 'hidden',
  },
  innerCard: {
    borderRadius: layout.borderRadius.card - 1,
    overflow: 'hidden',
  },
});
