import AsyncStorage from '@react-native-async-storage/async-storage';

async function set(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

async function get(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

async function setObject<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function getObject<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    // Un valor corrupto no debe impedir abrir la app.
    return null;
  }
}

async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

async function multiRemove(keys: string[]): Promise<void> {
  await AsyncStorage.multiRemove(keys);
}

export const storage = { set, get, setObject, getObject, remove, multiRemove };

export default storage;