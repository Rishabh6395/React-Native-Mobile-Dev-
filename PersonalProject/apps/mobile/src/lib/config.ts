import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const DEV_LAN_IP = '172.24.101.63';

function getDevHost(): string {
  // If running via Expo (on physical device or emulator), hostUri contains the PC's LAN IP e.g. "172.24.101.63:8081"
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }

  if (Platform.OS === 'android') {
    const model = String((Platform.constants as any)?.Model || '').toLowerCase();
    const fingerprint = String((Platform.constants as any)?.Fingerprint || '').toLowerCase();
    const isEmulator = model.includes('sdk') || fingerprint.includes('generic');

    if (isEmulator) {
      return 'http://10.0.2.2:3000';
    }
    // Default to LAN IP on physical Android device
    return `http://${DEV_LAN_IP}:3000`;
  }

  return `http://${DEV_LAN_IP}:3000`;
}

export const DEV_HOST = getDevHost();

export const API_BASE_URL = __DEV__
  ? `${DEV_HOST}/v1`
  : 'https://api.hourlyapp.local/v1';

export const AUTH_BASE_URL = __DEV__
  ? DEV_HOST
  : 'https://api.hourlyapp.local';

export const API_URL = API_BASE_URL;
