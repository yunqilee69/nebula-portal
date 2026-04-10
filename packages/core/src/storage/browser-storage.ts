import type { StorageAdapter } from "./storage-adapter";

/**
 * Browser storage implementation using localStorage.
 * Use configureStorage() to inject this into core.
 */
export function createBrowserStorageAdapter(): StorageAdapter {
  return {
    async get(key: string): Promise<string | null> {
      return localStorage.getItem(key);
    },
    async set(key: string, value: string): Promise<void> {
      localStorage.setItem(key, value);
    },
    async remove(key: string): Promise<void> {
      localStorage.removeItem(key);
    },
  };
}
