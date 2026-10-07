import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { getAppColor, typography } from '../../theme/tokens';

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

  const borderRadius = Math.round(size * 0.24);
  const color = getAppColor(packageName);
  const initial = (appName || 'A').charAt(0).toUpperCase();

  const hasValidBase64 =
    Boolean(iconBase64) && !loadError && typeof iconBase64 === 'string';

  const imageUri = hasValidBase64
    ? iconBase64!.startsWith('data:')
      ? iconBase64!
      : `data:image/png;base64,${iconBase64}`
    : null;

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
  },
  initialText: {
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlign: 'center',
  },
});
