import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveData<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export async function removeData(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const STORAGE_KEYS = {
  USER_NAME: "@bb_user_name",
  WALLETS: "@bb_wallets",
  TRANSACTIONS: "@bb_transactions",
  DEBTS: "@bb_debts",
  THEME: "@bb_theme",
  ONBOARDED: "@bb_onboarded",
};
