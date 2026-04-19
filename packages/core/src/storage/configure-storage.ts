import type { StorageAdapter } from "./storage-adapter";

let currentStorageAdapter: StorageAdapter | null = null;

/**
 * Get the currently configured storage adapter.
 * Throws if no adapter has been configured.
 */
export function getStorageAdapter(): StorageAdapter {
  if (!currentStorageAdapter) {
    throw new Error(
      "Storage adapter not configured. Call configureStorage() with a valid StorageAdapter before using storage functionality.",
    );
  }
  return currentStorageAdapter;
}

/**
 * Check if a storage adapter has been configured.
 */
export function hasStorageAdapter(): boolean {
  return currentStorageAdapter !== null;
}

/**
 * Configure the storage adapter for core package.
 * This enables core to work with both web (localStorage) and React Native (AsyncStorage).
 *
 * @example Web usage:
 * ```ts
 * import { configureStorage, createBrowserStorageAdapter } from "@nebula/core/storage";
 * configureStorage(createBrowserStorageAdapter());
 * ```
 *
 * @example React Native usage:
 * ```ts
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * import { configureStorage } from "@nebula/core/storage";
 * configureStorage({
 *   get: (k) => AsyncStorage.getItem(k),
 *   set: (k, v) => AsyncStorage.setItem(k, v),
 *   remove: (k) => AsyncStorage.removeItem(k),
 * });
 * ```
 */
export function configureStorage(adapter: StorageAdapter): void {
  if (!adapter || typeof adapter.get !== "function" || typeof adapter.set !== "function" || typeof adapter.remove !== "function") {
    throw new Error("Invalid storage adapter: must implement StorageAdapter interface");
  }
  currentStorageAdapter = adapter;
}
