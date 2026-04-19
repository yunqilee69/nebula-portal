import type { PlatformModule, RouteComponentLoaderMap } from "@nebula/core";
import { registerModule } from "@nebula/core";
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
};

const nebulaPlatformModule: PlatformModule = {
  id: "@nebula/platform-pages",
  name: "Nebula Platform Pages",
  version: "1.0.0",
  routeComponents: nebulaRouteComponents,
};

let registered = false;

export function registerNebulaPages() {
  if (registered) {
    return;
  }

  registerModule(nebulaPlatformModule);
  registered = true;
}
