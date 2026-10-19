import React from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Zap,
  Play,
  CheckCircle,
  Crown,
  ShieldCheck,
  X,
  TrendingDown,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { typography, spacing, layout } from '../../theme/tokens';
import { Button, Card, Pill } from '../../components/ui';
import { triggerHaptic } from '../../theme/motion';
import { upgradeToPremium } from './coachQuota';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuotaPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onWatchAd: () => void;
  onUpgraded: () => void;
  remainingSuggestions: number;
}

export const QuotaPaywallModal: React.FC<QuotaPaywallModalProps> = ({
  visible,
  onClose,
  onWatchAd,
  onUpgraded,
  remainingSuggestions,
}) => {
  const { theme } = useTheme();

  const handleUpgrade = async () => {
    triggerHaptic.success();
    await upgradeToPremium();
    onUpgraded();
    onClose();
  };

  const handleWatchAdPress = () => {
    triggerHaptic.selection();
    onClose();
    onWatchAd();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.card.base }]}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={[styles.crownCircle, { backgroundColor: theme.accent.violet }]}>
                <Crown size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.headerTitle, { color: theme.text.primary, fontFamily: typography.fonts.uiBold }]}>
                AI Coach Suggestions
              </Text>
            </View>
            <Button
              title=""
              variant="ghost"
              size="sm"
              icon={<X size={18} color={theme.text.secondary} />}
              onPress={onClose}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Status Headline */}
            <View style={styles.statusBox}>
              <Pill
                label={
                  remainingSuggestions === 0
                    ? 'Free Suggestions Exhausted (0/10)'
                    : `${remainingSuggestions} Free Suggestions Left`
                }
                size="sm"
                style={{
                  backgroundColor:
                    remainingSuggestions === 0 ? theme.semantic.alert + '20' : theme.accent.aqua + '20',
                  borderColor:
                    remainingSuggestions === 0 ? theme.semantic.alert + '60' : theme.accent.aqua + '60',
                }}
              />
              <Text
                style={[
                  styles.headline,
                  { color: theme.text.primary, fontFamily: typography.fonts.uiBold },
                ]}
              >
                {remainingSuggestions === 0
                  ? 'Ready for more AI guidance?'
                  : 'Upgrade or watch an ad to extend your quota'}
              </Text>
              <Text style={[styles.subheadline, { color: theme.text.secondary }]}>
                Our AI coach helps thousands of users understand where their time goes and build sustainable digital focus.
              </Text>
            </View>

            {/* Option 1: Buy Premium (Hourly Pro) */}
            <View style={styles.optionContainer}>
              <LinearGradient
                colors={[theme.accent.violet + '25', theme.accent.aqua + '15']}
                style={[styles.proCard, { borderColor: theme.accent.violet + '60' }]}
              >
                <View style={styles.proCardHeader}>
                  <View style={styles.proTitleRow}>
                    <Crown size={18} color="#F59E0B" />
                    <Text
                      style={[
                        styles.proTitle,
                        { color: theme.text.primary, fontFamily: typography.fonts.uiBold },
                      ]}
                    >
                      Hourly Pro
                    </Text>
                  </View>
                  <Pill label="BEST VALUE" size="sm" active />
                </View>

                <Text style={[styles.proPriceText, { color: theme.text.primary, fontFamily: typography.fonts.numbersBold }]}>
                  $4.99 <Text style={styles.proPriceSub}>/ month (7-day free trial)</Text>
                </Text>

                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <CheckCircle size={15} color={theme.accent.aqua} />
                    <Text style={[styles.featureText, { color: theme.text.primary }]}>
                      Unlimited AI Coach suggestions & chats
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle size={15} color={theme.accent.aqua} />
                    <Text style={[styles.featureText, { color: theme.text.primary }]}>
                      Personalized 2-4 week gradual reduction plans
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle size={15} color={theme.accent.aqua} />
                    <Text style={[styles.featureText, { color: theme.text.primary }]}>
                      Deep habit loop & doomscroll detection
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle size={15} color={theme.accent.aqua} />
                    <Text style={[styles.featureText, { color: theme.text.primary }]}>
                      100% ad-free experience forever
                    </Text>
                  </View>
                </View>

                <Button
                  title="Upgrade to Pro (Instant Unlock)"
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<Crown size={18} color="#FFFFFF" />}
                  onPress={handleUpgrade}
                />
              </LinearGradient>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.card.highlight }]} />
              <Text style={[styles.dividerText, { color: theme.text.tertiary }]}>OR FREE REWARD</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.card.highlight }]} />
            </View>

            {/* Option 2: Watch 30s Ad (+3 Suggestions) */}
            <Card style={styles.adCard} padding="base">
              <View style={styles.adCardHeader}>
                <View style={[styles.playIconCircle, { backgroundColor: theme.accent.aqua + '20' }]}>
                  <Play size={16} color={theme.accent.aqua} fill={theme.accent.aqua} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.adCardTitle, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
                    Watch 30s Ad (+3 Suggestions)
                  </Text>
                  <Text style={[styles.adCardSub, { color: theme.text.secondary }]}>
                    Watch a sponsored video to unlock 3 more free AI answers immediately.
                  </Text>
                </View>
              </View>

              <Button
                title="Watch 30s Ad (+3 Suggestions)"
                variant="secondary"
                size="md"
                fullWidth
                icon={<Play size={16} color={theme.text.primary} />}
                onPress={handleWatchAdPress}
              />
            </Card>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: layout.borderRadius.card,
    borderTopRightRadius: layout.borderRadius.card,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  crownCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.scale.base,
  },
  scrollContent: {
    gap: spacing.base,
    paddingBottom: spacing.lg,
  },
  statusBox: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  headline: {
    fontSize: typography.scale.lg,
    lineHeight: 28,
    marginTop: 4,
  },
  subheadline: {
    fontSize: typography.scale.xs,
    lineHeight: 18,
  },
  optionContainer: {
    marginTop: spacing.xs,
  },
  proCard: {
    padding: spacing.base,
    borderRadius: layout.borderRadius.card,
    borderWidth: 1,
    gap: spacing.sm,
  },
  proCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  proTitle: {
    fontSize: typography.scale.base,
  },
  proPriceText: {
    fontSize: 22,
  },
  proPriceSub: {
    fontSize: typography.scale.xs,
    fontWeight: 'normal',
    color: '#94A3B8',
  },
  featuresList: {
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: typography.scale.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  adCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  adCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adCardTitle: {
    fontSize: typography.scale.sm,
  },
  adCardSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
});
