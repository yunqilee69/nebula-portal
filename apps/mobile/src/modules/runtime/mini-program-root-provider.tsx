import { restoreSessionOnStartup } from "@nebula/auth"
import {
  createMobileAppContext,
  createMobileSessionStorage,
  createMobileStorageService,
  type AppContextValue,
  type AuthSession,
  type LocaleBundle,
  type LocaleCode,
} from "@nebula/core"
import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createMiniProgramAuthApi, createTaroRequestClient, toCoreSession } from "@/modules/runtime/taro-request-client"
import { miniProgramEnv } from "@/modules/runtime/mini-program-env"
import { taroPreferenceStorage } from "@/modules/runtime/taro-preference-storage"
import { taroStorageAdapter } from "@/modules/runtime/taro-storage-adapter"

const sessionStorage = createMobileSessionStorage(taroStorageAdapter)
const preferenceStorageKey = "nebula-mini-program-locale"

const messages: LocaleBundle = {
  "zh-CN": {
    "mini.home.title": "Nebula 小程序基座",
    "mini.sign-in.title": "登录 Nebula 小程序",
  },
  "en-US": {
    "mini.home.title": "Nebula mini program foundation",
    "mini.sign-in.title": "Sign in to Nebula mini program",
  },
}

interface MiniProgramRuntimeValue {
  appContext: AppContextValue
  authBusy: boolean
  hydrated: boolean
  session: AuthSession | null
  locale: LocaleCode
  signIn: (credentials: { username: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  setLocale: (locale: LocaleCode) => Promise<LocaleCode>
}

const MiniProgramRuntimeContext = createContext<MiniProgramRuntimeValue | null>(null)

function isLocaleCode(value: string | null): value is LocaleCode {
  return value === "zh-CN" || value === "en-US"
}

function createUploadFormData() {
  return new FormData()
}

export function MiniProgramRootProvider({ children }: React.PropsWithChildren) {
  const [authBusy, setAuthBusy] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [locale, setLocaleState] = useState<LocaleCode>("zh-CN")
  const authApi = useMemo(() => createMiniProgramAuthApi(locale), [locale])

  useEffect(() => {
    let active = true

    async function hydrate() {
      const [storedSession, storedLocale] = await Promise.all([
        sessionStorage.read(),
        taroPreferenceStorage.getItem(preferenceStorageKey),
      ])
      const nextLocale = isLocaleCode(storedLocale) ? storedLocale : "zh-CN"
      const startupAuthApi = createMiniProgramAuthApi(nextLocale)
      let restoredSession = storedSession

      if (storedSession?.token) {
        try {
          const startupSession = await restoreSessionOnStartup({
            storedSession,
            fetchCurrentUser: startupAuthApi.fetchCurrentUser,
            refreshSession: startupAuthApi.refreshSession,
          })
          restoredSession = startupSession ? toCoreSession(startupSession) : null

          if (restoredSession) {
            await sessionStorage.write(restoredSession)
          } else {
            await sessionStorage.clear()
          }
        } catch {
          restoredSession = null
          await sessionStorage.clear()
        }
      }

      if (!active) {
        return
      }

      setSession(restoredSession)
      setLocaleState(nextLocale)
      setHydrated(true)
    }

    void hydrate()

    return () => {
      active = false
    }
  }, [])

  const requestClient = useMemo(
    () =>
      createTaroRequestClient({
        getAccessToken: () => session?.token ?? null,
        getRefreshToken: () => session?.refreshToken ?? null,
        getLocale: () => locale,
        onSessionRefreshed: async (nextSession) => {
          await sessionStorage.write(nextSession)
          setSession(nextSession)
        },
        onUnauthorized: async () => {
          setSession(null)
          await sessionStorage.clear()
        },
      }),
    [locale, session],
  )

  const storageService = useMemo(
    () =>
      createMobileStorageService(
        requestClient,
        {
          createTaskPath: miniProgramEnv.storageUploadTaskPath,
          uploadPath: miniProgramEnv.storageUploadPath,
          completePathTemplate: miniProgramEnv.storageUploadCompletePathTemplate,
          bindPathTemplate: miniProgramEnv.storageUploadBindPathTemplate,
          detailPathTemplate: miniProgramEnv.storageFileDetailPathTemplate,
          downloadPath: miniProgramEnv.storageDownloadPath,
        },
        {
          createFormData: () => createUploadFormData(),
        },
      ),
    [requestClient],
  )

  const appContext = useMemo(
    () =>
      createMobileAppContext({
        getSession: () => session,
        logout: async () => {
          setSession(null)
          await sessionStorage.clear()
        },
        requestClient,
        storageService,
        locale,
        messages,
        setLocale: async (nextLocale) => {
          await taroPreferenceStorage.setItem(preferenceStorageKey, nextLocale)
          setLocaleState(nextLocale)
          return nextLocale
        },
      }).appContext,
    [locale, requestClient, session, storageService],
  )

  const value = useMemo<MiniProgramRuntimeValue>(
    () => ({
      appContext,
      authBusy,
      hydrated,
      session,
      locale,
      signIn: async (credentials) => {
        setAuthBusy(true)
        try {
          const nextSession = await authApi.loginWithPassword(credentials)
          await sessionStorage.write(nextSession)
          setSession(nextSession)
        } finally {
          setAuthBusy(false)
        }
      },
      signOut: async () => {
        setAuthBusy(true)
        try {
          try {
            await authApi.logoutSession(session?.token)
          } catch {
          }
          await sessionStorage.clear()
          setSession(null)
        } finally {
          setAuthBusy(false)
        }
      },
      setLocale: async (nextLocale) => {
        await taroPreferenceStorage.setItem(preferenceStorageKey, nextLocale)
        setLocaleState(nextLocale)
        return nextLocale
      },
    }),
    [appContext, authApi, authBusy, locale, session],
  )

  return <MiniProgramRuntimeContext.Provider value={value}>{children}</MiniProgramRuntimeContext.Provider>
}

export function useMiniProgramRuntime() {
  const context = useContext(MiniProgramRuntimeContext)
  if (!context) {
    throw new Error("useMiniProgramRuntime must be used inside MiniProgramRootProvider")
  }

  return context
}
