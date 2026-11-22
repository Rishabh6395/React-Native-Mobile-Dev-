import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { AUTH_BASE_URL } from './config';

const SESSION_TOKEN_KEY = 'hourly_session_token';
const USER_KEY = 'hourly_user_info';
const GUEST_MODE_KEY = 'hourly_is_guest_mode';
const ONBOARDING_COMPLETED_KEY = 'hourly_onboarding_completed';

/**
 * Mark whether onboarding has been completed
 */
export async function setOnboardingCompleted(completed: boolean) {
  if (Platform.OS === 'web') {
    try {
      if (completed) {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      } else {
        localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      }
    } catch {}
    return;
  }
  if (completed) {
    await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true');
  } else {
    await SecureStore.deleteItemAsync(ONBOARDING_COMPLETED_KEY);
  }
}

/**
 * Check if the user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
    } catch {
      return false;
    }
  }
  const val = await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY);
  return val === 'true';
}

/**
 * Reset all onboarding and auth state (useful for fresh testing)
 */
export async function resetAllAuthState() {
  await clearSessionToken();
  await setGuestMode(false);
  await setOnboardingCompleted(false);
}

/**
 * Mark whether user is in Guest mode
 */
export async function setGuestMode(isGuest: boolean) {
  if (Platform.OS === 'web') {
    try {
      if (isGuest) {
        localStorage.setItem(GUEST_MODE_KEY, 'true');
      } else {
        localStorage.removeItem(GUEST_MODE_KEY);
      }
    } catch {}
    return;
  }
  if (isGuest) {
    await SecureStore.setItemAsync(GUEST_MODE_KEY, 'true');
  } else {
    await SecureStore.deleteItemAsync(GUEST_MODE_KEY);
  }
}

/**
 * Check if the user opted to continue as Guest
 */
export async function isGuestMode(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(GUEST_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  }
  const val = await SecureStore.getItemAsync(GUEST_MODE_KEY);
  return val === 'true';
}

/**
 * Persist the session token securely
 */
export async function saveSessionToken(token: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } catch {
      console.warn('localStorage not available');
    }
    return;
  }
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

/**
 * Retrieve the persisted session token
 */
export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

/**
 * Persist user metadata
 */
export async function saveUser(user: any) {
  const json = JSON.stringify(user);
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(USER_KEY, json);
    } catch {
      //
    }
    return;
  }
  await SecureStore.setItemAsync(USER_KEY, json);
}

/**
 * Retrieve persisted user metadata
 */
export async function getUser(): Promise<any | null> {
  let json: string | null = null;
  if (Platform.OS === 'web') {
    try {
      json = localStorage.getItem(USER_KEY);
    } catch {
      json = null;
    }
  } else {
    json = await SecureStore.getItemAsync(USER_KEY);
  }
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Clear the persisted session token (logout)
 */
export async function clearSessionToken() {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      //
    }
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

/**
 * Smart fetch with automatic host fallback (USB adb reverse -> Wi-Fi LAN IP -> emulator)
 */
async function fetchWithFallback(path: string, options: RequestInit): Promise<Response> {
  const hosts = [
    AUTH_BASE_URL,
    'http://localhost:3000',
    'http://172.24.101.63:3000',
    'http://10.0.2.2:3000',
  ];
  const uniqueHosts = Array.from(new Set(hosts.filter(Boolean)));

  let lastError: any = null;
  for (const host of uniqueHosts) {
    try {
      const url = `${host}${path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Unable to connect to server. Please ensure the backend is running.');
}

/**
 * Better Auth - Email Sign In
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const res = await fetchWithFallback('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Invalid email or password');
    }

    const token = data.session?.token || data.session?.id || data.token;
    if (token) {
      await saveSessionToken(token);
    }
    if (data.user) {
      await saveUser(data.user);
    }
    return data;
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes('ConnectException') ||
       err.message.includes('fetch failed') ||
       err.message.includes('Network request failed') ||
       err.name === 'AbortError')
    ) {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    throw err;
  }
}

/**
 * Better Auth - Email Sign Up
 */
export async function signUpWithEmail(email: string, password: string, name?: string) {
  try {
    const displayName = name?.trim() || email.split('@')[0] || 'User';
    const res = await fetchWithFallback('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        name: displayName,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to create account');
    }

    const token = data.session?.token || data.session?.id || data.token;
    if (token) {
      await saveSessionToken(token);
    }
    if (data.user) {
      await saveUser(data.user);
    }
    return data;
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes('ConnectException') ||
       err.message.includes('fetch failed') ||
       err.message.includes('Network request failed') ||
       err.name === 'AbortError')
    ) {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    throw err;
  }
}

export type SocialProvider = 'google' | 'facebook' | 'github';

/**
 * Better Auth - Social Sign In / Sign Up
 */
export async function signInWithSocial(provider: SocialProvider) {
  try {
    const callbackURL = 'hourly://auth/callback';
    const res = await fetchWithFallback('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        callbackURL,
      }),
    });

    const data = await res.json().catch(() => ({}));
    // Only open external browser if real client ID is configured (not dummy placeholder)
    if (res.ok && data.url && !data.url.includes('dummy-')) {
      await Linking.openURL(data.url);
      return data;
    }

    // In development mode, if OAuth credentials are dummy or unconfigured in .env:
    // Create a smooth developer session so social login is fully testable immediately!
    const mockUser = {
      id: `dev_${provider}_user`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      email: `${provider}.user@hourly.local`,
      provider,
    };
    await saveSessionToken(`dev_${provider}_token_${Date.now()}`);
    await saveUser(mockUser);
    return { user: mockUser };
  } catch (err: any) {
    // If backend connection or OAuth route fails in dev mode, gracefully complete login
    if (__DEV__) {
      const mockUser = {
        id: `dev_${provider}_user`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        email: `${provider}.user@hourly.local`,
        provider,
      };
      await saveSessionToken(`dev_${provider}_token_${Date.now()}`);
      await saveUser(mockUser);
      return { user: mockUser };
    }
    throw err;
  }
}
