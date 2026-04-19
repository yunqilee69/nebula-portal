import { registryRouteComponents, type RouteComponentLoaderMap } from "@nebula/core";
import {
  AdvancedCachePage,
  AdvancedConfigPage,
  AdvancedDictPage,
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
  "nebula/DashboardPage": async () => ({ default: DashboardPage }),
  "nebula/OperationsMenuPage": async () => ({ default: OperationsMenuPage }),
  "nebula/OperationsOrgPage": async () => ({ default: OperationsOrgPage }),
  "nebula/OperationsRolePage": async () => ({ default: OperationsRolePage }),
  "nebula/OperationsUserPage": async () => ({ default: OperationsUserPage }),
  "nebula/OperationsPermissionPage": async () => ({ default: OperationsPermissionPage }),
  "nebula/NotificationsRecordPage": async () => ({ default: NotificationsRecordPage }),
  "nebula/NotificationsTemplatePage": async () => ({ default: NotificationsTemplatePage }),
  "nebula/NotificationsAnnouncementPage": async () => ({ default: NotificationsAnnouncementPage }),
  "nebula/AdvancedDictPage": async () => ({ default: AdvancedDictPage }),
  "nebula/AdvancedParamPage": async () => ({ default: AdvancedParamPage }),
  "nebula/AdvancedConfigPage": async () => ({ default: AdvancedConfigPage }),
  "nebula/AdvancedOAuth2ClientPage": async () => ({ default: AdvancedOAuth2ClientPage }),
  "nebula/AdvancedOAuth2AccountPage": async () => ({ default: AdvancedOAuth2AccountPage }),
  "nebula/AdvancedCachePage": async () => ({ default: AdvancedCachePage }),
  "nebula/StorageCenter": async () => ({ default: StorageCenterPage }),
  "nebula/StorageUploadTaskPage": async () => ({ default: StorageUploadTaskPage }),
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
