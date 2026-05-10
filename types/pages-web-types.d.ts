interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_LOGIN_PATH?: string;
  readonly VITE_AUTH_REFRESH_PATH?: string;
  readonly VITE_AUTH_LOGOUT_PATH?: string;
  readonly VITE_AUTH_CURRENT_USER_PATH?: string;
  readonly VITE_AUTH_WECHAT_WEB_REDIRECT_PREPARE_PATH?: string;
  readonly VITE_AUTH_WECHAT_WEB_REDIRECT_CALLBACK_PATH?: string;
  readonly VITE_AUTH_WECHAT_WEB_QRCODE_PATH?: string;
  readonly VITE_AUTH_WECHAT_WEB_STATUS_PATH?: string;
  readonly VITE_AUTH_WECHAT_WEB_CALLBACK_PATH?: string;
  readonly VITE_MENU_CURRENT_PATH?: string;
  readonly VITE_NOTIFY_CURRENT_PATH?: string;
  readonly VITE_NOTIFY_READ_PATH_TEMPLATE?: string;
  readonly VITE_I18N_CURRENT_LOCALE_PATH?: string;
  readonly VITE_I18N_SWITCH_LOCALE_PATH?: string;
  readonly VITE_STORAGE_UPLOAD_TASK_PATH?: string;
  readonly VITE_STORAGE_UPLOAD_TASK_PAGE_PATH?: string;
  readonly VITE_STORAGE_UPLOAD_PATH?: string;
  readonly VITE_STORAGE_UPLOAD_COMPLETE_PATH_TEMPLATE?: string;
  readonly VITE_STORAGE_UPLOAD_BIND_PATH_TEMPLATE?: string;
  readonly VITE_STORAGE_FILE_PAGE_PATH?: string;
  readonly VITE_STORAGE_FILE_DETAIL_PATH_TEMPLATE?: string;
  readonly VITE_STORAGE_DOWNLOAD_PATH?: string;
  readonly VITE_STORAGE_SIGNED_DOWNLOAD_PATH?: string;
  readonly VITE_STORAGE_GENERATE_SIGNED_URL_PATH?: string;
  readonly VITE_STORAGE_FILE_DELETE_PATH_TEMPLATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@nebula/pages-web" {
  import type { ComponentType } from "react";

  export const DashboardPage: ComponentType;
  export const IframePage: ComponentType;
  export const AdvancedDictItemsPage: ComponentType;
}
