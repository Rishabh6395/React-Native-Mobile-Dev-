import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { getAppColor, typography } from '../../theme/tokens';
import { getInstalledApps } from '../../../modules/usage-stats';

// In-memory icon cache for installed apps
const iconCache = new Map<string, string | null>();
let isFetchingIcons = false;
let hasLoadedIcons = false;

function loadInstalledIcons() {
  if (isFetchingIcons || hasLoadedIcons) return;
  isFetchingIcons = true;
  try {
    const apps = getInstalledApps();
    for (const app of apps) {
      if (app.packageName && app.iconBase64) {
        iconCache.set(app.packageName, app.iconBase64);
      }
    }
    hasLoadedIcons = true;
  } catch (err) {
    // native module may not be ready or running on web/test
  } finally {
    isFetchingIcons = false;
  }
}

// ─── Branded Vector Icons for Major Apps ──────────────────────

const InstagramLogo: React.FC<{ size: number }> = ({ size }) => {
  const innerSize = Math.round(size * 0.58);
  return (
    <LinearGradient
      colors={['#833AB4', '#FD1D1D', '#FCB045']}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={[StyleSheet.absoluteFill, styles.center]}
    >
      <Svg width={innerSize} height={innerSize} viewBox="0 0 24 24" fill="none">
        <Rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="5"
          ry="5"
          stroke="#FFFFFF"
          strokeWidth="2.2"
        />
        <Circle cx="12" cy="12" r="4.5" stroke="#FFFFFF" strokeWidth="2.2" />
        <Circle cx="17.5" cy="6.5" r="1.3" fill="#FFFFFF" />
      </Svg>
    </LinearGradient>
  );
};

const YouTubeLogo: React.FC<{ size: number }> = ({ size }) => {
  const iconW = Math.round(size * 0.52);
  const iconH = Math.round(iconW * 0.7);
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: '#FF0000' }]}>
      <Svg width={iconW} height={iconH} viewBox="0 0 24 17" fill="none">
        <Path
          d="M23.5 2.6C23.2 1.5 22.3.6 21.2.3 19.3 0 12 0 12 0S4.7 0 2.8.3C1.7.6.8 1.5.5 2.6 0 4.6 0 8.5 0 8.5s0 3.9.5 5.9c.3 1.1 1.2 2 2.3 2.3 1.9.3 9.2.3 9.2.3s7.3 0 9.2-.3c1.1-.3 2-1.2 2.3-2.3.5-2 .5-5.9.5-5.9s0-3.9-.5-5.9z"
          fill="#FF0000"
        />
        <Path d="M9.6 12.1L15.8 8.5 9.6 4.9v7.2z" fill="#FFFFFF" />
      </Svg>
    </View>
  );
};

const WhatsAppLogo: React.FC<{ size: number }> = ({ size }) => {
  const innerSize = Math.round(size * 0.56);
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: '#25D366' }]}>
      <Svg width={innerSize} height={innerSize} viewBox="0 0 24 24" fill="#FFFFFF">
        <Path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.16 7.62C8.97 7.62 8.78 7.63 8.6 7.65C8.42 7.67 8.27 7.73 8.13 7.89C7.94 8.08 7.42 8.58 7.42 9.61C7.42 10.64 8.17 11.63 8.27 11.78C8.38 11.92 9.71 14.04 11.8 14.86C13.54 15.54 13.89 15.41 14.27 15.37C14.64 15.34 15.48 14.87 15.65 14.39C15.82 13.9 15.82 13.49 15.77 13.4C15.72 13.31 15.58 13.25 15.35 13.14C15.12 13.02 14 12.47 13.79 12.39C13.58 12.31 13.43 12.27 13.28 12.5C13.13 12.73 12.7 13.25 12.57 13.4C12.44 13.54 12.31 13.56 12.08 13.45C11.85 13.33 11.11 13.09 10.23 12.31C9.54 11.7 9.07 10.94 8.94 10.72C8.81 10.49 8.93 10.36 9.04 10.25C9.15 10.14 9.28 9.97 9.4 9.83C9.51 9.69 9.56 9.58 9.63 9.43C9.71 9.28 9.67 9.15 9.61 9.04C9.56 8.92 9.11 7.82 8.92 7.37C8.74 6.94 8.55 7 8.41 7L9.16 7.62Z" />
      </Svg>
    </View>
  );
};

const ChromeLogo: React.FC<{ size: number }> = ({ size }) => {
  const innerSize = Math.round(size * 0.6);
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: '#FFFFFF' }]}>
      <Svg width={innerSize} height={innerSize} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="11" fill="#EA4335" />
        <Path d="M12 12L21.5 6.5A11 11 0 0 1 23 12H12z" fill="#FBBC05" />
        <Path d="M12 12H23A11 11 0 0 1 12 23V12z" fill="#34A853" />
        <Circle cx="12" cy="12" r="5" fill="#FFFFFF" />
        <Circle cx="12" cy="12" r="4" fill="#4285F4" />
      </Svg>
    </View>
  );
};

const SpotifyLogo: React.FC<{ size: number }> = ({ size }) => {
  const innerSize = Math.round(size * 0.58);
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: '#1DB954' }]}>
      <Svg width={innerSize} height={innerSize} viewBox="0 0 24 24" fill="#FFFFFF">
        <Path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </Svg>
    </View>
  );
};

// ─── Main AppIcon Component ──────────────────────────────────

export interface AppIconProps {
  packageName: string;
  appName?: string;
  iconBase64?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const AppIcon: React.FC<AppIconProps> = ({
  packageName,
  appName = 'App',
  iconBase64,
  size = 44,
  style,
}) => {
  const [loadError, setLoadError] = useState(false);
  const [cachedIcon, setCachedIcon] = useState<string | null>(
    iconCache.get(packageName) || null,
  );

  useEffect(() => {
    if (iconBase64) return;
    if (iconCache.has(packageName)) {
      setCachedIcon(iconCache.get(packageName) || null);
      return;
    }
    // Attempt lazy loading
    loadInstalledIcons();
    if (iconCache.has(packageName)) {
      setCachedIcon(iconCache.get(packageName) || null);
    }
  }, [packageName, iconBase64]);

  const borderRadius = Math.round(size * 0.24);
  const color = getAppColor(packageName);
  const initial = (appName || 'A').charAt(0).toUpperCase();

  const finalBase64 = iconBase64 || cachedIcon;
  const hasValidBase64 =
    Boolean(finalBase64) && !loadError && typeof finalBase64 === 'string';

  const imageUri = hasValidBase64
    ? finalBase64!.startsWith('data:')
      ? finalBase64!
      : `data:image/png;base64,${finalBase64}`
    : null;

  // Custom vector logos for common apps if no native image
  const renderBrandedLogo = () => {
    switch (packageName) {
      case 'com.instagram.android':
        return <InstagramLogo size={size} />;
      case 'com.google.android.youtube':
        return <YouTubeLogo size={size} />;
      case 'com.whatsapp':
        return <WhatsAppLogo size={size} />;
      case 'com.android.chrome':
        return <ChromeLogo size={size} />;
      case 'com.spotify.music':
        return <SpotifyLogo size={size} />;
      default:
        return null;
    }
  };

  const branded = !imageUri ? renderBrandedLogo() : null;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: color,
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size, borderRadius }}
          onError={() => setLoadError(true)}
          resizeMode="cover"
        />
      ) : branded ? (
        branded
      ) : (
        <Text
          style={[
            styles.initialText,
            {
              fontSize: Math.round(size * 0.44),
              fontFamily: typography.fonts.uiBold,
            },
          ]}
        >
          {initial}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlign: 'center',
  },
});
