export const webEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  loginPath: import.meta.env.VITE_AUTH_LOGIN_PATH ?? "/api/auth/login",
  refreshPath: import.meta.env.VITE_AUTH_REFRESH_PATH ?? "/api/auth/refresh",
  logoutPath: import.meta.env.VITE_AUTH_LOGOUT_PATH ?? "/api/auth/logout",
  currentUserPath: import.meta.env.VITE_AUTH_CURRENT_USER_PATH ?? "/api/auth/current-user",
  profilePath: import.meta.env.VITE_PROFILE_PATH ?? "/api/auth/profile",
  oauth2BindingsPath: import.meta.env.VITE_OAUTH2_BINDINGS_PATH ?? "/api/auth/profile/oauth2/bindings",
  loginRecordsPath: import.meta.env.VITE_LOGIN_RECORDS_PATH ?? "/api/auth/profile/login-records/page",
  wechatWebRedirectPreparePath: import.meta.env.VITE_AUTH_WECHAT_WEB_REDIRECT_PREPARE_PATH ?? "/api/auth/wechat/web/redirect/prepare",
  wechatWebRedirectCallbackPath: import.meta.env.VITE_AUTH_WECHAT_WEB_REDIRECT_CALLBACK_PATH ?? "/api/auth/wechat/web/redirect/callback",
  wechatWebQrCodePath: import.meta.env.VITE_AUTH_WECHAT_WEB_QRCODE_PATH ?? "/api/auth/wechat/web/qrcode",
  wechatWebStatusPath: import.meta.env.VITE_AUTH_WECHAT_WEB_STATUS_PATH ?? "/api/auth/wechat/web/status",
  wechatWebCallbackPath: import.meta.env.VITE_AUTH_WECHAT_WEB_CALLBACK_PATH ?? "/api/auth/wechat/web/callback",
  menuPath: import.meta.env.VITE_MENU_CURRENT_PATH ?? "/api/auth/menus/tree",
  notifyPath: import.meta.env.VITE_NOTIFY_CURRENT_PATH ?? "/api/notify/site-messages/page",
  notifyReadPathTemplate:
    import.meta.env.VITE_NOTIFY_READ_PATH_TEMPLATE ?? "/api/notify/site-messages/{id}/read",
  localeCurrentPath: import.meta.env.VITE_I18N_CURRENT_LOCALE_PATH ?? "",
  localeSwitchPath: import.meta.env.VITE_I18N_SWITCH_LOCALE_PATH ?? "",
  storageUploadTaskPath: import.meta.env.VITE_STORAGE_UPLOAD_TASK_PATH ?? "/api/storage/upload-tasks",
  storageUploadTaskPagePath: import.meta.env.VITE_STORAGE_UPLOAD_TASK_PAGE_PATH ?? "/api/storage/upload-tasks/page",
  storageUploadPath: import.meta.env.VITE_STORAGE_UPLOAD_PATH ?? "/api/storage/upload",
  storageUploadCompletePathTemplate:
    import.meta.env.VITE_STORAGE_UPLOAD_COMPLETE_PATH_TEMPLATE ?? "/api/storage/upload-tasks/{id}/complete",
  storageUploadBindPathTemplate:
    import.meta.env.VITE_STORAGE_UPLOAD_BIND_PATH_TEMPLATE ?? "/api/storage/upload-tasks/{id}/bind",
  storageFilePagePath: import.meta.env.VITE_STORAGE_FILE_PAGE_PATH ?? "/api/storage/files/page",
  storageFileDetailPathTemplate:
    import.meta.env.VITE_STORAGE_FILE_DETAIL_PATH_TEMPLATE ?? "/api/storage/files/{id}",
  storageDownloadPath: import.meta.env.VITE_STORAGE_DOWNLOAD_PATH ?? "/api/storage/download",
  storageSignedDownloadPath: import.meta.env.VITE_STORAGE_SIGNED_DOWNLOAD_PATH ?? "/api/storage/download-signed",
  storageGenerateSignedUrlPath: import.meta.env.VITE_STORAGE_GENERATE_SIGNED_URL_PATH ?? "/api/storage/generate-signed-url",
  storageFileDeletePathTemplate:
    import.meta.env.VITE_STORAGE_FILE_DELETE_PATH_TEMPLATE ?? "/api/storage/files/{id}",
};
