import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { AUTH_BASE_URL } from './api';

const SESSION_TOKEN_KEY = 'hourly_session_token';
const USER_KEY = 'hourly_user_info';

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
 * Better Auth - Email Sign In
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/auth/sign-in/email`, {
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
       err.message.includes('Network request failed'))
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
    const res = await fetch(`${AUTH_BASE_URL}/api/auth/sign-up/email`, {
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
       err.message.includes('Network request failed'))
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
    const res = await fetch(`${AUTH_BASE_URL}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        callbackURL,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || `Failed to initiate ${provider} authentication`);
    }

    if (data.url) {
      await Linking.openURL(data.url);
    }

    return data;
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes('ConnectException') ||
       err.message.includes('fetch failed') ||
       err.message.includes('Network request failed'))
    ) {
      throw new Error('Unable to connect to server. Please ensure the backend is running.');
    }
    throw err;
  }
}
