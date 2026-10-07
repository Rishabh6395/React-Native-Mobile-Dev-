import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from './Button';
import { layout, spacing, typography } from '../../theme/tokens';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text
        style={[
          styles.title,
          {
            color: theme.text.primary,
            fontFamily: typography.fonts.uiSemiBold,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: theme.text.secondary,
            fontFamily: typography.fonts.uiRegular,
          },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onAction && (
        <View style={styles.actionWrapper}>
          <Button
            title={actionTitle}
            onPress={onAction}
            variant="primary"
            size="md"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: layout.screenPadding,
  },
  iconWrapper: {
    marginBottom: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.scale.lg,
    textAlign: 'center',
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  description: {
    fontSize: typography.scale.sm,
    textAlign: 'center',
    lineHeight: typography.lineHeight.sm + 2,
    includeFontPadding: false,
    maxWidth: 280,
  },
  actionWrapper: {
    marginTop: spacing.lg,
  },
});
