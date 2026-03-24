import type { MobileEnvironment } from "@platform/mobile-core";

export const mobileEnv: MobileEnvironment = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  loginPath: process.env.EXPO_PUBLIC_AUTH_LOGIN_PATH ?? "/api/auth/login",
  refreshPath: process.env.EXPO_PUBLIC_AUTH_REFRESH_PATH ?? "/api/auth/refresh",
  logoutPath: process.env.EXPO_PUBLIC_AUTH_LOGOUT_PATH ?? "/api/auth/logout",
  currentUserPath: process.env.EXPO_PUBLIC_AUTH_CURRENT_USER_PATH ?? "/api/auth/current-user",
  storageUploadTaskPath: process.env.EXPO_PUBLIC_STORAGE_UPLOAD_TASK_PATH ?? "/storage/upload-tasks",
  storageUploadSimplePathTemplate: process.env.EXPO_PUBLIC_STORAGE_UPLOAD_SIMPLE_PATH_TEMPLATE ?? "/storage/upload-tasks/{id}/simple",
  storageUploadCompletePathTemplate: process.env.EXPO_PUBLIC_STORAGE_UPLOAD_COMPLETE_PATH_TEMPLATE ?? "/storage/upload-tasks/{id}/complete",
  storageUploadBindPathTemplate: process.env.EXPO_PUBLIC_STORAGE_UPLOAD_BIND_PATH_TEMPLATE ?? "/storage/upload-tasks/{id}/bind",
  storageFileDetailPathTemplate: process.env.EXPO_PUBLIC_STORAGE_FILE_DETAIL_PATH_TEMPLATE ?? "/storage/files/{id}",
  storageFileContentPathTemplate: process.env.EXPO_PUBLIC_STORAGE_FILE_CONTENT_PATH_TEMPLATE ?? "/storage/files/{id}/content",
};
