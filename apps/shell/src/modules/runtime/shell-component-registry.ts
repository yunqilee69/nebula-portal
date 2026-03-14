import { registerComponents } from "@platform/core";

let registered = false;

export function registerShellComponents() {
  if (registered) {
    return;
  }

  registerComponents({
    "shell/DashboardPage": async () => ({ default: (await import("../../pages/dashboard")).DashboardPage }),
    "shell/MenuManagementPage": async () => ({ default: (await import("../../pages/menu/list")).MenuManagementPage }),
    "shell/OrganizationManagementPage": async () => ({ default: (await import("../../pages/organization/list")).OrganizationManagementPage }),
    "shell/UserManagementPage": async () => ({ default: (await import("../../pages/user/list")).UserManagementPage }),
    "shell/DictManagementPage": async () => ({ default: (await import("../../pages/dict/list")).DictManagementPage }),
    "shell/OAuth2ClientManagementPage": async () => ({ default: (await import("../../pages/oauth2-client/list")).OAuth2ClientManagementPage }),
    "shell/OAuth2AccountManagementPage": async () => ({ default: (await import("../../pages/oauth2-account/list")).OAuth2AccountManagementPage }),
    "shell/PermissionAssignmentPage": async () => ({ default: (await import("../../pages/permission-assignment/list")).PermissionAssignmentPage }),
    "shell/OrgPermissionPage": async () => ({ default: (await import("../../pages/permission-assignment/list")).PermissionAssignmentPage }),
    "shell/MenuPermissionPage": async () => ({ default: (await import("../../pages/permission-assignment/list")).PermissionAssignmentPage }),
    "shell/ButtonPermissionPage": async () => ({ default: (await import("../../pages/permission-assignment/list")).PermissionAssignmentPage }),
    "shell/SystemParamsPage": async () => ({ default: (await import("../../pages/system-param/list")).SystemParamsPage }),
    "shell/NotifyTemplateManagementPage": async () => ({ default: (await import("../../pages/notify-template/list")).NotifyTemplateManagementPage }),
    "shell/NotifyRecordPage": async () => ({ default: (await import("../../pages/notify-record/list")).NotifyRecordPage }),
    "shell/NotificationsPage": async () => ({ default: (await import("../../pages/notification/list")).NotificationsPage }),
    "shell/RoleManagementPage": async () => ({ default: (await import("../../pages/role/list")).RoleManagementPage }),
    "shell/StorageCenterPage": async () => ({ default: (await import("../../pages/storage/list")).StorageCenterPage }),
  });

  registered = true;
}
