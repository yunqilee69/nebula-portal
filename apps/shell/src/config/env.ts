interface RemoteModuleConfig {
  id: string;
  remoteName: string;
  url: string;
  exposedModule: string;
}

const defaultRemoteModules: RemoteModuleConfig[] = [
  {
    id: "@business/demo",
    remoteName: "demoBusiness",
    url: import.meta.env.VITE_DEMO_REMOTE_URL ?? "http://127.0.0.1:3001/assets/remoteEntry.js",
    exposedModule: "./register",
  },
];

function parseRemoteModules(value: string | undefined): RemoteModuleConfig[] {
  if (!value) {
    return defaultRemoteModules;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return defaultRemoteModules;
    }

    const items = parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const candidate = item as Partial<RemoteModuleConfig>;
        if (
          typeof candidate.id !== "string"
          || typeof candidate.remoteName !== "string"
          || typeof candidate.url !== "string"
        ) {
          return null;
        }

        return {
          id: candidate.id,
          remoteName: candidate.remoteName,
          url: candidate.url,
          exposedModule: typeof candidate.exposedModule === "string" ? candidate.exposedModule : "./register",
        } satisfies RemoteModuleConfig;
      })
      .filter((item): item is RemoteModuleConfig => item !== null);

    return items.length ? items : defaultRemoteModules;
  } catch {
    return defaultRemoteModules;
  }
}

export const shellEnv = {
  moduleMode: import.meta.env.VITE_MODULE_MODE ?? "embedded",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  loginPath: import.meta.env.VITE_AUTH_LOGIN_PATH ?? "/api/auth/login",
  refreshPath: import.meta.env.VITE_AUTH_REFRESH_PATH ?? "/api/auth/refresh",
  logoutPath: import.meta.env.VITE_AUTH_LOGOUT_PATH ?? "/api/auth/logout",
  currentUserPath: import.meta.env.VITE_AUTH_CURRENT_USER_PATH ?? "/api/auth/current-user",
  menuPath: import.meta.env.VITE_MENU_CURRENT_PATH ?? "/api/auth/menus/tree",
  dictItemPathTemplate: import.meta.env.VITE_DICT_ITEM_PATH_TEMPLATE ?? "/api/dict/items/type/{typeCode}",
  dictTypeCodes: (import.meta.env.VITE_DICT_TYPE_CODES ?? "file_type")
    .split(",")
    .map((item: string) => item.trim())
    .filter(Boolean),
  systemParamKeyPathTemplate:
    import.meta.env.VITE_SYSTEM_PARAM_KEY_PATH_TEMPLATE ?? "/api/param/system-params/key/{paramKey}",
  configKeys: (import.meta.env.VITE_SYSTEM_PARAM_KEYS ?? "upload_max_size,theme.primaryColor,theme.radius,theme.mode")
    .split(",")
    .map((item: string) => item.trim())
    .filter(Boolean),
  systemParamPagePath: import.meta.env.VITE_SYSTEM_PARAM_PAGE_PATH ?? "/api/param/system-params/page",
  notifyPath: import.meta.env.VITE_NOTIFY_CURRENT_PATH ?? "/api/notify/site-messages/page",
  notifyReadPathTemplate:
    import.meta.env.VITE_NOTIFY_READ_PATH_TEMPLATE ?? "/api/notify/site-messages/{id}/read",
  localeCurrentPath: import.meta.env.VITE_I18N_CURRENT_LOCALE_PATH ?? "",
  localeSwitchPath: import.meta.env.VITE_I18N_SWITCH_LOCALE_PATH ?? "",
  storageUploadTaskPath: import.meta.env.VITE_STORAGE_UPLOAD_TASK_PATH ?? "/storage/upload-tasks",
  storageUploadSimplePathTemplate:
    import.meta.env.VITE_STORAGE_UPLOAD_SIMPLE_PATH_TEMPLATE ?? "/storage/upload-tasks/{id}/simple",
  storageUploadCompletePathTemplate:
    import.meta.env.VITE_STORAGE_UPLOAD_COMPLETE_PATH_TEMPLATE ?? "/storage/upload-tasks/{id}/complete",
  storageUploadBindPathTemplate:
    import.meta.env.VITE_STORAGE_UPLOAD_BIND_PATH_TEMPLATE ?? "/storage/upload-tasks/{id}/bind",
  storageFilePagePath: import.meta.env.VITE_STORAGE_FILE_PAGE_PATH ?? "/storage/files/page",
  storageFileDetailPathTemplate:
    import.meta.env.VITE_STORAGE_FILE_DETAIL_PATH_TEMPLATE ?? "/storage/files/{id}",
  storageFileContentPathTemplate:
    import.meta.env.VITE_STORAGE_FILE_CONTENT_PATH_TEMPLATE ?? "/storage/files/{id}/content",
  storageFileDeletePathTemplate:
    import.meta.env.VITE_STORAGE_FILE_DELETE_PATH_TEMPLATE ?? "/storage/files/{id}",
  demoRemoteUrl: import.meta.env.VITE_DEMO_REMOTE_URL ?? "http://127.0.0.1:3001/assets/remoteEntry.js",
  remoteModules: parseRemoteModules(import.meta.env.VITE_REMOTE_MODULES),
};
