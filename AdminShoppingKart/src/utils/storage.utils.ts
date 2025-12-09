import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility functions for AsyncStorage
 */

export async function setStorageItem(key: string, value: any): Promise<void> {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`Error setting storage item ${key}:`, error);
    throw error;
  }
}

export async function getStorageItem<T = any>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch (error) {
    console.error(`Error getting storage item ${key}:`, error);
    return null;
  }
}

export async function removeStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing storage item ${key}:`, error);
    throw error;
  }
}

export async function clearStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

export async function getAllStorageKeys(): Promise<string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all storage keys:', error);
    return [];
  }
}

export async function getMultipleStorageItems(keys: string[]): Promise<[string, string | null][]> {
  try {
    return await AsyncStorage.multiGet(keys);
  } catch (error) {
    console.error('Error getting multiple storage items:', error);
    return [];
  }
}

export async function setMultipleStorageItems(items: [string, string][]): Promise<void> {
  try {
    await AsyncStorage.multiSet(items);
  } catch (error) {
    console.error('Error setting multiple storage items:', error);
    throw error;
  }
}
