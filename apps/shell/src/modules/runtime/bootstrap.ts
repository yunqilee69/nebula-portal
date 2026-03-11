import { eventBus, getRegisteredModules } from "@platform/core";
import type { AppContextValue, AuthSession, DictMap, LocaleCode, MenuItem } from "@platform/core";
import { fetchCurrentConfig } from "../../api/config-api";
import { fetchCurrentMenus } from "../../api/menu-api";
import { fetchCurrentNotifications } from "../../api/notify-api";
import { buildStorageDownloadUrl, buildStoragePreviewUrl } from "../../api/storage-api";
import { requestDelete, requestGet, requestPost, requestPut } from "../../api/client";
import { shellEnv } from "../../config/env";
import { useConfigStore } from "../config/config-store";
import { useDictStore } from "../dict/dict-store";
import { hasStoredDictRecords } from "../dict/dict-store";
import { ensureDictRecords } from "../dict/dict-store";
import { useMenuStore } from "../menu/menu-store";
import { useNotifyStore } from "../notify/notify-store";
import { buildPlatformMenus } from "../platform/platform-menus";
import { applyShellLocale } from "../i18n/i18n-service";
import { translateShellMessage } from "../i18n/translate";
import { useI18nStore } from "../i18n/i18n-store";
import { useResourceStore } from "./resource-store";

function fallbackMenusFromModules(): MenuItem[] {
  return getRegisteredModules().flatMap((module, index) => {
    if (module.menus?.length) {
      return module.menus;
    }
    const firstRoute = module.routes?.[0];
    if (!firstRoute?.path) {
      return [];
    }
    return [
      {
        id: `${module.id}-${index}`,
        name: module.name,
        type: 2,
        path: firstRoute.path,
        component: firstRoute.componentKey,
        linkType: 1,
        visible: 1,
      },
    ];
  });
}

function fallbackDicts(): DictMap {
  return {
    file_type: [
      { label: "Image", value: "image" },
      { label: "Document", value: "document" },
      { label: "Archive", value: "archive" },
    ],
  };
}

function withPlatformMenus(menus: MenuItem[]) {
  const existingRoot = menus.find((item) => item.id === "platform-root");
  if (existingRoot) {
    return menus;
  }
  return [...menus, ...buildPlatformMenus(useI18nStore.getState().locale)];
}

export async function preloadShellData() {
  if (shellEnv.useMockAuth) {
    useResourceStore.getState().start("menus");
    useResourceStore.getState().start("config");
    useResourceStore.getState().start("notifications");
    useMenuStore.getState().setMenus(withPlatformMenus(fallbackMenusFromModules()));
    useConfigStore.getState().mergeValues({ upload_max_size: 20 * 1024 * 1024 });
    useNotifyStore.getState().setItems([]);
    useResourceStore.getState().succeed("menus");
    useResourceStore.getState().succeed("config");
    useResourceStore.getState().succeed("notifications");
    return;
  }

  useResourceStore.getState().start("menus");
  useResourceStore.getState().start("config");
  useResourceStore.getState().start("notifications");

  const [menusResult, configResult, notifyResult] = await Promise.allSettled([
    fetchCurrentMenus(),
    fetchCurrentConfig(),
    fetchCurrentNotifications(),
  ]);

  useMenuStore.getState().setMenus(
    withPlatformMenus(
      menusResult.status === "fulfilled" && menusResult.value.length > 0
        ? menusResult.value
        : fallbackMenusFromModules(),
    ),
  );
  if (menusResult.status === "fulfilled") {
    useResourceStore.getState().succeed("menus");
  } else {
    useResourceStore.getState().fail("menus", menusResult.reason instanceof Error ? menusResult.reason.message : "Failed to load menus");
  }
  useConfigStore.getState().setValues(
    configResult.status === "fulfilled" ? configResult.value : { upload_max_size: 20 * 1024 * 1024 },
  );
  if (configResult.status === "fulfilled") {
    useResourceStore.getState().succeed("config");
  } else {
    useResourceStore.getState().fail("config", configResult.reason instanceof Error ? configResult.reason.message : "Failed to load config");
  }
  useNotifyStore.getState().setItems(notifyResult.status === "fulfilled" ? notifyResult.value : []);
  if (notifyResult.status === "fulfilled") {
    useResourceStore.getState().succeed("notifications");
  } else {
    useResourceStore.getState().fail("notifications", notifyResult.reason instanceof Error ? notifyResult.reason.message : "Failed to load notifications");
  }
}

export function buildAppContext(
  navigateToLogin: () => void,
  logout: () => void,
  getSession: () => AuthSession | null,
): AppContextValue {
  return {
    auth: {
      getToken: () => getSession()?.token ?? null,
      getSession,
      hasPermission: (code) => {
        const session = getSession();
        return session ? session.permissions.includes(code) : false;
      },
      redirectToLogin: navigateToLogin,
      logout,
    },
    dict: {
      get: (key) => {
        const state = useDictStore.getState();
        if (!hasStoredDictRecords(key)) {
          if (shellEnv.useMockAuth) {
            const records = fallbackDicts()[key] ?? [];
            state.setRecord(key, records);
            eventBus.emit("dict:loaded", { keys: [key] });
            return records;
          }
          void ensureDictRecords(key);
          return [];
        }
        return state.records[key] ?? [];
      },
      ensure: (key) => {
        if (shellEnv.useMockAuth) {
          const state = useDictStore.getState();
          if (!hasStoredDictRecords(key)) {
            const records = fallbackDicts()[key] ?? [];
            state.setRecord(key, records);
            eventBus.emit("dict:loaded", { keys: [key] });
            return Promise.resolve(records);
          }
        }
        return ensureDictRecords(key);
      },
      all: () => useDictStore.getState().records,
    },
    config: {
      get: (key) => useConfigStore.getState().values[key],
      all: () => useConfigStore.getState().values,
    },
    notifications: {
      all: () => useNotifyStore.getState().items,
      unreadCount: () => useNotifyStore.getState().items.filter((item) => !item.read).length,
    },
    request: {
      get: (url, params) => requestGet(url, params, { silent: true }),
      post: (url, payload) => requestPost(url, payload, { silent: true }),
      put: (url, payload) => requestPut(url, payload, { silent: true }),
      delete: (url) => requestDelete(url, { silent: true }),
    },
    storage: {
      previewUrl: (file) => buildStoragePreviewUrl(file),
      downloadUrl: (file) => buildStorageDownloadUrl(file),
    },
    i18n: {
      getLocale: () => useI18nStore.getState().locale,
      setLocale: (locale) => applyShellLocale(locale),
      t: (key, fallback, variables) => translateShellMessage(useI18nStore.getState().locale, key, fallback, variables),
    },
    bus: eventBus,
  };
}
