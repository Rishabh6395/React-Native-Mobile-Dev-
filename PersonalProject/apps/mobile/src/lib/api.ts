import { QueryClient } from '@tanstack/react-query';
import { getSessionToken } from './auth';
import { API_BASE_URL, AUTH_BASE_URL, API_URL } from './config';

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

