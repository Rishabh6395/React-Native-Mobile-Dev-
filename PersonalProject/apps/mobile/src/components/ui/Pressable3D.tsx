import React from 'react';
import { Pressable, StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { springConfig, motionConstants, triggerHaptic } from '../../theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface Pressable3DProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  scaleTo?: number;
  testID?: string;
}

export const Pressable3D: React.FC<Pressable3DProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  disabled = false,
  haptic = true,
  scaleTo = motionConstants.pressScale,
  testID,
}) => {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => {
    if (reducedMotion) return {};
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    if (haptic) triggerHaptic.light();
    scale.value = withSpring(scaleTo, springConfig.press);
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, springConfig.default);
  };

  return (
    <AnimatedPressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};
