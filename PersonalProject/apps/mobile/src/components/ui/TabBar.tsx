import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeContext';
import { springConfig, triggerHaptic } from '../../theme/motion';
import { layout, spacing, typography, neutralShadow } from '../../theme/tokens';

export interface TabItem {
  id: string;
  label: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  style,
}) => {
  const { theme, isDark } = useTheme();
  const [barWidth, setBarWidth] = useState(0);
  const reducedMotion = useReducedMotion();

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);
  const tabWidth = barWidth > 0 ? (barWidth - spacing.xs * 2) / tabs.length : 0;
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    if (tabWidth > 0 && activeIndex >= 0) {
      const targetX = spacing.xs + activeIndex * tabWidth;
      if (reducedMotion) {
        translateX.value = targetX;
      } else {
        translateX.value = withSpring(targetX, springConfig.default);
      }
    }
  }, [activeIndex, tabWidth, reducedMotion]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth,
    };
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  const handleTabPress = (id: string) => {
    if (id !== activeTab) {
      triggerHaptic.selection();
      onTabChange(id);
    }
  };

  const containerContent = (
    <>
      {/* Sliding Active Pill Indicator */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            animatedIndicatorStyle,
          ]}
        >
          <LinearGradient
            colors={theme.accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.indicatorGradient}
          />
        </Animated.View>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const iconColor = isActive ? '#FFFFFF' : theme.text.tertiary;

          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={styles.tabButton}
            >
              <View style={isActive ? styles.activeIconWrap : undefined}>
                {tab.icon({ color: iconColor, size: 20 })}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: iconColor,
                    fontFamily: isActive
                      ? typography.fonts.uiSemiBold
                      : typography.fonts.uiMedium,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.floatingContainer,
        neutralShadow,
        { borderColor: theme.border.glass },
        style,
      ]}
    >
      {/* Blur background for glass effect */}
      {Platform.OS !== 'web' && (
        <BlurView
          intensity={isDark ? 50 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, styles.blurFill]}
        />
      )}
      {/* Tinted overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? 'rgba(10, 13, 22, 0.70)'
              : 'rgba(255, 255, 255, 0.80)',
            borderRadius: layout.borderRadius.pill,
          },
        ]}
        pointerEvents="none"
      />
      {containerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    height: 64,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    padding: spacing.xs,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: layout.screenPadding,
  },
  blurFill: {
    borderRadius: layout.borderRadius.pill,
  },
  indicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    borderRadius: layout.borderRadius.pill,
    overflow: 'hidden',
  },
  indicatorGradient: {
    ...StyleSheet.absoluteFill,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeIconWrap: {
    // Neon glow halo around active icon — simulated via shadow
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    includeFontPadding: false,
  },
});
