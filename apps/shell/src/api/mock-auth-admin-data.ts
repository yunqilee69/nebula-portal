import type { ButtonItem, OrganizationItem, PermissionItem } from "@platform/core";

const now = new Date().toISOString();

export const mockOrganizations: OrganizationItem[] = [
  {
    id: "org-root",
    name: "Nebula HQ",
    code: "NEBULA",
    leader: "Lydia",
    phone: "13800000001",
    address: "Shanghai Zhangjiang",
    status: 1,
    createTime: now,
    updateTime: now,
  },
  {
    id: "org-tech",
    name: "Technology Center",
    code: "TECH",
    leader: "Mason",
    phone: "13800000002",
    address: "Shanghai Pudong",
    parentId: "org-root",
    status: 1,
    createTime: now,
    updateTime: now,
  },
  {
    id: "org-ops",
    name: "Operations Center",
    code: "OPS",
    leader: "Ava",
    phone: "13800000003",
    address: "Shanghai Minhang",
    parentId: "org-root",
    status: 1,
    createTime: now,
    updateTime: now,
  },
];

export const mockButtons: ButtonItem[] = [
  {
    id: "btn-customer-create",
    menuId: "menu-2",
    code: "crm:customer:create",
    name: "Create Customer",
    type: "add",
    sort: 1,
    status: 1,
    createTime: now,
    updateTime: now,
  },
  {
    id: "btn-customer-edit",
    menuId: "menu-2",
    code: "crm:customer:edit",
    name: "Edit Customer",
    type: "edit",
    sort: 2,
    status: 1,
    createTime: now,
    updateTime: now,
  },
  {
    id: "btn-customer-export",
    menuId: "menu-2",
    code: "crm:customer:export",
    name: "Export Customer",
    type: "export",
    sort: 3,
    status: 1,
    createTime: now,
    updateTime: now,
  },
];

export const mockPermissions: PermissionItem[] = [
  {
    id: "perm-org-tech-menu",
    subjectType: "ORG",
    subjectId: "org-tech",
    resourceType: "MENU",
    resourceId: "menu-2",
    effect: "Allow",
    scope: "ALL",
    createTime: now,
    updateTime: now,
  },
  {
    id: "perm-org-ops-button",
    subjectType: "ORG",
    subjectId: "org-ops",
    resourceType: "BUTTON",
    resourceId: "btn-customer-export",
    effect: "Deny",
    scope: "ALL",
    createTime: now,
    updateTime: now,
  },
  {
    id: "perm-role-admin-menu",
    subjectType: "ROLE",
    subjectId: "role-1",
    resourceType: "MENU",
    resourceId: "menu-2",
    effect: "Allow",
    scope: "ALL",
    createTime: now,
    updateTime: now,
  },
  {
    id: "perm-role-operator-button",
    subjectType: "ROLE",
    subjectId: "role-2",
    resourceType: "BUTTON",
    resourceId: "btn-customer-create",
    effect: "Allow",
    scope: "ALL",
    createTime: now,
    updateTime: now,
  },
];

export function stampUpdatedTime() {
  return new Date().toISOString();
}
