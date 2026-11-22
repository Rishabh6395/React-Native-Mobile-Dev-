import { QueryClient } from '@tanstack/react-query';
import { getSessionToken } from './auth';
import { API_BASE_URL, AUTH_BASE_URL, API_URL, DEV_LAN_IP } from './config';

export { API_BASE_URL, AUTH_BASE_URL, API_URL };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Fetch wrapper that automatically attaches the session token and tries alternate host if needed.
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = await getSessionToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hosts = [
    API_BASE_URL,
    'http://localhost:3000/v1',
    `http://${DEV_LAN_IP}:3000/v1`,
    'http://10.0.2.2:3000/v1',
  ];
  const uniqueHosts = Array.from(new Set(hosts.filter(Boolean)));

  let lastError: any = null;

  for (const base of uniqueHosts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`${base}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `API error: ${response.status}`);
      }

      return data;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Unable to connect to server. Please ensure the backend is running.');
}
