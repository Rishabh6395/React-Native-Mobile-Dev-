/**
 * Design Tokens for Hourly
 * Android-first, calm & premium: "Apple Fitness meets Linear".
 * Spec Reference: Section 9.1
 */

export const colorPalette = {
  // Brand accents
  accent: {
    violet: '#7C5CFF',
    aqua: '#35E0C2',
    gradient: ['#7C5CFF', '#35E0C2'] as const,
    gradientReverse: ['#35E0C2', '#7C5CFF'] as const,
    glow: 'rgba(124, 92, 255, 0.25)',
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
    '#7C5CFF', '#35E0C2', '#F59E0B', '#EC4899', 
    '#3B82F6', '#10B981', '#8B5CF6', '#F97316', 
    '#06B6D4', '#E11D48', '#14B8A6', '#6366F1'
  ],
};

export const darkTheme = {
  isDark: true,
  background: '#0B0D12',
  backgroundSubtle: '#0F121A',
  card: {
    base: '#12151C',
    elevated: '#171B24',
    highlight: '#1E232E',
    glass: 'rgba(18, 21, 28, 0.75)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    muted: '#475569',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    active: 'rgba(124, 92, 255, 0.4)',
    strong: 'rgba(255, 255, 255, 0.12)',
  },
  accent: colorPalette.accent,
  semantic: colorPalette.semantic,
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const lightTheme = {
  isDark: false,
  background: '#F8FAFC',
  backgroundSubtle: '#F1F5F9',
  card: {
    base: '#FFFFFF',
    elevated: '#F8FAFC',
    highlight: '#EDF2F7',
    glass: 'rgba(255, 255, 255, 0.85)',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    muted: '#94A3B8',
  },
  border: {
    subtle: 'rgba(0, 0, 0, 0.07)',
    active: 'rgba(124, 92, 255, 0.4)',
    strong: 'rgba(0, 0, 0, 0.14)',
  },
  accent: colorPalette.accent,
  semantic: colorPalette.semantic,
  overlay: 'rgba(15, 23, 42, 0.5)',
};

export type Theme = typeof darkTheme;

export const typography = {
  fonts: {
    uiRegular: 'PlusJakartaSans_400Regular',
    uiMedium: 'PlusJakartaSans_500Medium',
    uiSemiBold: 'PlusJakartaSans_600SemiBold',
    uiBold: 'PlusJakartaSans_700Bold',
    numbersRegular: 'SpaceGrotesk_400Regular',
    numbersMedium: 'SpaceGrotesk_500Medium',
    numbersBold: 'SpaceGrotesk_700Bold',
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
    card: 24,
    pill: 999,
  },
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
