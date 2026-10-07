import React from 'react';
import { Text, StyleSheet, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable3D } from './Pressable3D';
import { useTheme } from '../../theme/ThemeContext';
import { layout, spacing, typography } from '../../theme/tokens';

export interface PillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  badge?: string | number;
  variant?: 'pill' | 'chip';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export const Pill: React.FC<PillProps> = ({
  label,
  active = false,
  onPress,
  icon,
  badge,
  variant = 'chip',
  size = 'md',
  style,
  labelStyle,
}) => {
  const { theme, isDark } = useTheme();

  const borderRadius =
    variant === 'pill' ? layout.borderRadius.pill : layout.borderRadius.chip;

  const isSmall = size === 'sm';
  const paddingVertical = isSmall ? spacing.xs : spacing.sm;
  const paddingHorizontal = isSmall ? spacing.sm : spacing.base;

  const content = (
    <View
      style={[
        styles.innerRow,
        {
          paddingVertical,
          paddingHorizontal,
          backgroundColor: active
            ? 'transparent'
            : isDark
            ? theme.card.highlight
            : theme.card.elevated,
          borderColor: active ? theme.border.active : theme.border.subtle,
          borderWidth: active ? 0 : 1,
          borderRadius,
        },
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.label,
          {
            color: active
              ? '#FFFFFF'
              : theme.text.primary,
            fontSize: isSmall ? typography.scale.xs : typography.scale.sm,
            fontFamily: active
              ? typography.fonts.uiSemiBold
              : typography.fonts.uiMedium,
          },
          labelStyle,
        ]}
      >
        {label}
      </Text>
      {badge !== undefined && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: active
                ? 'rgba(255, 255, 255, 0.25)'
                : theme.card.base,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: active ? '#FFFFFF' : theme.text.secondary,
              },
            ]}
          >
            {badge}
          </Text>
        </View>
      )}
    </View>
  );

  if (active) {
    return (
      <Pressable3D
        disabled={!onPress}
        onPress={onPress}
        style={[styles.container, { borderRadius }, style]}
      >
        <LinearGradient
          colors={theme.accent.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBorder, { borderRadius }]}
        >
          {content}
        </LinearGradient>
      </Pressable3D>
    );
  }

  return (
    <Pressable3D
      disabled={!onPress}
      onPress={onPress}
      style={[styles.container, { borderRadius }, style]}
    >
      {content}
    </Pressable3D>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  gradientBorder: {
    padding: 0,
    overflow: 'hidden',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  label: {
    includeFontPadding: false,
  },
  badge: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: layout.borderRadius.pill,
  },
  badgeText: {
    fontSize: typography.scale.xs,
    fontFamily: typography.fonts.numbersRegular,
  },
});
