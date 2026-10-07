import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AppState,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  Sliders,
  CheckCircle2,
  Bell,
  ArrowRight,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import {
  hasUsageAccess,
  openUsageAccessSettings,
} from '../../../modules/usage-stats';
import { springConfig, triggerHaptic } from '../../theme/motion';
import { layout, spacing, typography } from '../../theme/tokens';

interface PermissionScreenProps {
  onGranted: () => void;
}

export const PermissionScreen: React.FC<PermissionScreenProps> = ({ onGranted }) => {
  const { theme } = useTheme();
  const [granted, setGranted] = useState(false);
  const [askingNotifications, setAskingNotifications] = useState(false);
  const reducedMotion = useReducedMotion();

  const successScale = useSharedValue(0.8);
  const successOpacity = useSharedValue(0);

  const checkPermission = () => {
    const isAccessGranted = hasUsageAccess();
    if (isAccessGranted && !granted) {
      setGranted(true);
      triggerHaptic.success();

      if (reducedMotion) {
        successScale.value = 1;
        successOpacity.value = 1;
      } else {
        successOpacity.value = withTiming(1, { duration: 300 });
        successScale.value = withSpring(1, springConfig.bouncy);
      }

      // After a brief celebratory display, ask notification permission or continue
      setTimeout(() => {
        setAskingNotifications(true);
      }, 1400);
    }
  };

  useEffect(() => {
    checkPermission();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkPermission();
      }
    });

    return () => sub.remove();
  }, [granted]);

  const animatedSuccessStyle = useAnimatedStyle(() => {
    return {
      opacity: successOpacity.value,
      transform: [{ scale: successScale.value }],
    };
  });

  const handleOpenSettings = () => {
    triggerHaptic.medium();
    openUsageAccessSettings();
  };

  const handleProceed = () => {
    triggerHaptic.light();
    onGranted();
  };

  // State 2: Notification Permission Ask (Polite & Sensible)
  if (askingNotifications) {
    return (
      <Screen scrollable contentContainerStyle={styles.container}>
        <View style={styles.topIconWrap}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: 'rgba(124, 92, 255, 0.15)' },
            ]}
          >
            <Bell size={36} color={theme.accent.violet} strokeWidth={2} />
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text
            style={[
              styles.title,
              {
                color: theme.text.primary,
                fontFamily: typography.fonts.numbersBold,
              },
            ]}
          >
            Stay on track
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
            Hourly can send you a gentle evening recap of where your time went, and nudges when you approach your self-set goals.
          </Text>
        </View>

        <Card style={styles.notificationPreviewCard} padding="base">
          <View style={styles.notificationHeader}>
            <View
              style={[
                styles.miniLogo,
                { backgroundColor: theme.accent.violet },
              ]}
            >
              <Text style={styles.miniLogoText}>H</Text>
            </View>
            <Text
              style={[
                styles.notificationSender,
                { color: theme.text.tertiary },
              ]}
            >
              Hourly • Just now
            </Text>
          </View>
          <Text
            style={[
              styles.notificationTitle,
              {
                color: theme.text.primary,
                fontFamily: typography.fonts.uiSemiBold,
              },
            ]}
          >
            Evening Check-in 🌙
          </Text>
          <Text
            style={[
              styles.notificationBody,
              { color: theme.text.secondary },
            ]}
          >
            You spent 42m less on your phone today than yesterday. Great unwind session!
          </Text>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            title="Enable Notifications"
            onPress={handleProceed}
            variant="primary"
            size="lg"
            fullWidth
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            iconPosition="right"
          />
          <Button
            title="Maybe Later"
            onPress={handleProceed}
            variant="ghost"
            size="md"
            fullWidth
          />
        </View>
      </Screen>
    );
  }

  // State 1: Usage Access Permission Ask + 3-Step Illustrated Guide
  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      {granted ? (
        // Celebratory State on Auto-detect
        <Animated.View style={[styles.successContainer, animatedSuccessStyle]}>
          <View
            style={[
              styles.successCircle,
              { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
            ]}
          >
            <CheckCircle2 size={54} color={theme.semantic.good} strokeWidth={2} />
          </View>
          <Text
            style={[
              styles.successTitle,
              {
                color: theme.text.primary,
                fontFamily: typography.fonts.numbersBold,
              },
            ]}
          >
            Access Verified!
          </Text>
          <Text
            style={[
              styles.successSub,
              {
                color: theme.text.secondary,
                fontFamily: typography.fonts.uiRegular,
              },
            ]}
          >
            Thank you! Preparing your personalized dashboard...
          </Text>
        </Animated.View>
      ) : (
        <>
          <View style={styles.topIconWrap}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: 'rgba(124, 92, 255, 0.15)' },
              ]}
            >
              <Sliders size={36} color={theme.accent.violet} strokeWidth={2} />
            </View>
          </View>

          <View style={styles.textBlock}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.text.primary,
                  fontFamily: typography.fonts.numbersBold,
                },
              ]}
            >
              Enable Usage Access
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
              Android requires Usage Access to let Hourly calculate your daily app minutes. Your data stays securely on your phone.
            </Text>
          </View>

          {/* 3-Step Mini Guide Card */}
          <Card style={styles.stepsCard} padding="base">
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepNumberBadge,
                  { backgroundColor: theme.accent.violet },
                ]}
              >
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepTitle,
                    {
                      color: theme.text.primary,
                      fontFamily: typography.fonts.uiSemiBold,
                    },
                  ]}
                >
                  {"Tap 'Open Android Settings'"}
                </Text>
                <Text
                  style={[
                    styles.stepSub,
                    { color: theme.text.secondary },
                  ]}
                >
                  This takes you directly to the system Usage Access page.
                </Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepNumberBadge,
                  { backgroundColor: theme.card.highlight },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    { color: theme.text.primary },
                  ]}
                >
                  2
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepTitle,
                    {
                      color: theme.text.primary,
                      fontFamily: typography.fonts.uiSemiBold,
                    },
                  ]}
                >
                  {"Locate 'Hourly'"}
                </Text>
                <Text
                  style={[
                    styles.stepSub,
                    { color: theme.text.secondary },
                  ]}
                >
                  Find Hourly in the installed apps list.
                </Text>
              </View>
            </View>

            <View style={[styles.stepRow, { borderBottomWidth: 0 }]}>
              <View
                style={[
                  styles.stepNumberBadge,
                  { backgroundColor: theme.card.highlight },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    { color: theme.text.primary },
                  ]}
                >
                  3
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepTitle,
                    {
                      color: theme.text.primary,
                      fontFamily: typography.fonts.uiSemiBold,
                    },
                  ]}
                >
                  {"Toggle 'Permit usage access'"}
                </Text>
                <Text
                  style={[
                    styles.stepSub,
                    { color: theme.text.secondary },
                  ]}
                >
                  Return to this app and access will be detected automatically.
                </Text>
              </View>
            </View>
          </Card>

          {/* Action button */}
          <View style={styles.actionButtons}>
            <Button
              title="Open Android Settings"
              onPress={handleOpenSettings}
              variant="primary"
              size="lg"
              fullWidth
              icon={<ExternalLink size={18} color="#FFFFFF" />}
              iconPosition="right"
            />
          </View>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topIconWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: layout.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.scale.xl,
    textAlign: 'center',
    marginBottom: spacing.sm,
    includeFontPadding: false,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: typography.scale.sm,
    textAlign: 'center',
    lineHeight: typography.lineHeight.sm + 4,
    includeFontPadding: false,
    maxWidth: 320,
  },
  stepsCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: layout.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: typography.scale.xs,
    fontFamily: typography.fonts.numbersBold,
    includeFontPadding: false,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  stepSub: {
    fontSize: typography.scale.xs,
    marginTop: 2,
    includeFontPadding: false,
  },
  actionButtons: {
    width: '100%',
    gap: spacing.sm,
  },
  notificationPreviewCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  miniLogo: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  miniLogoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationSender: {
    fontSize: 11,
  },
  notificationTitle: {
    fontSize: typography.scale.sm,
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: typography.scale.xs,
    lineHeight: 18,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: layout.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.scale.xl,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSub: {
    fontSize: typography.scale.sm,
    textAlign: 'center',
    maxWidth: 260,
  },
});
