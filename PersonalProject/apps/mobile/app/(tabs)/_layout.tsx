import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Home,
  BarChart3,
  FileText,
  MessageCircle,
} from 'lucide-react-native';
import { TabBar, TabItem } from '../../src/components/ui/TabBar';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing } from '../../src/theme/tokens';

const TAB_ITEMS: TabItem[] = [
  {
    id: 'index',
    label: 'Home',
    icon: ({ color, size }) => <Home size={size} color={color} />,
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: ({ color, size }) => <BarChart3 size={size} color={color} />,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: ({ color, size }) => <FileText size={size} color={color} />,
  },
  {
    id: 'coach',
    label: 'Coach',
    icon: ({ color, size }) => <MessageCircle size={size} color={color} />,
  },
];

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={({ state, navigation }) => {
          const activeRoute = state.routes[state.index]?.name ?? 'index';
          return (
            <View style={styles.tabBarWrapper}>
              <TabBar
                tabs={TAB_ITEMS}
                activeTab={activeRoute}
                onTabChange={(id) => {
                  const route = state.routes.find((r) => r.name === id);
                  if (route) {
                    navigation.navigate(route.name);
                  }
                }}
              />
            </View>
          );
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="stats" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="coach" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarWrapper: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
