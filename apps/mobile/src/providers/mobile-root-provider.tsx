import { restoreSessionOnStartup } from "@nebula/auth";
import type { AppContextValue, AuthSession, LocaleBundle, LocaleCode } from "@nebula/core";
import { createMobileAppContext, createMobileRequestClient, createMobileSessionStorage, createMobileStorageService, toStorageAdapter } from "@nebula/core";
import type { KeyValueStorageDriver } from "@nebula/core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createMobileAuthApi, toCoreSession } from "@/api/auth-api";
import { mobileEnv } from "@/config/mobile-env";
import { AppContextProvider } from "@/providers/app-context-provider";

const messages: LocaleBundle = {
  "zh-CN": {
    "mobile.home.title": "Nebula 移动端基座",
  },
  "en-US": {
    "mobile.home.title": "Nebula mobile foundation",
  },
};

const PREFERENCE_KEY = "nebula-mobile-locale";

const secureStorageDriver: KeyValueStorageDriver = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

const preferenceStorageDriver: KeyValueStorageDriver = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

const sessionStorage = createMobileSessionStorage(toStorageAdapter(secureStorageDriver));

interface MobileRuntimeValue {
  appContext: AppContextValue;
  authBusy: boolean;
  hydrated: boolean;
  session: AuthSession | null;
  locale: LocaleCode;
  signIn: (credentials: { username: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  setLocale: (locale: LocaleCode) => Promise<LocaleCode>;
  setSession: (session: AuthSession) => Promise<void>;
  clearSession: () => Promise<void>;
}

const MobileRuntimeContext = createContext<MobileRuntimeValue | null>(null);

function isLocaleCode(value: string | null): value is LocaleCode {
  return value === "zh-CN" || value === "en-US";
}

function createUploadFormData() {
  return new FormData();
}

export function MobileRootProvider({ children }: { children: ReactNode }) {
  const [authBusy, setAuthBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [locale, setLocaleState] = useState<LocaleCode>("zh-CN");
  const authApi = useMemo(() => createMobileAuthApi(locale), [locale]);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const [storedSession, storedLocale] = await Promise.all([
        sessionStorage.read(),
        preferenceStorageDriver.getItem(PREFERENCE_KEY),
      ]);
      const nextLocale = isLocaleCode(storedLocale) ? storedLocale : "zh-CN";
      const startupAuthApi = createMobileAuthApi(nextLocale);
      let restoredSession = storedSession;

      if (storedSession?.token) {
        try {
          const startupSession = await restoreSessionOnStartup({
            storedSession,
            fetchCurrentUser: startupAuthApi.fetchCurrentUser,
            refreshSession: startupAuthApi.refreshSession,
          });
          restoredSession = startupSession ? toCoreSession(startupSession) : null;

          if (restoredSession) {
            await sessionStorage.write(restoredSession);
          } else {
            await sessionStorage.clear();
          }
        } catch {
          restoredSession = null;
          await sessionStorage.clear();
        }
      }

      if (!active) {
        return;
      }

      setSessionState(restoredSession);
      setLocaleState(nextLocale);
      setHydrated(true);
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const requestClient = useMemo(
    () => createMobileRequestClient({
      baseURL: mobileEnv.apiBaseUrl,
      getAccessToken: () => session?.token ?? null,
      getRefreshToken: () => session?.refreshToken ?? null,
      getLocale: () => locale,
      refreshSession: authApi.refreshSession,
      onSessionRefreshed: async (nextSession) => {
        await sessionStorage.write(nextSession);
        setSessionState(nextSession);
      },
      onUnauthorized: async () => {
        setSessionState(null);
        await sessionStorage.clear();
      },
    }),
    [authApi, locale, session],
  );

  const storageService = useMemo(
    () => createMobileStorageService(
      requestClient,
      {
        createTaskPath: mobileEnv.storageUploadTaskPath,
        uploadPathTemplate: mobileEnv.storageUploadSimplePathTemplate,
        completePathTemplate: mobileEnv.storageUploadCompletePathTemplate,
        bindPathTemplate: mobileEnv.storageUploadBindPathTemplate,
        detailPathTemplate: mobileEnv.storageFileDetailPathTemplate,
        contentPathTemplate: mobileEnv.storageFileContentPathTemplate,
      },
      {
        createFormData: () => createUploadFormData(),
      },
    ),
    [requestClient],
  );

  const appContext = useMemo(
    () => createMobileAppContext({
      getSession: () => session,
      logout: async () => {
        setSessionState(null);
        await sessionStorage.clear();
      },
      requestClient,
      storageService,
      locale,
      messages,
      setLocale: async (nextLocale) => {
        await preferenceStorageDriver.setItem(PREFERENCE_KEY, nextLocale);
        setLocaleState(nextLocale);
        return nextLocale;
      },
    }).appContext,
    [locale, requestClient, session, storageService],
  );

  const value = useMemo<MobileRuntimeValue>(
    () => ({
      appContext,
      authBusy,
      hydrated,
      session,
      locale,
      signIn: async (credentials) => {
        setAuthBusy(true);
        try {
          const nextSession = await authApi.loginWithPassword(credentials);
          await sessionStorage.write(nextSession);
          setSessionState(nextSession);
        } finally {
          setAuthBusy(false);
        }
      },
      signOut: async () => {
        setAuthBusy(true);
        try {
          try {
            await authApi.logoutSession();
          } catch {
          }

          await sessionStorage.clear();
          setSessionState(null);
        } finally {
          setAuthBusy(false);
        }
      },
      setLocale: async (nextLocale) => {
        await preferenceStorageDriver.setItem(PREFERENCE_KEY, nextLocale);
        setLocaleState(nextLocale);
        return nextLocale;
      },
      setSession: async (nextSession) => {
        await sessionStorage.write(nextSession);
        setSessionState(nextSession);
      },
      clearSession: async () => {
        await sessionStorage.clear();
        setSessionState(null);
      },
    }),
    [appContext, authApi, authBusy, hydrated, locale, session],
  );

  return (
    <MobileRuntimeContext.Provider value={value}>
      <AppContextProvider value={appContext}>{children}</AppContextProvider>
    </MobileRuntimeContext.Provider>
  );
}

export function useMobileRuntime() {
  const context = useContext(MobileRuntimeContext);
  if (!context) {
    throw new Error("useMobileRuntime must be used inside MobileRootProvider");
  }

  return context;
}
