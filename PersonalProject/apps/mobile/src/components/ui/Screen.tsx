import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../theme/ThemeContext';
import { layout } from '../../theme/tokens';

export interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  header?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  edges = ['top', 'left', 'right'],
  header,
  onRefresh,
  refreshing = false,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.safeArea,
        { backgroundColor: theme.background },
        style,
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {header}

      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.accent.violet}
                colors={[theme.accent.violet]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fixedContent, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 40,
  },
  fixedContent: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
});
