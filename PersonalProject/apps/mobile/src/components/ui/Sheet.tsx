import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { springConfig, triggerHaptic } from '../../theme/motion';
import { layout, spacing, typography } from '../../theme/tokens';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxHeight?: number;
}

export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  style,
  maxHeight = SCREEN_HEIGHT * 0.8,
}) => {
  const { theme, isDark } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [modalVisible, setModalVisible] = React.useState(visible);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      triggerHaptic.light();
      if (reducedMotion) {
        translateY.value = 0;
        backdropOpacity.value = 1;
      } else {
        backdropOpacity.value = withTiming(1, { duration: 250 });
        translateY.value = withSpring(0, springConfig.gentle);
      }
    } else {
      if (reducedMotion) {
        setModalVisible(false);
      } else {
        backdropOpacity.value = withTiming(0, { duration: 200 });
        translateY.value = withSpring(SCREEN_HEIGHT, springConfig.press, (finished) => {
          if (finished) {
            runOnJS(setModalVisible)(false);
          }
        });
      }
    }
  }, [visible, reducedMotion]);

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  if (!modalVisible) return null;

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: theme.overlay },
            animatedBackdropStyle,
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet Content Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.card.base,
              borderColor: theme.border.strong,
              maxHeight,
            },
            animatedSheetStyle,
            style,
          ]}
        >
          {/* Top Grabber Handle */}
          <View style={styles.handleWrapper}>
            <View
              style={[
                styles.handle,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.15)',
                },
              ]}
            />
          </View>

          {/* Header */}
          {(title || subtitle) && (
            <View style={styles.header}>
              <View style={styles.titleCol}>
                {title && (
                  <Text
                    style={[
                      styles.title,
                      {
                        color: theme.text.primary,
                        fontFamily: typography.fonts.uiSemiBold,
                      },
                    ]}
                  >
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text
                    style={[
                      styles.subtitle,
                      {
                        color: theme.text.secondary,
                        fontFamily: typography.fonts.uiRegular,
                      },
                    ]}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark
                      ? theme.card.highlight
                      : theme.card.elevated,
                  },
                ]}
              >
                <X size={18} color={theme.text.secondary} />
              </Pressable>
            </View>
          )}

          {/* Body */}
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopLeftRadius: layout.borderRadius.card + 4,
    borderTopRightRadius: layout.borderRadius.card + 4,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: layout.borderRadius.pill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.scale.lg,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: typography.scale.xs,
    marginTop: 2,
    includeFontPadding: false,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: layout.borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  body: {
    paddingTop: spacing.xs,
  },
});
