import { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const QUOTA_STORAGE_KEY = 'hourly_ai_coach_quota_v1';
export const DEFAULT_FREE_SUGGESTIONS = 10;
export const AD_REWARD_SUGGESTIONS = 3;

export interface CoachQuotaState {
  suggestionsRemaining: number;
  totalUsed: number;
  isPremium: boolean;
  adsWatched: number;
  lastUpdated: string;
}

const DEFAULT_STATE: CoachQuotaState = {
  suggestionsRemaining: DEFAULT_FREE_SUGGESTIONS,
  totalUsed: 0,
  isPremium: false,
  adsWatched: 0,
  lastUpdated: new Date().toISOString(),
};

// In-memory cache for fast synchronous initial reads
let memoryState: CoachQuotaState = { ...DEFAULT_STATE };
let isInitialized = false;
type QuotaListener = (state: CoachQuotaState) => void;
const listeners = new Set<QuotaListener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener({ ...memoryState });
    } catch (e) {
      console.warn('[CoachQuota] Listener error:', e);
    }
  });
}

async function readFromStorage(): Promise<CoachQuotaState> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      try {
        raw = localStorage.getItem(QUOTA_STORAGE_KEY);
      } catch {
        raw = null;
      }
    } else {
      raw = await SecureStore.getItemAsync(QUOTA_STORAGE_KEY);
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        suggestionsRemaining: typeof parsed.suggestionsRemaining === 'number' ? parsed.suggestionsRemaining : DEFAULT_FREE_SUGGESTIONS,
        totalUsed: typeof parsed.totalUsed === 'number' ? parsed.totalUsed : 0,
        isPremium: Boolean(parsed.isPremium),
        adsWatched: typeof parsed.adsWatched === 'number' ? parsed.adsWatched : 0,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[CoachQuota] Failed reading storage:', err);
  }
  return { ...DEFAULT_STATE };
}

async function writeToStorage(state: CoachQuotaState): Promise<void> {
  memoryState = { ...state, lastUpdated: new Date().toISOString() };
  notifyListeners();

  try {
    const raw = JSON.stringify(memoryState);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(QUOTA_STORAGE_KEY, raw);
      } catch {
        // web storage fallback
      }
    } else {
      await SecureStore.setItemAsync(QUOTA_STORAGE_KEY, raw);
    }
  } catch (err) {
    console.warn('[CoachQuota] Failed writing storage:', err);
  }
}

/**
 * Initialize state from storage once on app load
 */
export async function initCoachQuota(): Promise<CoachQuotaState> {
  if (!isInitialized) {
    memoryState = await readFromStorage();
    isInitialized = true;
    notifyListeners();
  }
  return { ...memoryState };
}

/**
 * Synchronous read of current in-memory quota
 */
export function getCoachQuota(): CoachQuotaState {
  return { ...memoryState };
}

/**
 * Consume 1 suggestion.
 * If user is premium, always allowed and doesn't decrement.
 * If free tier and has suggestions remaining (> 0), decrements count and returns true.
 * If quota is 0, returns false.
 */
export async function consumeCoachSuggestion(): Promise<{ allowed: boolean; remaining: number }> {
  await initCoachQuota();

  if (memoryState.isPremium) {
    return { allowed: true, remaining: Infinity };
  }

  if (memoryState.suggestionsRemaining <= 0) {
    return { allowed: false, remaining: 0 };
  }

  const newState: CoachQuotaState = {
    ...memoryState,
    suggestionsRemaining: Math.max(0, memoryState.suggestionsRemaining - 1),
    totalUsed: memoryState.totalUsed + 1,
  };

  await writeToStorage(newState);
  return { allowed: true, remaining: newState.suggestionsRemaining };
}

/**
 * Rewarded Ad Completed: Unlocks +3 AI suggestions!
 */
export async function unlockSuggestionsFromAd(): Promise<CoachQuotaState> {
  await initCoachQuota();

  const newState: CoachQuotaState = {
    ...memoryState,
    suggestionsRemaining: memoryState.suggestionsRemaining + AD_REWARD_SUGGESTIONS,
    adsWatched: memoryState.adsWatched + 1,
  };

  await writeToStorage(newState);
  return newState;
}

/**
 * Upgrade to Premium: Gives unlimited AI coaching
 */
export async function upgradeToPremium(): Promise<CoachQuotaState> {
  await initCoachQuota();

  const newState: CoachQuotaState = {
    ...memoryState,
    isPremium: true,
    suggestionsRemaining: 999999,
  };

  await writeToStorage(newState);
  return newState;
}

/**
 * Reset quota (useful for testing and debugging)
 */
export async function resetCoachQuota(): Promise<CoachQuotaState> {
  await writeToStorage({ ...DEFAULT_STATE });
  return { ...DEFAULT_STATE };
}

/**
 * Reactive hook for components
 */
export function useCoachQuota() {
  const [state, setState] = useState<CoachQuotaState>(memoryState);

  useEffect(() => {
    initCoachQuota().then((s) => setState(s));

    const handleUpdate = (updated: CoachQuotaState) => {
      setState(updated);
    };

    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const consume = useCallback(async () => {
    return await consumeCoachSuggestion();
  }, []);

  const unlockFromAd = useCallback(async () => {
    return await unlockSuggestionsFromAd();
  }, []);

  const upgrade = useCallback(async () => {
    return await upgradeToPremium();
  }, []);

  const reset = useCallback(async () => {
    return await resetCoachQuota();
  }, []);

  return {
    ...state,
    canSuggest: state.isPremium || state.suggestionsRemaining > 0,
    consumeSuggestion: consume,
    unlockSuggestionsFromAd: unlockFromAd,
    upgradeToPremium: upgrade,
    resetQuota: reset,
  };
}
