import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_TOKEN_KEY = 'hourly_session_token';

/**
 * Persist the session token securely
 */
export async function saveSessionToken(token: string) {
  if (Platform.OS === 'web') {
    // secure-store is not available on web
    try {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } catch (e) {
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
    } catch (e) {
      return null;
    }
  }
  return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

/**
 * Clear the persisted session token (logout)
 */
export async function clearSessionToken() {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    } catch (e) {
      //
    }
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}
