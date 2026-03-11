import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import type { LocaleCode } from "./i18n";

export type MenuType = 1 | 2 | 3;
export type LinkType = 1 | 2 | 3;

export interface UserProfile {
  userId: string;
  username: string;
  avatar?: string;
  roles: string[];
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
  user: UserProfile;
  permissions: string[];
}

export interface MenuPageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  name?: string;
  code?: string;
  status?: number;
}

export interface MenuPageResult {
  data: MenuItem[];
  total: number;
}

export interface SystemParamItem {
  id: string;
  groupCode?: string;
  paramKey: string;
  paramName?: string;
  dataType?: string;
  status?: number;
  isSensitive?: number;
  isDynamic?: number;
}

export interface SystemParamPageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  groupCode?: string;
  paramKey?: string;
  paramName?: string;
  status?: number;
}

export interface SystemParamPageResult {
  data: SystemParamItem[];
  total: number;
}

export interface RoleItem {
  id: string;
  name: string;
  code: string;
  status?: number;
}

export interface RoleDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
}

export interface MenuMutationPayload {
  id?: string;
  parentId?: string;
  code?: string;
  name: string;
  path?: string;
  icon?: string;
  component?: string;
  type: string;
  sort?: number;
  status?: number;
}

export interface SystemParamMutationPayload {
  id?: string;
  groupCode: string;
  paramKey: string;
  paramName: string;
  paramValue: string;
  dataType: string;
  status?: number;
  isSensitive?: number;
  isDynamic?: number;
}

export interface RoleMutationPayload {
  id?: string;
  name: string;
  code: string;
  description?: string;
  status?: number;
  permissionIds?: number[];
}

export interface OrganizationItem {
  id: string;
  name: string;
  code: string;
  leader?: string;
  phone?: string;
  address?: string;
  parentId?: string;
  status?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface OrganizationTreeItem extends OrganizationItem {
  children?: OrganizationTreeItem[];
}

export interface OrganizationPageQuery {
  pageNum: number;
  pageSize: number;
  name?: string;
  code?: string;
  status?: number;
}

export interface OrganizationPageResult {
  data: OrganizationItem[];
  total: number;
}

export interface OrganizationMutationPayload {
  id?: string;
  name: string;
  code: string;
  leader?: string;
  phone?: string;
  address?: string;
  parentId?: string;
  status?: number;
}

export interface ButtonItem {
  id: string;
  menuId?: string;
  code: string;
  name: string;
  type?: string;
  sort?: number;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

export interface ButtonPageQuery {
  pageNum: number;
  pageSize: number;
  menuId?: string;
  name?: string;
  code?: string;
  status?: number;
}

export interface ButtonPageResult {
  data: ButtonItem[];
  total: number;
}

export interface ButtonMutationPayload {
  id?: string;
  menuId: string;
  code: string;
  name: string;
  type?: string;
  sort?: number;
  status?: number;
}

export type PermissionSubjectType = "USER" | "ROLE" | "ORG";
export type PermissionResourceType = "MENU" | "BUTTON";
export type PermissionEffect = "Allow" | "Deny";

export interface PermissionItem {
  id: string;
  subjectType: PermissionSubjectType;
  subjectId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
  effect: PermissionEffect;
  scope?: string;
  createTime?: string;
  updateTime?: string;
}

export interface PermissionPageQuery {
  pageNum: number;
  pageSize: number;
  subjectType?: PermissionSubjectType;
  subjectId?: string;
  resourceType?: PermissionResourceType;
  resourceId?: string;
  effect?: PermissionEffect;
}

export interface PermissionPageResult {
  data: PermissionItem[];
  total: number;
}

export interface PermissionMutationPayload {
  id?: string;
  subjectType: PermissionSubjectType;
  subjectId: string;
  resourceType: PermissionResourceType;
  resourceId: string;
  effect?: PermissionEffect;
  scope?: string;
}

export interface MenuItem {
  id: string | number;
  parentId?: string | number;
  name: string;
  sort?: number;
  status?: 0 | 1;
  type: MenuType;
  path?: string;
  component?: string;
  linkType?: LinkType;
  linkUrl?: string;
  icon?: string;
  visible?: 0 | 1;
  permission?: string;
  children?: MenuItem[];
}

export interface DictRecord {
  label: string;
  value: string;
  extra?: Record<string, string>;
}

export type DictMap = Record<string, DictRecord[]>;

export type ConfigMap = Record<string, string | number | boolean | null>;

export interface NotificationItem {
  id: string;
  title: string;
  type: "info" | "warning" | "error";
  read?: boolean;
  createdAt?: string;
}

export interface StorageFileItem {
  id: string;
  fileName: string;
  fileHash?: string;
  fileUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  contentType?: string;
  extension?: string;
  size?: number;
  bucket?: string;
  storageProvider?: string;
  storageKey?: string;
  sourceEntity?: string;
  sourceId?: string;
  sourceType?: string;
  status?: string | number;
  uploadTaskId?: string;
  uploadUserId?: string;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StorageListQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  fileName?: string;
  sourceEntity?: string;
  sourceId?: string;
  sourceType?: string;
  uploadUserId?: string;
}

export interface StorageListResult {
  data: StorageFileItem[];
  total: number;
}

export interface StorageUploadPayload {
  file: File;
  sourceEntity: string;
  sourceId: string;
  sourceType?: string;
}

export interface PlatformEvents {
  "auth:login": AuthSession;
  "auth:logout": Record<string, never>;
  "notify:new": NotificationItem;
  "dict:loaded": { keys: string[] };
  "i18n:locale-changed": { locale: LocaleCode };
  [key: `business:${string}`]: unknown;
}

export type ComponentLoader = () => Promise<{ default: ComponentType<object> }>;
export type ComponentLoaderMap = Record<string, ComponentLoader>;

export interface PlatformRoute {
  path: string;
  componentKey?: string;
  component?: LazyExoticComponent<ComponentType<object>>;
  title?: string;
}

export interface AppContextValue {
  auth: {
    getToken: () => string | null;
    getSession: () => AuthSession | null;
    hasPermission: (code: string) => boolean;
    redirectToLogin: () => void;
    logout: () => void;
  };
  dict: {
    get: (key: string) => DictRecord[];
    ensure: (key: string) => Promise<DictRecord[]>;
    all: () => DictMap;
  };
  config: {
    get: (key: string) => string | number | boolean | null | undefined;
    all: () => ConfigMap;
  };
  notifications: {
    all: () => NotificationItem[];
    unreadCount: () => number;
  };
  request: {
    get: <T>(url: string, params?: Record<string, unknown>) => Promise<T>;
    post: <T>(url: string, payload?: unknown) => Promise<T>;
    put: <T>(url: string, payload?: unknown) => Promise<T>;
    delete: <T>(url: string) => Promise<T>;
  };
  storage: {
    previewUrl: (file: Pick<StorageFileItem, "id" | "fileUrl" | "previewUrl">) => string;
    downloadUrl: (file: Pick<StorageFileItem, "id" | "fileUrl">) => string;
  };
  i18n: {
    getLocale: () => LocaleCode;
    setLocale: (locale: LocaleCode) => Promise<LocaleCode>;
    t: (key: string, fallback?: string, variables?: Record<string, string | number>) => string;
  };
  bus: PlatformEventBus;
}

export interface PlatformModule {
  id: string;
  name: string;
  version: string;
  menus?: MenuItem[];
  routes?: PlatformRoute[];
  components?: ComponentLoaderMap;
  bootstrap?: (ctx: AppContextValue) => Promise<void>;
}

export interface ModuleLoadResult {
  id: string;
  status: "loaded" | "failed";
  reason?: string;
}

export interface ApiEnvelope<T> {
  code?: number | string;
  message?: string;
  msg?: string;
  success?: boolean;
  data?: T;
  result?: T;
  rows?: T;
}

export interface RouteDefinition {
  path: string;
  element: ReactNode;
}

export interface PlatformEventBus {
  on<K extends keyof PlatformEvents>(event: K, handler: (payload: PlatformEvents[K]) => void): () => void;
  emit<K extends keyof PlatformEvents>(event: K, payload: PlatformEvents[K]): void;
  off<K extends keyof PlatformEvents>(event: K, handler: (payload: PlatformEvents[K]) => void): void;
}
