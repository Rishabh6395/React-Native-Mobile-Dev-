import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { layout } from '../../theme/tokens';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  variant?: 'rect' | 'circle' | 'text';
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  variant = 'rect',
  style,
}) => {
  const { theme, isDark } = useTheme();
  const [layoutWidth, setLayoutWidth] = React.useState(200);
  const translateX = useSharedValue(-200);
  const reducedMotion = useReducedMotion();

  const computedRadius =
    borderRadius !== undefined
      ? borderRadius
      : variant === 'circle'
      ? 999
      : variant === 'text'
      ? layout.borderRadius.sm
      : layout.borderRadius.md;

  const computedHeight = variant === 'text' ? 16 : height;

  useEffect(() => {
    if (reducedMotion) return;
    translateX.value = -layoutWidth;
    translateX.value = withRepeat(
      withTiming(layoutWidth * 1.5, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [layoutWidth, reducedMotion]);

  const animatedShimmer = useAnimatedStyle(() => {
    if (reducedMotion) return { opacity: 0 };
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const baseBg = isDark ? theme.card.highlight : theme.card.elevated;
  const shimmerColors = isDark
    ? (['transparent', 'rgba(255, 255, 255, 0.08)', 'transparent'] as const)
    : (['transparent', 'rgba(255, 255, 255, 0.6)', 'transparent'] as const);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) =>
        setLayoutWidth(e.nativeEvent.layout.width || 200)
      }
      style={[
        styles.container,
        {
          width: width as any,
          height: computedHeight,
          borderRadius: computedRadius,
          backgroundColor: baseBg,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { width: layoutWidth * 0.8 },
          animatedShimmer,
        ]}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});
