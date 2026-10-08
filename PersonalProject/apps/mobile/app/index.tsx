/**
 * Root Index — Onboarding & Permission Gate
 *
 * Checks onboarding and permission state, then redirects to the main tabs.
 * This screen is only visible during first launch or re-onboarding.
 */

import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { hasUsageAccess } from '../modules/usage-stats';
import { OnboardingFlow } from '../src/features/onboarding/OnboardingFlow';
import { PermissionScreen } from '../src/features/permissions/PermissionScreen';
import { SignInScreen } from '../src/features/auth/SignInScreen';
import { getSessionToken } from '../src/lib/auth';

export default function GateScreen() {
  const [onboarded, setOnboarded] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [authFinished, setAuthFinished] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkState = async () => {
      const granted = hasUsageAccess();
      setHasPermission(granted);
      
      const token = await getSessionToken();
      if (token) setAuthFinished(true);

      setChecked(true);
    };

    checkState();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const nowGranted = hasUsageAccess();
        setHasPermission(nowGranted);
      }
    });

    return () => sub.remove();
  }, []);

  // Navigate to tabs once onboarding, permissions, and auth are done
  useEffect(() => {
    if (onboarded && hasPermission && authFinished && checked) {
      router.replace('/(tabs)' as any);
    }
  }, [onboarded, hasPermission, authFinished, checked]);

  // 1. Onboarding Flow
  if (!onboarded) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setOnboarded(true);
        }}
      />
    );
  }

  // 2. Permission Flow
  if (!hasPermission) {
    return (
      <PermissionScreen
        onGranted={() => {
          setHasPermission(true);
        }}
      />
    );
  }

  // 3. Auth Flow
  if (!authFinished) {
    return (
      <SignInScreen 
        onComplete={() => {
          setAuthFinished(true);
        }}
      />
    );
  }

  // 4. If all are done, we're redirecting — show nothing
  return null;
}
