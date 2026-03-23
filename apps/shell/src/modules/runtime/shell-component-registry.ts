import { registerComponents } from "@platform/core";

let registered = false;

export function registerShellComponents() {
  if (registered) {
    return;
  }

  registerComponents({
    "shell/DashboardPage": async () => ({ default: (await import("../../pages/dashboard")).DashboardPage }),
    "shell/OperationsMenuPage": async () => ({ default: (await import("@/pages/operations/menu/index")).OperationsMenuPage }),
    "shell/OperationsOrgPage": async () => ({ default: (await import("@/pages/operations/org/index")).OperationsOrgPage }),
    "shell/OperationsUserPage": async () => ({ default: (await import("@/pages/operations/user/index")).OperationsUserPage }),
    "shell/AdvancedDictPage": async () => ({ default: (await import("@/pages/advanced/dict/index")).AdvancedDictPage }),
    "shell/AdvancedOAuth2ClientPage": async () => ({ default: (await import("@/pages/advanced/oauth2/client/index")).AdvancedOAuth2ClientPage }),
    "shell/AdvancedOAuth2AccountPage": async () => ({ default: (await import("@/pages/advanced/oauth2/account/index")).AdvancedOAuth2AccountPage }),
    "shell/OperationsPermissionPage": async () => ({ default: (await import("@/pages/operations/permission/index")).OperationsPermissionPage }),
    "shell/AdvancedParamPage": async () => ({ default: (await import("@/pages/advanced/param/index")).AdvancedParamPage }),
    "shell/AdvancedConfigPage": async () => ({ default: (await import("@/pages/advanced/config/index")).AdvancedConfigPage }),
    "shell/AdvancedCachePage": async () => ({ default: (await import("@/pages/advanced/cache/index")).AdvancedCachePage }),
    "shell/NotificationsTemplatePage": async () => ({ default: (await import("@/pages/notifications/template/index")).NotificationsTemplatePage }),
    "shell/NotificationsRecordPage": async () => ({ default: (await import("@/pages/notifications/record/index")).NotificationsRecordPage }),
    "shell/NotificationsAnnouncementPage": async () => ({ default: (await import("@/pages/notifications/announcement/index")).NotificationsAnnouncementPage }),
    "shell/OperationsRolePage": async () => ({ default: (await import("@/pages/operations/role/index")).OperationsRolePage }),
  }, "Nebula Shell");

  registered = true;
}
