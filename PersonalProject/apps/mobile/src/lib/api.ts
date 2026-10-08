import { QueryClient } from '@tanstack/react-query';
import { getSessionToken } from './auth';
import { Platform } from 'react-native';

// Use a local network IP for Android Emulator testing by default, or your production URL
export const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'android' ? 'http://10.0.2.2:3000/v1' : 'http://localhost:3000/v1'
  : 'https://api.hourlyapp.local/v1'; // Replace with production URL

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
    throw new Error(data.message || `API error: ${response.status}`);
  }

  return data;
}
