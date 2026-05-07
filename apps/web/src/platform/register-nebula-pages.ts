import { registryRouteComponents, type RouteComponentLoaderMap } from "@nebula/core";
import {
  AdvancedCachePage,
  AdvancedConfigPage,
  AdvancedDictPage,
  AdvancedDictItemsPage,
  AdvancedOAuth2AccountPage,
  AdvancedOAuth2ClientPage,
  AdvancedParamPage,
  DashboardPage,
  NotificationsAnnouncementPage,
  NotificationsRecordPage,
  NotificationsTemplatePage,
  OperationsMenuPage,
  OperationsOrgPage,
  OperationsPermissionPage,
  OperationsRolePage,
  OperationsUserPage,
  StorageCenterPage,
  StorageUploadTaskPage,
} from "@nebula/pages-web";

const nebulaRouteComponents: RouteComponentLoaderMap = {
  DashboardPage: {
    loader: async () => ({ default: DashboardPage }),
    meta: {
      nameKey: "dashboard.title",
      path: "/dashboard",
      icon: "DashboardOutlined",
      sort: 0,
    },
  },
  OperationsMenuPage: {
    loader: async () => ({ default: OperationsMenuPage }),
    meta: {
      nameKey: "platform.menuManagement.title",
      path: "/system/menu",
      icon: "MenuOutlined",
      permission: "system:menu:view",
      sort: 100,
    },
  },
  OperationsOrgPage: {
    loader: async () => ({ default: OperationsOrgPage }),
    meta: {
      nameKey: "platform.organizationManagement.title",
      path: "/system/org",
      icon: "ApartmentOutlined",
      permission: "system:org:view",
      sort: 200,
    },
  },
  OperationsRolePage: {
    loader: async () => ({ default: OperationsRolePage }),
    meta: {
      nameKey: "platform.roleManagement.title",
      path: "/system/role",
      icon: "TeamOutlined",
      permission: "system:role:view",
      sort: 300,
    },
  },
  OperationsUserPage: {
    loader: async () => ({ default: OperationsUserPage }),
    meta: {
      nameKey: "platform.userManagement.title",
      path: "/system/user",
      icon: "UserOutlined",
      permission: "system:user:view",
      sort: 400,
    },
  },
  OperationsPermissionPage: {
    loader: async () => ({ default: OperationsPermissionPage }),
    meta: {
      nameKey: "platform.permissionAssignment.title",
      path: "/system/permission",
      icon: "SafetyOutlined",
      permission: "system:permission:view",
      sort: 500,
    },
  },
  NotificationsRecordPage: {
    loader: async () => ({ default: NotificationsRecordPage }),
    meta: {
      nameKey: "platform.notifyRecordManagement.title",
      path: "/notify/record",
      icon: "BellOutlined",
      permission: "system:notify:view",
      sort: 600,
    },
  },
  NotificationsTemplatePage: {
    loader: async () => ({ default: NotificationsTemplatePage }),
    meta: {
      nameKey: "platform.notifyTemplateManagement.title",
      path: "/notify/template",
      icon: "FileTextOutlined",
      permission: "system:notify-template:view",
      sort: 700,
    },
  },
  NotificationsAnnouncementPage: {
    loader: async () => ({ default: NotificationsAnnouncementPage }),
    meta: {
      nameKey: "platform.notifications.title",
      path: "/notify/announcement",
      icon: "NotificationOutlined",
      permission: "system:announcement:view",
      sort: 800,
    },
  },
  AdvancedDictPage: {
    loader: async () => ({ default: AdvancedDictPage }),
    meta: {
      nameKey: "platform.dictManagement.title",
      path: "/system/dict",
      icon: "BookOutlined",
      permission: "system:dict:view",
      sort: 900,
    },
  },
  AdvancedDictItemsPage: {
    loader: async () => ({ default: AdvancedDictItemsPage }),
    meta: {
      nameKey: "dict.itemsManagementTitle",
      path: "/system/dict-items",
      icon: "UnorderedListOutlined",
      permission: "system:dict:view",
      sort: 910,
    },
  },
  AdvancedParamPage: {
    loader: async () => ({ default: AdvancedParamPage }),
    meta: {
      nameKey: "platform.systemParams.title",
      path: "/system/param",
      icon: "SettingOutlined",
      permission: "system:param:view",
      sort: 1000,
    },
  },
  AdvancedConfigPage: {
    loader: async () => ({ default: AdvancedConfigPage }),
    meta: {
      nameKey: "platform.frontendSettings.title",
      path: "/system/config",
      icon: "ControlOutlined",
      permission: "system:config:view",
      sort: 1100,
    },
  },
  AdvancedOAuth2ClientPage: {
    loader: async () => ({ default: AdvancedOAuth2ClientPage }),
    meta: {
      nameKey: "platform.oauth2ClientManagement.title",
      path: "/system/oauth2/client",
      icon: "ApiOutlined",
      permission: "system:oauth2-client:view",
      sort: 1200,
    },
  },
  AdvancedOAuth2AccountPage: {
    loader: async () => ({ default: AdvancedOAuth2AccountPage }),
    meta: {
      nameKey: "platform.oauth2AccountManagement.title",
      path: "/system/oauth2/account",
      icon: "LinkOutlined",
      permission: "system:oauth2-account:view",
      sort: 1300,
    },
  },
  AdvancedCachePage: {
    loader: async () => ({ default: AdvancedCachePage }),
    meta: {
      nameKey: "platform.frontendCache.title",
      path: "/system/cache",
      icon: "DatabaseOutlined",
      permission: "system:cache:view",
      sort: 1400,
    },
  },
  StorageCenterPage: {
    loader: async () => ({ default: StorageCenterPage }),
    meta: {
      nameKey: "platform.storage.title",
      path: "/storage/center",
      icon: "CloudOutlined",
      permission: "system:storage:view",
      sort: 1500,
    },
  },
  StorageUploadTaskPage: {
    loader: async () => ({ default: StorageUploadTaskPage }),
    meta: {
      nameKey: "storage.uploadPanel",
      path: "/storage/upload-task",
      icon: "UploadOutlined",
      permission: "system:storage:view",
      sort: 1510,
    },
  },
};

const nebulaPagesRegistrationFlag = "__nebulaPlatformPagesRegistered__";
const nebulaPagesRegistrationSource = "Nebula Platform Pages";

type GlobalRegistrationState = typeof globalThis & {
  [nebulaPagesRegistrationFlag]?: boolean;
};

export function registerNebulaPages() {
  const globalRegistrationState = globalThis as GlobalRegistrationState;

  if (globalRegistrationState[nebulaPagesRegistrationFlag]) {
    return;
  }

  registryRouteComponents(nebulaRouteComponents, nebulaPagesRegistrationSource);
  globalRegistrationState[nebulaPagesRegistrationFlag] = true;
}