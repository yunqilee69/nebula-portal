export const webEnv = {
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
};