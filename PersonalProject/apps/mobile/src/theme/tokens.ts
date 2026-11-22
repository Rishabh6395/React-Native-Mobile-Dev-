import { Platform } from 'react-native';

/**
 * Design Tokens for Hourly
 * Glassmorphism-first, modern & premium.
 * Font: Clean native system font (Roboto on Android, San Francisco on iOS).
 */

export const colorPalette = {
  // Brand accents — more vibrant for glass theme
  accent: {
    violet: '#8B5CF6',
    aqua: '#06B6D4',
    gradient: ['#8B5CF6', '#06B6D4'] as const,
    gradientReverse: ['#06B6D4', '#8B5CF6'] as const,
    glow: 'rgba(139, 92, 246, 0.30)',
    glowCyan: 'rgba(6, 182, 212, 0.25)',
  },
  // Semantic feedback
  semantic: {
    good: '#10B981',      // Calm green
    nudge: '#F59E0B',     // Amber
    alert: '#F87171',     // Soft coral
    info: '#38BDF8',      // Sky
  },
  // App-specific brand colors
  knownAppColors: {
    'com.google.android.youtube': '#FF0000',
    'com.instagram.android': '#E1306C',
    'com.netflix.mediaclient': '#E50914',
    'com.whatsapp': '#25D366',
    'com.twitter.android': '#1DA1F2',
    'com.android.chrome': '#4285F4',
    'com.zhiliaoapp.musically': '#00F2FE', // TikTok
    'com.reddit.frontpage': '#FF4500',
    'com.spotify.music': '#1DB954',
    'com.discord': '#5865F2',
    'com.google.android.gm': '#EA4335',
    'com.linkedin.android': '#0A66C2',
    'tv.twitch.android.app': '#9146FF',
    'com.amazon.mShop.android.shopping': '#FF9900',
  } as Record<string, string>,
  // Curated fallback palette for unknown packages (stable hash)
  hashPalette: [
    '#8B5CF6', '#06B6D4', '#F59E0B', '#EC4899',
    '#3B82F6', '#10B981', '#A855F7', '#F97316',
    '#14B8A6', '#E11D48', '#22D3EE', '#6366F1',
  ],
};

export const darkTheme = {
  isDark: true,
  background: '#060810',
  backgroundSubtle: '#0A0D16',
  card: {
    base: 'rgba(15, 18, 30, 0.65)',
    elevated: 'rgba(20, 24, 40, 0.70)',
    highlight: 'rgba(30, 35, 55, 0.75)',
    glass: 'rgba(15, 18, 30, 0.55)',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    muted: '#475569',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    active: 'rgba(139, 92, 246, 0.45)',
    strong: 'rgba(255, 255, 255, 0.14)',
    glass: 'rgba(255, 255, 255, 0.10)',
  },
  accent: colorPalette.accent,
  semantic: colorPalette.semantic,
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export const lightTheme = {
  isDark: false,
  background: '#F8FAFC',
  backgroundSubtle: '#F1F5F9',
  card: {
    base: 'rgba(255, 255, 255, 0.80)',
    elevated: 'rgba(255, 255, 255, 0.85)',
    highlight: 'rgba(240, 243, 250, 0.85)',
    glass: 'rgba(255, 255, 255, 0.65)',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    muted: '#94A3B8',
  },
  border: {
    subtle: 'rgba(0, 0, 0, 0.07)',
    active: 'rgba(139, 92, 246, 0.4)',
    strong: 'rgba(0, 0, 0, 0.14)',
    glass: 'rgba(0, 0, 0, 0.06)',
  },
  accent: colorPalette.accent,
  semantic: colorPalette.semantic,
  overlay: 'rgba(15, 23, 42, 0.5)',
};

export type Theme = typeof darkTheme;

export const typography = {
  fonts: {
    uiRegular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    uiMedium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
    uiSemiBold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
    uiBold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    numbersRegular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    numbersMedium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
    numbersBold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
  },
  scale: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 20,
    xl: 28,
    display: 44,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 36,
    display: 52,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
};

export const layout = {
  screenPadding: 20,
  borderRadius: {
    xs: 6,
    sm: 8,
    md: 12,
    chip: 16,
    card: 20,
    lg: 24,
    pill: 999,
  },
};

/** Glass shadow preset for glowing cards */
export const glassShadow = {
  shadowColor: colorPalette.accent.violet,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 8,
};

/** Neutral shadow for non-accent glass surfaces */
export const neutralShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 10,
};

/**
 * Returns a stable, harmonious color for a package name.
 */
export function getAppColor(packageName: string): string {
  if (colorPalette.knownAppColors[packageName]) {
    return colorPalette.knownAppColors[packageName];
  }
  let hash = 0;
  for (let i = 0; i < packageName.length; i++) {
    hash = (hash << 5) - hash + packageName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % colorPalette.hashPalette.length;
  return colorPalette.hashPalette[index];
}

// Default export alias for backwards-compatibility
export const colors = {
  background: darkTheme.background,
  card: {
    primary: darkTheme.card.base,
    elevated: darkTheme.card.elevated,
  },
  text: darkTheme.text,
  accent: colorPalette.accent,
  border: darkTheme.border.subtle,
  status: {
    positive: colorPalette.semantic.good,
    negative: colorPalette.semantic.alert,
  },
};
