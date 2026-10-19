import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  VolumeX,
  X,
  Sparkles,
  CheckCircle2,
  Play,
  Star,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { typography, spacing, layout } from '../../theme/tokens';
import { Button } from '../../components/ui';
import { triggerHaptic } from '../../theme/motion';
import { unlockSuggestionsFromAd } from './coachQuota';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RewardedAdModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardClaimed: (newRemaining: number) => void;
}

const AD_DURATION_SECONDS = 30;

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  visible,
  onClose,
  onRewardClaimed,
}) => {
  const { theme } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SECONDS);
  const [isCompleted, setIsCompleted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [waveStep, setWaveStep] = useState(0);

  const timerRef = useRef<any>(null);

  // Soundwave animation ticker
  useEffect(() => {
    if (!visible || isCompleted) return;
    const interval = setInterval(() => {
      setWaveStep((prev) => (prev + 1) % 6);
    }, 250);
    return () => clearInterval(interval);
  }, [visible, isCompleted]);

  // 30s countdown timer
  useEffect(() => {
    if (visible) {
      setSecondsLeft(AD_DURATION_SECONDS);
      setIsCompleted(false);

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsCompleted(true);
            triggerHaptic.success();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  const handleAttemptClose = () => {
    triggerHaptic.selection();
    if (isCompleted) {
      onClose();
      return;
    }

    Alert.alert(
      'Leave early?',
      `Watch the remaining ${secondsLeft}s to unlock +3 free AI suggestions.`,
      [
        { text: 'Keep Watching', style: 'cancel' },
        {
          text: 'Leave Without Reward',
          style: 'destructive',
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            onClose();
          },
        },
      ]
    );
  };

  const handleClaimReward = async () => {
    triggerHaptic.success();
    const updated = await unlockSuggestionsFromAd();
    onRewardClaimed(updated.suggestionsRemaining);
    onClose();
  };

  const progressPct = Math.round(
    ((AD_DURATION_SECONDS - secondsLeft) / AD_DURATION_SECONDS) * 100
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleAttemptClose}
    >
      <View style={styles.backdrop}>
        {/* Ad Container */}
        <LinearGradient
          colors={['#0F121A', '#0B0D12']}
          style={styles.modalContent}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.sponsorBadge}>
              <Text style={styles.sponsorText}>SPONSORED REWARD</Text>
            </View>

            <View style={styles.topRightControls}>
              <Pressable
                onPress={() => setMuted(!muted)}
                style={styles.iconCircle}
              >
                {muted ? (
                  <VolumeX size={16} color="#FFFFFF" />
                ) : (
                  <Volume2 size={16} color="#FFFFFF" />
                )}
              </Pressable>

              <View style={styles.timerBadge}>
                {isCompleted ? (
                  <CheckCircle2 size={14} color={theme.semantic.good} />
                ) : (
                  <Text style={styles.timerBadgeText}>{secondsLeft}s</Text>
                )}
              </View>

              <Pressable
                onPress={handleAttemptClose}
                style={[
                  styles.iconCircle,
                  !isCompleted && { opacity: 0.75 },
                ]}
              >
                <X size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Progress Line */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressPct}%`,
                  backgroundColor: isCompleted
                    ? theme.semantic.good
                    : theme.accent.aqua,
                },
              ]}
            />
          </View>

          {/* Ad Hero Presentation */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[theme.accent.violet + '30', theme.accent.aqua + '20']}
              style={styles.visualizerCard}
            >
              {/* Animated Soundwave bars */}
              <View style={styles.waveRow}>
                {[18, 42, 65, 34, 52, 28, 60, 45, 22].map((height, idx) => {
                  const dynamicHeight = isCompleted
                    ? 30
                    : Math.max(12, ((height + waveStep * 8) % 60) + 12);
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.waveBar,
                        {
                          height: dynamicHeight,
                          backgroundColor:
                            idx % 2 === 0
                              ? theme.accent.aqua
                              : theme.accent.violet,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              <View style={styles.adHeroInfo}>
                <View style={styles.appIconMock}>
                  <Sparkles size={24} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.adTitle,
                    { fontFamily: typography.fonts.uiBold },
                  ]}
                >
                  FocusFlow Audio
                </Text>
                <Text style={styles.adSubtitle}>
                  Binaural beats & ambient soundscapes for deep concentration & sleep.
                </Text>

                <View style={styles.ratingRow}>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        color="#F59E0B"
                        fill="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>4.9 (142k ratings)</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Feature Highlights */}
            <View style={styles.featuresRow}>
              <View style={styles.featurePill}>
                <ShieldCheck size={12} color={theme.accent.aqua} />
                <Text style={styles.featurePillText}>100% Ad-Free Audio</Text>
              </View>
              <View style={styles.featurePill}>
                <Sparkles size={12} color={theme.accent.violet} />
                <Text style={styles.featurePillText}>Offline Sleep Mode</Text>
              </View>
            </View>
          </View>

          {/* Reward Footer */}
          <View style={styles.footer}>
            {isCompleted ? (
              <View style={styles.completedContainer}>
                <View
                  style={[
                    styles.rewardHeaderBox,
                    { backgroundColor: theme.semantic.good + '20' },
                  ]}
                >
                  <CheckCircle2 size={20} color={theme.semantic.good} />
                  <Text
                    style={[
                      styles.rewardSuccessTitle,
                      { color: theme.semantic.good },
                    ]}
                  >
                    3 Suggestions Unlocked!
                  </Text>
                </View>

                <Button
                  title="Claim +3 AI Suggestions"
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<Sparkles size={18} color="#FFFFFF" />}
                  onPress={handleClaimReward}
                />
              </View>
            ) : (
              <View style={styles.waitingContainer}>
                <Text style={styles.waitingText}>
                  Watching ad... Reward unlocks in{' '}
                  <Text
                    style={{
                      color: theme.accent.aqua,
                      fontFamily: typography.fonts.numbersBold,
                    }}
                  >
                    {secondsLeft}s
                  </Text>
                </Text>
                <Text style={styles.waitingSubtext}>
                  Watch until the end to claim +3 screen time suggestions.
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderRadius: layout.borderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    padding: spacing.base,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sponsorBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sponsorText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 44,
    alignItems: 'center',
  },
  timerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  visualizerCard: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: layout.borderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 70,
    marginBottom: spacing.md,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  adHeroInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  appIconMock: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  adTitle: {
    color: '#FFFFFF',
    fontSize: typography.scale.base,
  },
  adSubtitle: {
    color: '#94A3B8',
    fontSize: typography.scale.xs,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: layout.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featurePillText: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  footer: {
    marginTop: spacing.lg,
  },
  waitingContainer: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  waitingText: {
    color: '#FFFFFF',
    fontSize: typography.scale.sm,
  },
  waitingSubtext: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
  completedContainer: {
    gap: spacing.sm,
  },
  rewardHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: layout.borderRadius.md,
  },
  rewardSuccessTitle: {
    fontSize: typography.scale.sm,
    fontWeight: '700',
  },
});
