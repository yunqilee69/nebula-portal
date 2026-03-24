import type { AppContextValue, AuthSession, ConfigMap, DictMap, LocaleBundle, LocaleCode, NotificationItem, StorageFileItem } from "@platform/core";

export interface KeyValueStorageDriver {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface MobileEnvironment {
  apiBaseUrl: string;
  loginPath: string;
  refreshPath: string;
  logoutPath: string;
  currentUserPath: string;
  storageUploadTaskPath: string;
  storageUploadSimplePathTemplate: string;
  storageUploadCompletePathTemplate: string;
  storageUploadBindPathTemplate: string;
  storageFileDetailPathTemplate: string;
  storageFileContentPathTemplate: string;
}

export interface MobileAssetDescriptor {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface MobileStorageUploadPayload {
  asset: MobileAssetDescriptor;
  sourceEntity: string;
  sourceId: string;
  sourceType?: string;
}

export interface MobileStorageUploadEndpoints {
  createTaskPath: string;
  uploadPathTemplate: string;
  completePathTemplate: string;
  bindPathTemplate: string;
  detailPathTemplate: string;
  contentPathTemplate: string;
}

export interface MobileStorageUploadRequestFactory {
  createFormData: (asset: MobileAssetDescriptor) => FormData;
}

export interface MobileStorageService {
  uploadFile(payload: MobileStorageUploadPayload): Promise<StorageFileItem>;
  previewUrl(file: Pick<StorageFileItem, "id" | "fileUrl" | "previewUrl">): string;
  downloadUrl(file: Pick<StorageFileItem, "id" | "fileUrl">): string;
}

export interface MobileRequestClient {
  get<T>(url: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(url: string, payload?: unknown): Promise<T>;
  put<T>(url: string, payload?: unknown): Promise<T>;
  delete<T>(url: string): Promise<T>;
  upload<T>(url: string, formData: FormData): Promise<T>;
}

export interface MobileRequestClientOptions {
  baseURL: string;
  getAccessToken: () => Promise<string | null> | string | null;
  getLocale?: () => Promise<LocaleCode | null> | LocaleCode | null;
  getRefreshToken?: () => Promise<string | null> | string | null;
  refreshSession?: (refreshToken: string) => Promise<AuthSession>;
  onSessionRefreshed?: (session: AuthSession) => Promise<void> | void;
  onUnauthorized?: () => Promise<void> | void;
}

export interface MobileRuntimeState {
  dict: DictMap;
  config: ConfigMap;
  notifications: NotificationItem[];
}

export interface MobileRuntimeContextOptions {
  getSession: () => AuthSession | null;
  logout: () => Promise<void> | void;
  requestClient: MobileRequestClient;
  storageService: Pick<MobileStorageService, "previewUrl" | "downloadUrl">;
  locale: LocaleCode;
  messages: LocaleBundle;
  setLocale: (locale: LocaleCode) => Promise<LocaleCode>;
  runtimeState?: MobileRuntimeState;
}

export interface MobileRuntimeBindings {
  appContext: AppContextValue;
}
