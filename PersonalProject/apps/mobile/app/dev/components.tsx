import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Sparkles,
  Flame,
  Calendar,
  MessageSquare,
  Target,
  Sun,
  Moon,
  Home as HomeIcon,
  BarChart3,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  Screen,
  Header,
  Card,
  GlowCard,
  Button,
  Pill,
  SegmentedControl,
  AnimatedNumber,
  ProgressRing,
  AppIcon,
  Skeleton,
  EmptyState,
  Toast,
  ToastType,
  Sheet,
  TabBar,
} from '../../src/components/ui';
import { layout, spacing, typography } from '../../src/theme/tokens';

export default function ComponentsGalleryScreen() {
  const { theme, isDark, setMode } = useTheme();

  // Component demo states
  const [selectedSegment, setSelectedSegment] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState('home');
  const [countTarget, setCountTarget] = useState(248);
  const [ringProgress, setRingProgress] = useState(0.72);
  const [pillActive, setPillActive] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');

  const showToast = (msg: string, type: ToastType) => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const demoTabs = [
    {
      id: 'home',
      label: 'Home',
      icon: ({ color, size }: { color: string; size: number }) => (
        <HomeIcon color={color} size={size} />
      ),
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: ({ color, size }: { color: string; size: number }) => (
        <BarChart3 color={color} size={size} />
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: ({ color, size }: { color: string; size: number }) => (
        <FileText color={color} size={size} />
      ),
    },
    {
      id: 'coach',
      label: 'Coach',
      icon: ({ color, size }: { color: string; size: number }) => (
        <MessageSquare color={color} size={size} />
      ),
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: ({ color, size }: { color: string; size: number }) => (
        <Target color={color} size={size} />
      ),
    },
  ];

  return (
    <Screen
      scrollable
      header={
        <Header
          title="Component Gallery"
          subtitle="Hourly Design System (Phase 2 DoD)"
          largeTitle
          rightAction={
            <Button
              title={isDark ? 'Light' : 'Dark'}
              size="sm"
              variant="secondary"
              icon={isDark ? <Sun size={14} color={theme.text.primary} /> : <Moon size={14} color={theme.text.primary} />}
              onPress={() => setMode(isDark ? 'light' : 'dark')}
            />
          }
        />
      }
    >
      {/* Toast Host */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />

      {/* 1. Theme Status Bar */}
      <Card style={styles.sectionCard} variant="elevated">
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          Current Theme: {isDark ? 'Dark Mode' : 'Light Mode'}
        </Text>
        <Text style={[styles.sectionSub, { color: theme.text.secondary }]}>
          Deep ink background (#0B0D12), 1px border at 6% white, Space Grotesk numerals & Plus Jakarta Sans typography.
        </Text>
      </Card>

      {/* 2. Progress Ring & Animated Number */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          Hero ProgressRing & AnimatedNumber
        </Text>
      </View>
      <Card style={styles.centerCard}>
        <ProgressRing
          progress={ringProgress}
          size={160}
          strokeWidth={14}
        >
          <View style={styles.ringInner}>
            <AnimatedNumber
              value={countTarget}
              format={(n) => {
                const hours = Math.floor(n / 60);
                const mins = n % 60;
                return `${hours}h ${mins}m`;
              }}
              style={[styles.bigNumber, { color: theme.text.primary }]}
            />
            <Text style={[styles.ringSub, { color: theme.semantic.good }]}>
              ↓ 42m less than avg
            </Text>
          </View>
        </ProgressRing>

        <View style={styles.rowButtons}>
          <Button
            title="Randomize Time"
            size="sm"
            variant="secondary"
            onPress={() => {
              const newMin = Math.floor(Math.random() * 300) + 60;
              setCountTarget(newMin);
              setRingProgress(Math.min(newMin / 360, 1));
            }}
          />
        </View>
      </Card>

      {/* 3. SegmentedControl */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          SegmentedControl (Animated Thumb)
        </Text>
      </View>
      <SegmentedControl
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
        value={selectedSegment}
        onChange={setSelectedSegment}
      />

      {/* 4. GlowCard (Coach Insight) */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          GlowCard (Insight Card)
        </Text>
      </View>
      <GlowCard padding="base">
        <View style={styles.glowHeader}>
          <View style={[styles.iconPill, { backgroundColor: theme.accent.violet }]}>
            <Sparkles size={14} color="#FFFFFF" />
          </View>
          <Text style={[styles.glowTitle, { color: theme.text.primary }]}>
            Coach Insight • Balanced Day
          </Text>
        </View>
        <Text style={[styles.glowBody, { color: theme.text.secondary }]}>
          You spent 54m less on video apps today. Your wind-down session started 30m earlier than yesterday.
        </Text>
      </GlowCard>

      {/* 5. Buttons & States */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          Buttons & States
        </Text>
      </View>
      <View style={styles.buttonGrid}>
        <Button
          title="Primary Gradient"
          onPress={() => showToast('Primary button pressed', 'good')}
          variant="primary"
          icon={<Sparkles size={16} color="#FFFFFF" />}
        />
        <Button
          title="Secondary Surface"
          onPress={() => showToast('Secondary button pressed', 'info')}
          variant="secondary"
        />
        <Button
          title="Ghost Button"
          onPress={() => showToast('Ghost button pressed', 'info')}
          variant="ghost"
        />
        <Button
          title="Danger Button"
          onPress={() => showToast('Danger action', 'alert')}
          variant="danger"
        />
        <Button
          title="Loading State"
          onPress={() => {}}
          loading
          variant="primary"
        />
        <Button
          title="Disabled Button"
          onPress={() => {}}
          disabled
          variant="secondary"
        />
      </View>

      {/* 6. Pills & Chips */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          Pills & Chips
        </Text>
      </View>
      <View style={styles.chipRow}>
        <Pill
          label="Active Pill"
          active={pillActive}
          onPress={() => setPillActive(!pillActive)}
          badge="12"
        />
        <Pill
          label="Inactive Pill"
          active={false}
          onPress={() => setPillActive(true)}
        />
        <Pill
          label="With Icon"
          icon={<Flame size={14} color="#F59E0B" />}
          variant="pill"
          size="sm"
        />
        <Pill
          label="Chip Filter"
          variant="chip"
          size="sm"
          badge="4h"
        />
      </View>

      {/* 7. App Icons */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          App Icons (Brand & Hash Fallback)
        </Text>
      </View>
      <Card style={styles.appIconRow}>
        <AppIcon packageName="com.google.android.youtube" appName="YouTube" size={48} />
        <AppIcon packageName="com.spotify.music" appName="Spotify" size={48} />
        <AppIcon packageName="com.instagram.android" appName="Instagram" size={48} />
        <AppIcon packageName="com.netflix.mediaclient" appName="Netflix" size={48} />
        <AppIcon packageName="com.unknown.app.reading" appName="Books" size={48} />
        <AppIcon packageName="com.custom.productivity" appName="Tasks" size={48} />
      </Card>

      {/* 8. Skeletons */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          Shimmering Skeletons
        </Text>
      </View>
      <Card style={styles.skeletonCard}>
        <View style={styles.skeletonRow}>
          <Skeleton variant="circle" width={44} height={44} />
          <View style={styles.skeletonTextCol}>
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="45%" height={12} style={{ marginTop: 6 }} />
          </View>
        </View>
        <Skeleton variant="rect" width="100%" height={32} style={{ marginTop: 12 }} />
      </Card>

      {/* 9. Interactive Sheet & Toasts Trigger */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          Interactive Sheet & Toast Triggers
        </Text>
      </View>
      <View style={styles.buttonGrid}>
        <Button
          title="Open Bottom Sheet"
          variant="primary"
          onPress={() => setSheetOpen(true)}
        />
        <Button
          title="Trigger Good Toast"
          variant="secondary"
          onPress={() => showToast('Weekly goal achieved! (-1h 15m)', 'good')}
        />
        <Button
          title="Trigger Nudge Toast"
          variant="secondary"
          onPress={() => showToast('Approaching 80% of Instagram limit', 'nudge')}
        />
        <Button
          title="Trigger Alert Toast"
          variant="secondary"
          onPress={() => showToast('Daily limit reached for TikTok', 'alert')}
        />
      </View>

      {/* 10. Empty State Demonstration */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          Empty State
        </Text>
      </View>
      <Card>
        <EmptyState
          icon={<Calendar size={40} color={theme.accent.violet} />}
          title="No usage recorded yet"
          description="Your daily app timeline will appear here as you use your device throughout the day."
          actionTitle="Refresh Now"
          onAction={() => showToast('Refreshed SQLite cache', 'info')}
        />
      </Card>

      {/* 11. Custom Floating TabBar */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>
          Floating Pill TabBar (Shared Spring)
        </Text>
      </View>
      <View style={styles.tabBarWrapper}>
        <TabBar
          tabs={demoTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      {/* Bottom Sheet Component */}
      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Quick Time Swap"
        subtitle="Coach recommendation based on your habits"
      >
        <Text style={[styles.sheetContentText, { color: theme.text.secondary }]}>
          Instead of 45 minutes of late-night shorts, how about an episode of a documentary or 15 minutes with your reading list?
        </Text>
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title="Accept Swap Suggestion"
            variant="primary"
            fullWidth
            onPress={() => {
              setSheetOpen(false);
              showToast('Swap logged in Content Log!', 'good');
            }}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.scale.base,
    fontFamily: typography.fonts.uiSemiBold,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: typography.scale.xs,
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  heading: {
    fontSize: typography.scale.sm,
    fontFamily: typography.fonts.uiSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  ringInner: {
    alignItems: 'center',
  },
  bigNumber: {
    fontSize: typography.scale.xl,
  },
  ringSub: {
    fontSize: typography.scale.xs,
    marginTop: 2,
  },
  rowButtons: {
    marginTop: spacing.md,
  },
  glowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconPill: {
    width: 22,
    height: 22,
    borderRadius: layout.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  glowTitle: {
    fontSize: typography.scale.sm,
    fontFamily: typography.fonts.uiSemiBold,
  },
  glowBody: {
    fontSize: typography.scale.sm,
    lineHeight: 22,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  appIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  skeletonCard: {
    padding: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonTextCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tabBarWrapper: {
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  sheetContentText: {
    fontSize: typography.scale.sm,
    lineHeight: 22,
  },
});
