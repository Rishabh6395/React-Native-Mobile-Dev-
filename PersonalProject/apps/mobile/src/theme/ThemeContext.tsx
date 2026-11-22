import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from './tokens';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  fontsLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  mode: 'dark',
  setMode: () => {},
  isDark: true,
  fontsLoaded: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark');

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemScheme]);

  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, isDark, fontsLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
