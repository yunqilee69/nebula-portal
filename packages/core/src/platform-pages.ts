export interface PlatformPageDefinition {
  id: string;
  title: string;
  titleKey?: string;
  description: string;
  descriptionKey?: string;
  path: string;
  menuName: string;
  menuNameKey?: string;
  componentKey: string;
  sort: number;
}

export const platformPageDefinitions: PlatformPageDefinition[] = [
  {
    id: "platform-menus",
    title: "菜单管理",
    titleKey: "platform.menuManagement.title",
    description: "维护菜单定义、路由绑定与显示状态。",
    descriptionKey: "platform.menuManagement.subtitle",
    path: "/platform/menus",
    menuName: "菜单管理",
    menuNameKey: "platform.menuManagement.title",
    componentKey: "shell/MenuManagementPage",
    sort: 1,
  },
  {
    id: "platform-params",
    title: "系统参数",
    titleKey: "platform.systemParams.title",
    description: "维护可复用的平台配置项。",
    descriptionKey: "platform.systemParams.subtitle",
    path: "/platform/params",
    menuName: "系统参数",
    menuNameKey: "platform.systemParams.title",
    componentKey: "shell/SystemParamsPage",
    sort: 6,
  },
  {
    id: "platform-notifications",
    title: "站内通知",
    titleKey: "platform.notifications.title",
    description: "查看站内消息并处理未读状态。",
    descriptionKey: "platform.notifications.subtitle",
    path: "/platform/notifications",
    menuName: "站内通知",
    menuNameKey: "platform.notifications.title",
    componentKey: "shell/NotificationsPage",
    sort: 7,
  },
  {
    id: "platform-access",
    title: "访问映射",
    titleKey: "platform.roleAccess.title",
    description: "查看角色、权限与当前基座菜单路由映射。",
    descriptionKey: "platform.roleAccess.subtitle",
    path: "/platform/access",
    menuName: "访问映射",
    menuNameKey: "platform.roleAccess.title",
    componentKey: "shell/RoleAccessPage",
    sort: 8,
  },
  {
    id: "platform-organizations",
    title: "组织管理",
    titleKey: "platform.organizationManagement.title",
    description: "维护组织层级、负责人和启停状态。",
    descriptionKey: "platform.organizationManagement.subtitle",
    path: "/platform/organizations",
    menuName: "组织管理",
    menuNameKey: "platform.organizationManagement.title",
    componentKey: "shell/OrganizationManagementPage",
    sort: 2,
  },
  {
    id: "platform-org-permissions",
    title: "组织权限",
    titleKey: "platform.orgPermission.title",
    description: "为组织直接分配菜单和按钮权限。",
    descriptionKey: "platform.orgPermission.subtitle",
    path: "/platform/org-permissions",
    menuName: "组织权限",
    menuNameKey: "platform.orgPermission.title",
    componentKey: "shell/OrgPermissionPage",
    sort: 3,
  },
  {
    id: "platform-menu-permissions",
    title: "菜单权限",
    titleKey: "platform.menuPermission.title",
    description: "查看并维护菜单资源上的授权关系。",
    descriptionKey: "platform.menuPermission.subtitle",
    path: "/platform/menu-permissions",
    menuName: "菜单权限",
    menuNameKey: "platform.menuPermission.title",
    componentKey: "shell/MenuPermissionPage",
    sort: 4,
  },
  {
    id: "platform-button-permissions",
    title: "按钮权限",
    titleKey: "platform.buttonPermission.title",
    description: "维护按钮资源并管理其授权关系。",
    descriptionKey: "platform.buttonPermission.subtitle",
    path: "/platform/button-permissions",
    menuName: "按钮权限",
    menuNameKey: "platform.buttonPermission.title",
    componentKey: "shell/ButtonPermissionPage",
    sort: 5,
  },
  {
    id: "platform-storage",
    title: "存储中心",
    titleKey: "platform.storage.title",
    description: "上传、预览并管理平台文件资产。",
    descriptionKey: "platform.storage.subtitle",
    path: "/platform/storage",
    menuName: "存储中心",
    menuNameKey: "platform.storage.title",
    componentKey: "shell/StorageCenterPage",
    sort: 9,
  },
];
