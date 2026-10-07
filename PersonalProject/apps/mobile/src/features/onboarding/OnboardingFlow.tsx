import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  ShieldCheck,
  Sparkles,
  Clock,
  ArrowRight,
  Smartphone,
  Lock,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { GlowCard } from '../../components/ui/GlowCard';
import { Pill } from '../../components/ui/Pill';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { springConfig, triggerHaptic } from '../../theme/motion';
import { layout, spacing, typography } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { theme, isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const translateX = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const totalPages = 3;

  const goToPage = (pageIndex: number) => {
    triggerHaptic.selection();
    setCurrentPage(pageIndex);
    if (reducedMotion) {
      translateX.value = -pageIndex * SCREEN_WIDTH;
    } else {
      translateX.value = withSpring(
        -pageIndex * SCREEN_WIDTH,
        springConfig.default
      );
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    } else {
      triggerHaptic.success();
      onComplete();
    }
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header Row with Skip button */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: theme.accent.violet },
            ]}
          >
            <Clock size={16} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text
            style={[
              styles.brandName,
              {
                color: theme.text.primary,
                fontFamily: typography.fonts.numbersBold,
              },
            ]}
          >
            Hourly
          </Text>
        </View>

        {currentPage < totalPages - 1 && (
          <Pressable onPress={() => goToPage(totalPages - 1)} hitSlop={12}>
            <Text
              style={[
                styles.skipText,
                {
                  color: theme.text.tertiary,
                  fontFamily: typography.fonts.uiMedium,
                },
              ]}
            >
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      {/* Swipeable Pages Container */}
      <View style={styles.pagesViewport}>
        <Animated.View style={[styles.pagesSlider, animatedContainerStyle]}>
          {/* Page 1: Where your time goes */}
          <View style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={styles.heroVisualArea}>
              <ProgressRing
                progress={0.68}
                size={170}
                strokeWidth={14}
                gradientColors={theme.accent.gradient}
              >
                <View style={styles.ringCenterContent}>
                  <Text
                    style={[
                      styles.heroHours,
                      {
                        color: theme.text.primary,
                        fontFamily: typography.fonts.numbersBold,
                      },
                    ]}
                  >
                    3h 42m
                  </Text>
                  <Text
                    style={[
                      styles.heroSubLabel,
                      {
                        color: theme.semantic.good,
                        fontFamily: typography.fonts.uiMedium,
                      },
                    ]}
                  >
                    ↓ 38m less today
                  </Text>
                </View>
              </ProgressRing>

              <View style={styles.samplePillsRow}>
                <Pill label="YouTube 1h 10m" active size="sm" />
                <Pill label="Reading 45m" size="sm" />
                <Pill label="Social 32m" size="sm" />
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
                Where your time goes
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
                Clear, calming clarity on your daily screen time habits. No guilt, no judgment, just awareness.
              </Text>
            </View>
          </View>

          {/* Page 2: AI Coach & Content Swaps */}
          <View style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={styles.heroVisualArea}>
              <GlowCard style={styles.coachCard} padding="base">
                <View style={styles.coachCardHeader}>
                  <View style={styles.coachBadge}>
                    <Sparkles size={14} color="#FFFFFF" />
                  </View>
                  <Text
                    style={[
                      styles.coachCardTitle,
                      {
                        color: theme.text.primary,
                        fontFamily: typography.fonts.uiSemiBold,
                      },
                    ]}
                  >
                    Coach Insight
                  </Text>
                </View>
                <Text
                  style={[
                    styles.coachMessage,
                    {
                      color: theme.text.secondary,
                      fontFamily: typography.fonts.uiRegular,
                    },
                  ]}
                >
                  {'"You watched 9h 40m of video this week. Tell me what you loved, and let\'s find high-impact swaps!"'}
                </Text>

                <View style={styles.coachPromptChips}>
                  <Pill label="Suggest finite series" size="sm" active />
                  <Pill label="Set 45m gentle limit" size="sm" />
                </View>
              </GlowCard>
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
                Your personal time coach
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
                Get structured reports, explain what you watched, and build gradual reduction plans that stick.
              </Text>
            </View>
          </View>

          {/* Page 3: Privacy Promise */}
          <View style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={styles.heroVisualArea}>
              <Card style={styles.privacyCard} padding="base">
                <View style={styles.privacyItem}>
                  <View
                    style={[
                      styles.privacyIconWrap,
                      { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                    ]}
                  >
                    <Smartphone size={18} color={theme.semantic.good} />
                  </View>
                  <View style={styles.privacyItemText}>
                    <Text
                      style={[
                        styles.privacyItemTitle,
                        {
                          color: theme.text.primary,
                          fontFamily: typography.fonts.uiSemiBold,
                        },
                      ]}
                    >
                      Device-First Storage
                    </Text>
                    <Text
                      style={[
                        styles.privacyItemSub,
                        {
                          color: theme.text.secondary,
                          fontFamily: typography.fonts.uiRegular,
                        },
                      ]}
                    >
                      Raw session events stay in local SQLite on your phone.
                    </Text>
                  </View>
                </View>

                <View style={styles.privacyItem}>
                  <View
                    style={[
                      styles.privacyIconWrap,
                      { backgroundColor: 'rgba(124, 92, 255, 0.15)' },
                    ]}
                  >
                    <Lock size={18} color={theme.accent.violet} />
                  </View>
                  <View style={styles.privacyItemText}>
                    <Text
                      style={[
                        styles.privacyItemTitle,
                        {
                          color: theme.text.primary,
                          fontFamily: typography.fonts.uiSemiBold,
                        },
                      ]}
                    >
                      No Screen Scraping
                    </Text>
                    <Text
                      style={[
                        styles.privacyItemSub,
                        {
                          color: theme.text.secondary,
                          fontFamily: typography.fonts.uiRegular,
                        },
                      ]}
                    >
                      We never read screen content, keystrokes, or messages.
                    </Text>
                  </View>
                </View>

                <View style={[styles.privacyItem, { borderBottomWidth: 0 }]}>
                  <View
                    style={[
                      styles.privacyIconWrap,
                      { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
                    ]}
                  >
                    <ShieldCheck size={18} color={theme.semantic.info} />
                  </View>
                  <View style={styles.privacyItemText}>
                    <Text
                      style={[
                        styles.privacyItemTitle,
                        {
                          color: theme.text.primary,
                          fontFamily: typography.fonts.uiSemiBold,
                        },
                      ]}
                    >
                      Daily Totals Only
                    </Text>
                    <Text
                      style={[
                        styles.privacyItemSub,
                        {
                          color: theme.text.secondary,
                          fontFamily: typography.fonts.uiRegular,
                        },
                      ]}
                    >
                      Only high-level daily aggregates sync for AI reports.
                    </Text>
                  </View>
                </View>
              </Card>
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
                Our Privacy Promise
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
                Your privacy is paramount. Full transparency, zero sale of personal data, export or delete anytime.
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Navigation Row: Pager Dots + CTA Button */}
      <View style={styles.bottomNav}>
        {/* Pager Dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const isActive = idx === currentPage;
            return (
              <Pressable
                key={idx}
                onPress={() => goToPage(idx)}
                hitSlop={8}
                style={[
                  styles.dot,
                  {
                    width: isActive ? 24 : 8,
                    backgroundColor: isActive
                      ? theme.accent.violet
                      : isDark
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.15)',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <Button
          title={currentPage === totalPages - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
          icon={<ArrowRight size={18} color="#FFFFFF" />}
          iconPosition="right"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 54,
    paddingBottom: 36,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    height: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  brandName: {
    fontSize: typography.scale.lg,
    includeFontPadding: false,
  },
  skipText: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  pagesViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  pagesSlider: {
    flexDirection: 'row',
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  heroVisualArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterContent: {
    alignItems: 'center',
  },
  heroHours: {
    fontSize: typography.scale.xl,
    includeFontPadding: false,
  },
  heroSubLabel: {
    fontSize: typography.scale.xs,
    marginTop: 2,
    includeFontPadding: false,
  },
  samplePillsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xl,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  coachCard: {
    width: '100%',
    maxWidth: 340,
  },
  coachCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  coachBadge: {
    backgroundColor: '#7C5CFF',
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  coachCardTitle: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  coachMessage: {
    fontSize: typography.scale.sm,
    lineHeight: typography.lineHeight.sm + 2,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  coachPromptChips: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  privacyCard: {
    width: '100%',
    maxWidth: 340,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  privacyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  privacyItemText: {
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: typography.scale.sm,
    includeFontPadding: false,
  },
  privacyItemSub: {
    fontSize: typography.scale.xs,
    marginTop: 2,
    includeFontPadding: false,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: spacing.md,
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
  bottomNav: {
    paddingHorizontal: layout.screenPadding,
    alignItems: 'center',
    gap: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dot: {
    height: 8,
    borderRadius: layout.borderRadius.pill,
  },
});
