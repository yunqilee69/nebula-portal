import type { MobileEnvironment } from "@nebula/core"

export const miniProgramEnv: MobileEnvironment = {
  apiBaseUrl: process.env.TARO_APP_API_BASE_URL ?? "",
  loginPath: process.env.TARO_APP_AUTH_LOGIN_PATH ?? "/api/auth/login",
  refreshPath: process.env.TARO_APP_AUTH_REFRESH_PATH ?? "/api/auth/refresh",
  logoutPath: process.env.TARO_APP_AUTH_LOGOUT_PATH ?? "/api/auth/logout",
  currentUserPath: process.env.TARO_APP_AUTH_CURRENT_USER_PATH ?? "/api/auth/current-user",
  storageUploadTaskPath: process.env.TARO_APP_STORAGE_UPLOAD_TASK_PATH ?? "/storage/upload-tasks",
  storageUploadSimplePathTemplate: process.env.TARO_APP_STORAGE_UPLOAD_SIMPLE_PATH_TEMPLATE ?? "/storage/upload-tasks/{id}/simple",
  storageUploadCompletePathTemplate: process.env.TARO_APP_STORAGE_UPLOAD_COMPLETE_PATH_TEMPLATE ?? "/storage/upload-tasks/{id}/complete",
  storageUploadBindPathTemplate: process.env.TARO_APP_STORAGE_UPLOAD_BIND_PATH_TEMPLATE ?? "/storage/upload-tasks/{id}/bind",
  storageFileDetailPathTemplate: process.env.TARO_APP_STORAGE_FILE_DETAIL_PATH_TEMPLATE ?? "/storage/files/{id}",
  storageFileContentPathTemplate: process.env.TARO_APP_STORAGE_FILE_CONTENT_PATH_TEMPLATE ?? "/storage/files/{id}/content",
}
