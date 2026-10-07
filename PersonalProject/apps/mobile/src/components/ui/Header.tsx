import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { triggerHaptic } from '../../theme/motion';
import { layout, spacing, typography } from '../../theme/tokens';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  largeTitle?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  largeTitle = false,
  onBack,
  rightAction,
  style,
}) => {
  const { theme, isDark } = useTheme();

  const handleBack = () => {
    triggerHaptic.light();
    if (onBack) onBack();
  };

  if (largeTitle) {
    return (
      <View style={[styles.largeContainer, style]}>
        <View style={styles.topRow}>
          {onBack ? (
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              style={[
                styles.backButton,
                {
                  backgroundColor: isDark
                    ? theme.card.highlight
                    : theme.card.elevated,
                },
              ]}
            >
              <ChevronLeft size={20} color={theme.text.primary} />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}

          {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
        </View>

        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.largeTitleText,
              {
                color: theme.text.primary,
                fontFamily: typography.fonts.numbersBold,
              },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitleText,
                {
                  color: theme.text.secondary,
                  fontFamily: typography.fonts.uiRegular,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.compactContainer, style]}>
      <View style={styles.leftCol}>
        {onBack && (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={[
              styles.backButton,
              {
                backgroundColor: isDark
                  ? theme.card.highlight
                  : theme.card.elevated,
              },
            ]}
          >
            <ChevronLeft size={20} color={theme.text.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.centerCol}>
        <Text
          numberOfLines={1}
          style={[
            styles.compactTitleText,
            {
              color: theme.text.primary,
              fontFamily: typography.fonts.uiSemiBold,
            },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            numberOfLines={1}
            style={[
              styles.subtitleText,
              {
                color: theme.text.secondary,
                fontFamily: typography.fonts.uiRegular,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightCol}>{rightAction}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
  },
  largeContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: spacing.xs,
  },
  titleBlock: {
    marginTop: spacing.xs,
  },
  leftCol: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightCol: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: layout.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightAction: {
    alignItems: 'flex-end',
  },
  largeTitleText: {
    fontSize: typography.scale.xl,
    includeFontPadding: false,
    letterSpacing: -0.5,
  },
  compactTitleText: {
    fontSize: typography.scale.base,
    includeFontPadding: false,
  },
  subtitleText: {
    fontSize: typography.scale.xs,
    marginTop: 2,
    includeFontPadding: false,
  },
});
