/**
 * Root Index — Onboarding, Auth & Permission Gate
 *
 * Sequence:
 * 1. OnboardingFlow (3 splash screens: "Where your time goes", "Your personal time coach", "Our Privacy Promise")
 * 2. SignInScreen (Sign Up, Sign In, or Continue as Guest)
 * 3. PermissionScreen (Usage Access, if not yet granted)
 * 4. Main Tabs (/(tabs))
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import { router } from 'expo-router';
import { hasUsageAccess } from '../modules/usage-stats';
import { OnboardingFlow } from '../src/features/onboarding/OnboardingFlow';
import { PermissionScreen } from '../src/features/permissions/PermissionScreen';
import { SignInScreen } from '../src/features/auth/SignInScreen';
import {
  getSessionToken,
  isGuestMode,
  hasCompletedOnboarding,
  setOnboardingCompleted,
} from '../src/lib/auth';
import { useTheme } from '../src/theme/ThemeContext';

type GateStep = 'checking' | 'onboarding' | 'auth' | 'permission';

export default function GateScreen() {
  const { theme } = useTheme();
  const [step, setStep] = useState<GateStep>('checking');
  const stepRef = useRef<GateStep>('checking');
  stepRef.current = step;

  // Run initial state check ONCE on mount
  useEffect(() => {
    let isMounted = true;

    const checkInitialState = async () => {
      try {
        const alreadyOnboarded = await hasCompletedOnboarding();
        const token = await getSessionToken();
        const isGuest = await isGuestMode();
        const hasAuth = Boolean(token || isGuest);
        const hasPerm = hasUsageAccess();

        if (!isMounted) return;

        // If user has already completed onboarding AND has chosen auth/guest AND has permission -> go to tabs
        if (alreadyOnboarded && hasAuth && hasPerm) {
          router.replace('/(tabs)' as any);
          return;
        }

        // If already finished onboarding and auth, but needs permission
        if (alreadyOnboarded && hasAuth && !hasPerm) {
          setStep('permission');
          return;
        }

        // If already finished onboarding but needs auth
        if (alreadyOnboarded && !hasAuth) {
          setStep('auth');
          return;
        }

        // Fresh launch: start at splash screens
        setStep('onboarding');
      } catch {
        if (isMounted) setStep('onboarding');
      }
    };

    checkInitialState();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // If app resumes while user was granting permission, check and proceed
        if (hasUsageAccess() && stepRef.current === 'permission') {
          router.replace('/(tabs)' as any);
        }
      }
    });

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []); // Run ONCE on mount

  // ─── Step 1: 3-Slide Splash / Onboarding ───────────────────
  if (step === 'onboarding') {
    return (
      <OnboardingFlow
        onComplete={() => {
          // Immediately after 3rd splash screen, show the Auth screen (Guest / Sign Up / Login)
          setStep('auth');
        }}
      />
    );
  }

  // ─── Step 2: Auth Screen (Guest / Social / Email) ───────────
  if (step === 'auth') {
    return (
      <SignInScreen
        onComplete={async () => {
          await setOnboardingCompleted(true);
          const granted = hasUsageAccess();
          if (granted) {
            router.replace('/(tabs)' as any);
          } else {
            setStep('permission');
          }
        }}
      />
    );
  }

  // ─── Step 3: Permission Screen (Usage Access) ───────────────
  if (step === 'permission') {
    return (
      <PermissionScreen
        onGranted={() => {
          router.replace('/(tabs)' as any);
        }}
      />
    );
  }

  // ─── Loading / Checking ─────────────────────────────────────
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.accent.violet} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
