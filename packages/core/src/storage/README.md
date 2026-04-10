# Storage Adapter

Provides storage abstraction for both web (localStorage) and React Native (AsyncStorage).

## StorageAdapter Interface

```typescript
interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

## Usage

### Web (Browser)

```typescript
import { configureStorage, createBrowserStorageAdapter } from "@nebula/core";

configureStorage(createBrowserStorageAdapter());
```

### React Native

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStorage } from "@nebula/core";

configureStorage({
  get: (k) => AsyncStorage.getItem(k),
  set: (k, v) => AsyncStorage.setItem(k, v),
  remove: (k) => AsyncStorage.removeItem(k),
});
```

## Session Storage

For mobile session management:

```typescript
import { createMobileSessionStorage } from "@nebula/core";

const sessionStorage = createMobileSessionStorage(storageAdapter);
const session = await sessionStorage.read();
await sessionStorage.write(session);
await sessionStorage.clear();
```
