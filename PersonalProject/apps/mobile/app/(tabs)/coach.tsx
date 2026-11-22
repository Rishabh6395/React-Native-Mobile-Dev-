import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Sparkles,
  Send,
  RotateCcw,
  Crown,
  Play,
  Clock,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { Screen, Header, Pill, Button, Toast } from '../../src/components/ui';
import { typography, spacing, layout } from '../../src/theme/tokens';
import { triggerHaptic } from '../../src/theme/motion';
import { CoachCard } from '../../src/features/coach/CoachCard';
import { RewardedAdModal } from '../../src/features/coach/RewardedAdModal';
import { QuotaPaywallModal } from '../../src/features/coach/QuotaPaywallModal';
import {
  useCoachQuota,
  DEFAULT_FREE_SUGGESTIONS,
} from '../../src/features/coach/coachQuota';
import {
  generateCoachResponse,
  getCoachUsageSnapshot,
  formatMins,
  CoachMessage,
  AggregatedUsageSnapshot,
} from '../../src/features/coach/coachEngine';

export default function CoachScreen() {
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams<{ initialPrompt?: string }>();

  // Quota & monetization hook
  const {
    suggestionsRemaining,
    isPremium,
    consumeSuggestion,
    resetQuota,
    userEmail,
  } = useCoachQuota();

  // Modals state
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [rewardedAdVisible, setRewardedAdVisible] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'good' | 'alert' | 'nudge' | 'info'>('good');

  // Input state
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [usageSnapshot, setUsageSnapshot] = useState<AggregatedUsageSnapshot | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const handledInitialPrompt = useRef<string | null>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<CoachMessage[]>([]);

  // Load usage context on mount and setup initial greeting
  useEffect(() => {
    getCoachUsageSnapshot().then((snapshot) => {
      setUsageSnapshot(snapshot);

      const topApp = snapshot.topApps[0] || { appName: 'Social Feeds', minutes: 60 };
      const totalStr = formatMins(snapshot.totalMinutes);

      const initialMessage: CoachMessage = {
        id: 'initial_welcome',
        sender: 'coach',
        text: `Hello! I'm your Hourly AI Coach. Today you've logged ${totalStr} of screen time. ${topApp.appName} took the most focus (${formatMins(
          topApp.minutes
        )}).\n\nAsk me anything about where your time went, or choose a quick suggestion below to discover smart habit improvements!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cards: [
          {
            type: 'breakdown',
            title: "Today's Focus Breakdown",
            subtitle: `Total Logged: ${totalStr}`,
            items: snapshot.topApps.slice(0, 3).map((a) => ({
              label: a.appName,
              value: formatMins(a.minutes),
              percent: Math.min(100, Math.round((a.minutes / Math.max(1, snapshot.totalMinutes)) * 100)),
            })),
          },
        ],
        followUpChips: [
          'Want to reduce this screen time?',
          'What is my day on day progress?',
          'Where did my time go today?',
          `How can I cut 30m of ${topApp.appName}?`,
          'Suggest swaps for mindless scrolling',
          'Help me stop late-night phone use',
        ],
      };

      setMessages([initialMessage]);
    });
  }, []);

  // Handle external navigation with initialPrompt param
  useEffect(() => {
    if (params.initialPrompt && handledInitialPrompt.current !== params.initialPrompt && !isGenerating) {
      handledInitialPrompt.current = params.initialPrompt;
      handleSendMessage(params.initialPrompt);
    }
  }, [params.initialPrompt, isGenerating]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Submit a question / suggestion request
  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || inputText).trim();
      if (!query || isGenerating) return;

      // Check Quota before generating!
      const canProceed = isPremium || suggestionsRemaining > 0;
      if (!canProceed) {
        triggerHaptic.warning();
        setPaywallVisible(true);
        return;
      }

      // Consume 1 suggestion
      const result = await consumeSuggestion();
      if (!result.allowed) {
        triggerHaptic.warning();
        setPaywallVisible(true);
        return;
      }

      triggerHaptic.selection();
      setInputText('');

      const userMsg: CoachMessage = {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsGenerating(true);
      scrollToBottom();

      // Simulate natural AI thinking & response generation
      setTimeout(async () => {
        try {
          const aiResponse = await generateCoachResponse(query, usageSnapshot || undefined);

          const coachMsg: CoachMessage = {
            id: `coach_${Date.now()}`,
            sender: 'coach',
            text: aiResponse.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cards: aiResponse.cards,
            followUpChips: aiResponse.followUpChips,
          };

          setMessages((prev) => [...prev, coachMsg]);
          setIsGenerating(false);
          triggerHaptic.success();
          scrollToBottom();

          // If quota reached 0 after this message, gently hint
          if (!isPremium && result.remaining === 0) {
            setTimeout(() => {
              setToastMessage('You used your 10th free suggestion. Tap quota pill for more!');
              setToastType('nudge');
            }, 1000);
          }
        } catch (e) {
          console.warn('[CoachScreen] Generation error:', e);
          setIsGenerating(false);
        }
      }, 650);
    },
    [inputText, isGenerating, isPremium, suggestionsRemaining, consumeSuggestion, usageSnapshot]
  );

  const handleResetConversation = () => {
    triggerHaptic.selection();
    if (!usageSnapshot) return;
    const topApp = usageSnapshot.topApps[0] || { appName: 'Social Feeds', minutes: 60 };
    const totalStr = formatMins(usageSnapshot.totalMinutes);

    setMessages([
      {
        id: `reset_${Date.now()}`,
        sender: 'coach',
        text: `Fresh session started! You've logged ${totalStr} today. Ask me any question or pick a topic below:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUpChips: [
          'Where did my time go today?',
          `How can I cut 30m of ${topApp.appName}?`,
          'Suggest swaps for mindless scrolling',
          'Create a 2-week gradual reduction plan',
        ],
      },
    ]);
    setToastMessage('Conversation reset');
    setToastType('info');
  };

  const handleRewardClaimed = (newRemaining: number) => {
    setToastMessage(`🎉 3 AI suggestions unlocked! (${newRemaining} remaining)`);
    setToastType('good');
  };

  const handleUpgraded = () => {
    setToastMessage('👑 Hourly Pro unlocked! Unlimited AI coaching active.');
    setToastType('good');
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <Screen
      header={
        <Header
          title="Coach"
          largeTitle
          rightAction={
            <View style={styles.headerRightRow}>
              {/* Quota Badge Button */}
              <Pressable
                onPress={() => {
                  triggerHaptic.selection();
                  setPaywallVisible(true);
                }}
                style={[
                  styles.quotaBadge,
                  isPremium
                    ? { backgroundColor: '#F59E0B25', borderColor: '#F59E0B70' }
                    : suggestionsRemaining === 0
                    ? { backgroundColor: theme.semantic.alert + '20', borderColor: theme.semantic.alert + '60' }
                    : { backgroundColor: theme.accent.violet + '20', borderColor: theme.accent.violet + '60' },
                ]}
              >
                {isPremium ? (
                  <>
                    <Crown size={12} color="#F59E0B" />
                    <Text style={[styles.quotaBadgeText, { color: '#F59E0B' }]}>PRO</Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} color={suggestionsRemaining === 0 ? theme.semantic.alert : theme.accent.aqua} />
                    <Text
                      style={[
                        styles.quotaBadgeText,
                        {
                          color: suggestionsRemaining === 0 ? theme.semantic.alert : theme.text.primary,
                          fontFamily: typography.fonts.numbersBold,
                        },
                      ]}
                    >
                      {suggestionsRemaining} Left
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Reset Session Icon */}
              <Pressable onPress={handleResetConversation} style={styles.iconButton}>
                <RotateCcw size={16} color={theme.text.tertiary} />
              </Pressable>
            </View>
          }
        />
      }
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Connected Account & Free AI Model Strip */}
        <View style={[styles.accountStrip, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.08)', borderColor: theme.border.glass }]}>
          <View style={styles.accountStripLeft}>
            <Sparkles size={13} color={theme.accent.violet} />
            <Text style={[styles.accountStripText, { color: theme.text.primary, fontFamily: typography.fonts.uiMedium }]} numberOfLines={1}>
              {userEmail ? `${userEmail} • Gemini & ChatGPT Free Tier` : 'Hourly AI • Connected to Phone Activity'}
            </Text>
          </View>
          {usageSnapshot && (
            <View style={[styles.dodTag, { backgroundColor: `${usageSnapshot.dayOnDayDirection === 'down' ? theme.semantic.good : theme.semantic.nudge}18` }]}>
              <Text style={[styles.dodTagText, { color: usageSnapshot.dayOnDayDirection === 'down' ? theme.semantic.good : theme.semantic.nudge, fontFamily: typography.fonts.uiSemiBold }]}>
                DoD {usageSnapshot.dayOnDayDirection === 'down' ? '-' : '+'}{Math.abs(usageSnapshot.dayOnDayDeltaMinutes)}m
              </Text>
            </View>
          )}
        </View>

        {/* Real-time Usage Snapshot Strip */}
        {usageSnapshot && (
          <View style={[styles.usageBanner, { backgroundColor: theme.card.highlight }]}>
            <Clock size={13} color={theme.accent.aqua} />
            <Text style={[styles.usageBannerText, { color: theme.text.secondary }]}>
              Logged today:{' '}
              <Text style={{ color: theme.text.primary, fontFamily: typography.fonts.numbersBold }}>
                {formatMins(usageSnapshot.totalMinutes)}
              </Text>{' '}
              • Top:{' '}
              <Text style={{ color: theme.accent.aqua, fontFamily: typography.fonts.uiSemiBold }}>
                {usageSnapshot.topApps[0]?.appName || 'None'} (
                {formatMins(usageSnapshot.topApps[0]?.minutes || 0)})
              </Text>
            </Text>
          </View>
        )}

        {/* Message Stream */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.sender === 'user' ? styles.userMessageWrapper : styles.coachMessageWrapper,
              ]}
            >
              {msg.sender === 'coach' && (
                <View style={styles.coachAvatar}>
                  <Sparkles size={14} color="#FFFFFF" />
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  msg.sender === 'user'
                    ? [styles.userBubble, { backgroundColor: theme.accent.violet }]
                    : [
                        styles.coachBubble,
                        {
                          backgroundColor: theme.card.elevated,
                          borderColor: theme.border.subtle,
                        },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    {
                      color: msg.sender === 'user' ? '#FFFFFF' : theme.text.primary,
                      fontFamily: typography.fonts.uiRegular,
                    },
                  ]}
                >
                  {msg.text}
                </Text>

                {/* Structured Cards (if any) */}
                {msg.cards?.map((card, cIdx) => (
                  <View key={cIdx} style={styles.cardSpacing}>
                    <CoachCard
                      card={card}
                      onGoalAdded={(pkg, limit) => {
                        setToastMessage(`Limit goal set for ${limit}m daily!`);
                        setToastType('good');
                      }}
                    />
                  </View>
                ))}

                <Text
                  style={[
                    styles.timestamp,
                    { color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : theme.text.tertiary },
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          ))}

          {/* Typing / Generating Indicator */}
          {isGenerating && (
            <View style={[styles.messageWrapper, styles.coachMessageWrapper]}>
              <View style={styles.coachAvatar}>
                <Sparkles size={14} color="#FFFFFF" />
              </View>
              <View
                style={[
                  styles.bubble,
                  styles.coachBubble,
                  styles.typingBubble,
                  {
                    backgroundColor: theme.card.elevated,
                    borderColor: theme.border.subtle,
                  },
                ]}
              >
                <View style={styles.typingDotRow}>
                  <View style={[styles.typingDot, { backgroundColor: theme.accent.aqua }]} />
                  <View style={[styles.typingDot, { backgroundColor: theme.accent.violet }]} />
                  <View style={[styles.typingDot, { backgroundColor: theme.accent.aqua }]} />
                </View>
                <Text style={[styles.typingText, { color: theme.text.tertiary }]}>
                  Analyzing your usage patterns...
                </Text>
              </View>
            </View>
          )}

          {/* Quick Follow-up Prompt Chips (from last message) */}
          {!isGenerating && lastMessage?.followUpChips && lastMessage.followUpChips.length > 0 && (
            <View style={styles.chipsSection}>
              <Text style={[styles.chipsHeading, { color: theme.text.tertiary }]}>
                Quick Suggestions:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {lastMessage.followUpChips.map((chip, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleSendMessage(chip)}
                    style={[
                      styles.promptChip,
                      {
                        backgroundColor: theme.card.highlight,
                        borderColor: theme.border.active,
                      },
                    ]}
                  >
                    <Zap size={12} color={theme.accent.aqua} />
                    <Text style={[styles.promptChipText, { color: theme.text.primary }]}>
                      {chip}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Bottom Composer & Quota Indicator */}
        <View style={[styles.composerArea, { backgroundColor: theme.background }]}>
          {/* Quota Mini Bar */}
          <View style={styles.composerQuotaRow}>
            {isPremium ? (
              <View style={styles.quotaNoticeRow}>
                <Crown size={12} color="#F59E0B" />
                <Text style={[styles.quotaNoticeText, { color: '#F59E0B' }]}>
                  Pro Plan • Unlimited Suggestions
                </Text>
              </View>
            ) : suggestionsRemaining > 0 ? (
              <View style={styles.quotaNoticeRow}>
                <Sparkles size={11} color={theme.accent.aqua} />
                <Text style={[styles.quotaNoticeText, { color: theme.text.tertiary }]}>
                  {suggestionsRemaining} of {DEFAULT_FREE_SUGGESTIONS} free suggestions left
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => setPaywallVisible(true)}
                style={styles.quotaExhaustedBanner}
              >
                <Play size={11} color={theme.semantic.alert} />
                <Text style={[styles.quotaExhaustedText, { color: theme.semantic.alert }]}>
                  0 suggestions left • Tap to Watch 30s Ad (+3) or Upgrade
                </Text>
              </Pressable>
            )}
          </View>

          {/* Input Box */}
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: theme.card.elevated,
                borderColor: theme.border.subtle,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.text.primary,
                  fontFamily: typography.fonts.uiRegular,
                },
              ]}
              placeholder={
                suggestionsRemaining > 0 || isPremium
                  ? 'Ask where your time went or how to improve...'
                  : 'Watch ad or upgrade to ask questions...'
              }
              placeholderTextColor={theme.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={300}
              onSubmitEditing={() => handleSendMessage()}
            />

            <Pressable
              onPress={() => handleSendMessage()}
              disabled={isGenerating || (!inputText.trim() && suggestionsRemaining > 0)}
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputText.trim() || suggestionsRemaining === 0
                      ? theme.accent.violet
                      : theme.card.highlight,
                },
              ]}
            >
              {suggestionsRemaining === 0 && !isPremium ? (
                <Crown size={16} color="#FFFFFF" />
              ) : (
                <Send size={16} color={inputText.trim() ? '#FFFFFF' : theme.text.tertiary} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Paywall & Unlock Modal */}
      <QuotaPaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onWatchAd={() => setRewardedAdVisible(true)}
        onUpgraded={handleUpgraded}
        remainingSuggestions={suggestionsRemaining}
      />

      {/* 30-Second Rewarded Ad Simulator Modal */}
      <RewardedAdModal
        visible={rewardedAdVisible}
        onClose={() => setRewardedAdVisible(false)}
        onRewardClaimed={handleRewardClaimed}
      />

      {/* Toast notifications */}
      <Toast
        visible={!!toastMessage}
        message={toastMessage || ''}
        type={toastType}
        onDismiss={() => setToastMessage(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quotaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  quotaBadgeText: {
    fontSize: 11,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  accountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
  },
  accountStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: spacing.xs,
  },
  accountStripText: {
    fontSize: 11,
    includeFontPadding: false,
  },
  dodTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dodTagText: {
    fontSize: 10,
    includeFontPadding: false,
  },
  usageBannerText: {
    fontSize: 11,
  },
  messagesList: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  coachMessageWrapper: {
    justifyContent: 'flex-start',
  },
  coachAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubble: {
    maxWidth: '82%',
    padding: spacing.sm,
    borderRadius: layout.borderRadius.card,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  coachBubble: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: typography.scale.sm,
    lineHeight: 22,
  },
  cardSpacing: {
    marginTop: spacing.xs,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  typingDotRow: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typingText: {
    fontSize: 11,
  },
  chipsSection: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  chipsHeading: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    gap: spacing.xs,
    paddingVertical: 4,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: typography.scale.xs,
  },
  composerArea: {
    paddingHorizontal: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.base,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  composerQuotaRow: {
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  quotaNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quotaNoticeText: {
    fontSize: 11,
  },
  quotaExhaustedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  quotaExhaustedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: layout.borderRadius.card,
    borderWidth: 1,
    paddingLeft: spacing.sm,
    paddingRight: 6,
    paddingVertical: 4,
    minHeight: 46,
  },
  textInput: {
    flex: 1,
    fontSize: typography.scale.sm,
    maxHeight: 90,
    paddingVertical: 6,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
