import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeContext';
import { layout, spacing, glassShadow } from '../../theme/tokens';

export interface GlowCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  glowOpacity?: number;
  variant?: 'base' | 'elevated' | 'highlight';
  /** Use real blur (expensive — limit to 1-2 per screen) */
  glassBlur?: boolean;
  padding?: keyof typeof spacing | number;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  style,
  glowColor,
  glowOpacity = 0.22,
  variant = 'elevated',
  glassBlur = false,
  padding = 'base',
}) => {
  const { theme, isDark } = useTheme();
  const paddingVal = typeof padding === 'number' ? padding : spacing[padding];
  const activeGlowColor = glowColor || theme.accent.violet;

  return (
    <View style={[styles.outerContainer, glassShadow, style]}>
      {/* Outer glow aura */}
      <View
        style={[
          styles.glowAura,
          {
            backgroundColor: activeGlowColor,
            opacity: isDark ? glowOpacity : glowOpacity * 0.4,
          },
        ]}
      />
      {/* Glowing border gradient */}
      <LinearGradient
        colors={[
          activeGlowColor,
          theme.accent.aqua,
          'rgba(255, 255, 255, 0.06)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderGradient}
      >
        {glassBlur && Platform.OS !== 'web' ? (
          <View style={styles.innerCard}>
            <BlurView
              intensity={isDark ? 35 : 55}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: theme.card[variant] },
              ]}
              pointerEvents="none"
            />
            <View style={{ padding: paddingVal }}>{children}</View>
          </View>
        ) : (
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
        )}
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
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: layout.borderRadius.card + 4,
    transform: [{ scale: 1.03 }],
  },
  borderGradient: {
    borderRadius: layout.borderRadius.card,
    padding: 1,
    overflow: 'hidden',
  },
  innerCard: {
    borderRadius: layout.borderRadius.card - 1,
    overflow: 'hidden',
  },
});
