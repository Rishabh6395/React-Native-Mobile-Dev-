import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable3D } from './Pressable3D';
import { useTheme } from '../../theme/ThemeContext';
import { layout, spacing, typography } from '../../theme/tokens';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { theme, isDark } = useTheme();

  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      fontSize: typography.scale.sm,
      borderRadius: layout.borderRadius.md,
      iconGap: spacing.xs,
    },
    md: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      fontSize: typography.scale.base,
      borderRadius: layout.borderRadius.card,
      iconGap: spacing.sm,
    },
    lg: {
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.xl,
      fontSize: typography.scale.lg,
      borderRadius: layout.borderRadius.card,
      iconGap: spacing.sm,
    },
  }[size];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : theme.text.primary}
        />
      );
    }

    const textColor = {
      primary: '#FFFFFF',
      secondary: theme.text.primary,
      ghost: theme.accent.violet,
      danger: '#FFFFFF',
    }[variant];

    return (
      <View style={styles.contentRow}>
        {icon && iconPosition === 'left' && (
          <View style={{ marginRight: sizeStyles.iconGap }}>{icon}</View>
        )}
        <Text
          style={[
            styles.text,
            {
              color: textColor,
              fontSize: sizeStyles.fontSize,
              fontFamily: typography.fonts.uiSemiBold,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
        {icon && iconPosition === 'right' && (
          <View style={{ marginLeft: sizeStyles.iconGap }}>{icon}</View>
        )}
      </View>
    );
  };

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      borderRadius: sizeStyles.borderRadius,
      opacity: isDisabled ? 0.55 : 1,
    },
    fullWidth && styles.fullWidth,
    style,
  ];

  if (variant === 'primary') {
    return (
      <Pressable3D
        disabled={isDisabled}
        onPress={onPress}
        style={containerStyle}
      >
        <LinearGradient
          colors={theme.accent.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.inner,
            {
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              borderRadius: sizeStyles.borderRadius,
            },
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </Pressable3D>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable3D
        disabled={isDisabled}
        onPress={onPress}
        style={containerStyle}
      >
        <View
          style={[
            styles.inner,
            {
              backgroundColor: theme.semantic.alert,
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              borderRadius: sizeStyles.borderRadius,
            },
          ]}
        >
          {renderContent()}
        </View>
      </Pressable3D>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable3D
        disabled={isDisabled}
        onPress={onPress}
        style={containerStyle}
      >
        <View
          style={[
            styles.inner,
            {
              backgroundColor: isDark
                ? theme.card.elevated
                : theme.card.base,
              borderColor: theme.border.strong,
              borderWidth: 1,
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
              borderRadius: sizeStyles.borderRadius,
            },
          ]}
        >
          {renderContent()}
        </View>
      </Pressable3D>
    );
  }

  // Ghost variant
  return (
    <Pressable3D
      disabled={isDisabled}
      onPress={onPress}
      style={containerStyle}
    >
      <View
        style={[
          styles.inner,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
        ]}
      >
        {renderContent()}
      </View>
    </Pressable3D>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    includeFontPadding: false,
    textAlign: 'center',
  },
});
