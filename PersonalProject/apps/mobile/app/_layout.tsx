import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/api';
import { useEffect } from 'react';
import { registerBackgroundSync } from '../src/features/sync/BackgroundSync';

export default function Layout() {
  useEffect(() => {
    registerBackgroundSync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="app-detail" />
            <Stack.Screen name="dev" />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
