/**
 * Storage adapter interface for dependency injection.
 * Abstracts localStorage (web) and AsyncStorage (RN) behind a common API.
 */
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * Key-value storage driver interface.
 * This is the legacy interface kept for backward compatibility.
 * Use StorageAdapter for new code.
 */
export interface KeyValueStorageDriver {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Convert KeyValueStorageDriver to StorageAdapter
 */
export function toStorageAdapter(driver: KeyValueStorageDriver): StorageAdapter {
  return {
    get: (key: string) => driver.getItem(key),
    set: (key: string, value: string) => driver.setItem(key, value),
    remove: (key: string) => driver.removeItem(key),
  };
}
