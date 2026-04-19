import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import type { LocaleCode, LocaleBundle } from "./i18n/index";

export type MenuType = 1 | 2 | 3;
export type LinkType = 1 | 2 | 3;

export interface PlatformEventBus {
  on<K extends keyof PlatformEvents>(event: K, handler: (payload: PlatformEvents[K]) => void): () => void;
  emit<K extends keyof PlatformEvents>(event: K, payload: PlatformEvents[K]): void;
  off<K extends keyof PlatformEvents>(event: K, handler: (payload: PlatformEvents[K]) => void): void;
}

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
  menuList?: MenuItem[];
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

export type SystemParamDataType = "STRING" | "INT" | "DOUBLE" | "BOOLEAN" | "SINGLE" | "MULTIPLE";

export interface SystemParamItem {
  id: string;
  paramKey: string;
  paramName?: string;
  description?: string;
  paramValue?: string;
  dataType?: SystemParamDataType;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  createTime?: string;
  updateTime?: string;
}

export interface SystemParamPageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  paramKey?: string;
  paramName?: string;
  dataType?: SystemParamDataType;
}

export interface SystemParamPageResult {
  data: SystemParamItem[];
  total: number;
}

export interface RoleItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

export interface RolePermissionItem {
  id: string;
  name: string;
  code: string;
}

export interface RoleDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
  permissions: RolePermissionItem[];
}

export interface RolePageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  name?: string;
  code?: string;
  status?: number;
}

export interface RolePageResult {
  data: RoleItem[];
  total: number;
}

export interface UserRoleRef {
  id: string;
  name: string;
  code: string;
}

export interface UserOrganizationRef {
  id: string;
  name: string;
  code: string;
}

export interface UserItem {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  status?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  roles?: UserRoleRef[];
  organizations?: UserOrganizationRef[];
}

export interface UserDetail extends UserItem {}

export interface UserPageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  orgId?: string;
  orgIds?: string[];
  username?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  status?: number;
}

export interface UserPageResult {
  data: UserItem[];
  total: number;
}

export interface UserMutationPayload {
  username: string;
  password?: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  status?: number;
  remark?: string;
  roleIds?: string[];
  orgIds?: string[];
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
  paramKey: string;
  paramName: string;
  description?: string;
  paramValue?: string;
  dataType?: SystemParamDataType;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface RoleMutationPayload {
  id?: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  status?: number;
  permissionIds?: Array<string | number>;
}

export interface OrganizationItem {
  id: string;
  name: string;
  code: string;
  type?: "COMPANY" | "DEPARTMENT" | "TEAM";
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
  parentId?: string;
}

export interface OrganizationPageResult {
  data: OrganizationItem[];
  total: number;
}

export interface OrganizationMutationPayload {
  id?: string;
  name: string;
  code: string;
  type: "COMPANY" | "DEPARTMENT" | "TEAM";
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
  type?: MenuType;
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

export interface DictTypeItem {
  id: string;
  typeCode: string;
  typeName: string;
  status?: number;
  cacheEnabled?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface DictTypeDetail extends DictTypeItem {}

export interface DictTypePageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  typeCode?: string;
  typeName?: string;
  status?: number;
}

export interface DictTypePageResult {
  data: DictTypeItem[];
  total: number;
}

export interface DictTypeMutationPayload {
  typeCode: string;
  typeName: string;
  status?: number;
  cacheEnabled?: number;
  remark?: string;
}

export interface DictItemItem {
  id: string;
  typeCode: string;
  itemCode: string;
  itemLabel: string;
  itemValue: string;
  sort?: number;
  status?: number;
  isDefault?: number;
  tagColor?: string;
  extraJson?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface DictItemDetail extends DictItemItem {}

export interface DictItemPageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  typeCode?: string;
  itemCode?: string;
  itemLabel?: string;
  status?: number;
}

export interface DictItemPageResult {
  data: DictItemItem[];
  total: number;
}

export interface DictItemMutationPayload {
  typeCode: string;
  itemCode: string;
  itemLabel: string;
  itemValue: string;
  sort?: number;
  status?: number;
  isDefault?: number;
  tagColor?: string;
  extraJson?: string;
  remark?: string;
}

export interface OAuth2ClientItem {
  id: string;
  clientId: string;
  clientName?: string;
  clientType?: string;
  status?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface OAuth2ClientDetail extends OAuth2ClientItem {
  clientSecret?: string;
  grantTypes?: string;
  scopes?: string;
  redirectUris?: string;
  autoApprove?: number;
  accessTokenValidity?: number;
  refreshTokenValidity?: number;
  additionalInformation?: string;
}

export interface OAuth2ClientPageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  clientId?: string;
  clientName?: string;
  status?: number;
}

export interface OAuth2ClientPageResult {
  data: OAuth2ClientItem[];
  total: number;
}

export interface OAuth2ClientMutationPayload {
  clientId: string;
  clientSecret?: string;
  clientName?: string;
  grantTypes?: string;
  scopes?: string;
  redirectUris?: string;
  autoApprove?: number;
  accessTokenValidity?: number;
  refreshTokenValidity?: number;
  additionalInformation?: string;
  status?: number;
}

export interface OAuth2AccountItem {
  id: string;
  userId: string;
  provider?: string;
  oauth2AccountId?: string;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

export interface OAuth2AccountDetail extends OAuth2AccountItem {
  username?: string;
  nickname?: string;
  providerId?: string;
  providerUserId?: string;
  providerAttributes?: string;
  linkedAt?: string;
}

export interface OAuth2AccountPageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  userId?: string;
  providerId?: string;
  status?: number;
}

export interface OAuth2AccountPageResult {
  data: OAuth2AccountItem[];
  total: number;
}

export interface OAuth2AccountMutationPayload {
  userId: string;
  providerId: string;
  providerUserId?: string;
  providerAttributes?: string;
}

export interface NotifyTemplateItem {
  id: string;
  templateCode: string;
  templateName: string;
  channelType: string;
  status?: number;
  isBuiltin?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface NotifyTemplateDetail extends NotifyTemplateItem {
  subjectTemplate?: string;
  contentTemplate?: string;
}

export interface NotifyTemplatePageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  templateCode?: string;
  templateName?: string;
  channelType?: string;
  status?: number;
}

export interface NotifyTemplatePageResult {
  data: NotifyTemplateItem[];
  total: number;
}

export interface NotifyTemplateMutationPayload {
  templateCode: string;
  templateName: string;
  channelType: string;
  subjectTemplate?: string;
  contentTemplate: string;
  status?: number;
  isBuiltin?: number;
  remark?: string;
}

export interface NotifyRecordItem {
  id: string;
  bizType?: string;
  bizNo?: string;
  channelType: string;
  templateCode?: string;
  subjectText?: string;
  receiver?: string;
  ccReceiver?: string;
  sendStatus?: string;
  failReason?: string;
  sendTime?: string;
  contentText?: string;
  extJson?: string;
  createTime?: string;
  updateTime?: string;
}

export interface NotifyRecordDetail extends NotifyRecordItem {}

export interface NotifyRecordPageQuery {
  pageNum: number;
  pageSize: number;
  orderName?: string;
  orderType?: string;
  channelType?: string;
  templateCode?: string;
  receiver?: string;
  sendStatus?: string;
}

export interface NotifyRecordPageResult {
  data: NotifyRecordItem[];
  total: number;
}

export interface SendNotifyPayload {
  channelType: string;
  templateCode?: string;
  templateParams?: Record<string, string>;
  subject?: string;
  content?: string;
  receiver?: string;
  ccReceiver?: string;
  receiverUserId?: string;
  bizType?: string;
  bizNo?: string;
  extJson?: string;
}

export type DictMap = Record<string, DictRecord[]>;

export type ConfigMap = Record<string, string | number | boolean | null>;

export interface NotificationItem {
  id: string;
  title: string;
  content?: string;
  type: "info" | "warning" | "error";
  category?: "notification" | "announcement" | "unknown";
  actionable?: boolean;
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
    hasAnyCode: (codes: string[]) => boolean;
    hasAllCode: (codes: string[]) => boolean;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasAllRole: (roles: string[]) => boolean;
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

// ============================================================
// Mobile types - for React Native / mobile specific functionality
// ============================================================

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
