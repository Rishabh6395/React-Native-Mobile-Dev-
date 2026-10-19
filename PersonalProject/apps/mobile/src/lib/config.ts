import { Platform } from 'react-native';

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

export const DEV_HOST = getDevHost();

export const API_BASE_URL = __DEV__
  ? `${DEV_HOST}/v1`
  : 'https://api.hourlyapp.local/v1';

export const AUTH_BASE_URL = __DEV__
  ? DEV_HOST
  : 'https://api.hourlyapp.local';

export const API_URL = API_BASE_URL;
