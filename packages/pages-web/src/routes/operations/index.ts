import { OperationsMenuPage } from "../../pages/operations/menu";
import { OperationsOrgPage } from "../../pages/operations/org";
import { OperationsRolePage } from "../../pages/operations/role";
import { OperationsUserPage } from "../../pages/operations/user";
import { OperationsPermissionPage } from "../../pages/operations/permission";
import type { RouteComponentLoaderMap } from "@nebula/core";

export const operationsRoutes: RouteComponentLoaderMap = {
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
};