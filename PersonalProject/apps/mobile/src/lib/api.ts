import { QueryClient } from '@tanstack/react-query';
import { getSessionToken } from './auth';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

function getDevHost(): string {
  if (Platform.OS === 'android') {
    const model = String((Platform.constants as any)?.Model || '').toLowerCase();
    const fingerprint = String((Platform.constants as any)?.Fingerprint || '').toLowerCase();
    const isEmulator = model.includes('sdk') || fingerprint.includes('generic');

    if (isEmulator) {
      return 'http://10.0.2.2:3000';
    }
    // Physical device: USB connection via `adb reverse tcp:3000 tcp:3000` maps localhost directly to host PC
    return 'http://localhost:3000';
  }
  return 'http://localhost:3000';
}

const DEV_HOST = getDevHost();

export const API_BASE_URL = __DEV__ 
  ? `${DEV_HOST}/v1`
  : 'https://api.hourlyapp.local/v1'; // Replace with production URL

export const AUTH_BASE_URL = __DEV__
  ? DEV_HOST
  : 'https://api.hourlyapp.local';

export const API_URL = API_BASE_URL;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Fetch wrapper that automatically attaches the session token.
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = await getSessionToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Optional: handle 401 globally here
    if (response.status === 401) {
      // clearSessionToken(); // maybe route to login
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || `API error: ${response.status}`);
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

