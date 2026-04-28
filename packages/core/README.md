# @nebula/core

Nebula 中台基座的共享核心契约包。

## 提供的核心能力

- `AppContextProvider` / `useAppContext`：业务页面访问基座能力的统一入口
- 路由组件注册：`registerRouteComponent`、`registerRouteComponents`、`listRegisteredRouteComponents`、`loadRouteComponent`
- 静态路由注册：`registerStaticRoute`、`registerStaticRoutes`、`getAllStaticRoutes`、`findStaticRouteByPath`
- 平台路由构建能力：`buildRoutesFromMenus`
- 权限：`NePermission`、`usePermission`
- 国际化：`I18nProvider`、`useI18n`
- 事件总线：`eventBus`

## 路由组件接入约定

当前基座不再通过 `PlatformModule` 做模块注册，而是直接维护 **菜单配置 + 路由组件注册表**：

1. 后端菜单中的 `component` 字段声明页面组件 key，例如 `crm/CustomerListPage`
2. 前端通过 `registerRouteComponent(...)` 或 `registerRouteComponents(...)` 注册该 key 对应的组件加载器
3. 运行时通过 `buildRoutesFromMenus(...)` 和 `loadRouteComponent(...)` 将菜单项解析为实际页面组件

示例：

```ts
import { registerRouteComponents, type RouteComponentLoaderMap } from "@nebula/core";

const crmRouteComponents: RouteComponentLoaderMap = {
  "crm/CustomerListPage": async () => ({
    default: (await import("./pages/customer-list-page")).CustomerListPage,
  }),
  "crm/CustomerDetailPage": async () => ({
    default: (await import("./pages/customer-detail-page")).CustomerDetailPage,
  }),
};

registerRouteComponents(crmRouteComponents, "CRM Pages");
```

如果只注册单个页面，也可以直接调用：

```ts
import { registerRouteComponent } from "@nebula/core";

registerRouteComponent(
  "crm/CustomerListPage",
  async () => ({ default: (await import("./pages/customer-list-page")).CustomerListPage }),
  "CRM Pages",
);
```

## 静态路由接入约定

静态路由是指**不依赖后端菜单下发**的前端固定路由，用于处理：
- 不应出现在侧边栏菜单的子页面（如字典项管理）
- 平台内置页面（如仪表盘、内嵌页面）
- 特殊功能页面（如数据导入导出）

**注意**：静态路由与菜单组件注册是**互斥场景**。静态路由的组件不会出现在菜单管理页面的"选择组件"下拉框中。

### 配置结构

静态路由配置项 `StaticRouteItem` 与后端 `MenuItem` 类型对应：

```ts
interface StaticRouteItem {
  id: string;                  // 路由唯一标识
  path: string;                // 路由路径
  name: string;                // 菜单名称（用于 tab 标签、面包屑）
  nameKey?: string;            // 名称国际化 key（优先使用）
  icon?: string;               // 菜单图标
  permission?: string;         // 权限码
  visible?: boolean;           // 是否显示在侧边栏，默认 false
  sort?: number;               // 排序
  componentLoader: () => Promise<{ default: ComponentType }>;  // 组件加载器（懒加载）
}
```

### 注册方式

直接注册静态路由配置 + 组件加载器：

```ts
import { registerStaticRoutes, type StaticRouteItem } from "@nebula/core";

const crmStaticRoutes: StaticRouteItem[] = [
  {
    id: "crm-data-import",
    path: "/crm/data-import",
    name: "数据导入",
    nameKey: "crm.dataImport",
    visible: false,
    sort: 300,
    componentLoader: async () => ({ default: DataImportPage }),
  },
  {
    id: "crm-data-export",
    path: "/crm/data-export",
    name: "数据导出",
    nameKey: "crm.dataExport",
    visible: false,
    sort: 400,
    componentLoader: async () => ({ default: DataExportPage }),
  },
];

registerStaticRoutes(crmStaticRoutes, "CRM Pages");
```

### 注册时机

静态路由应在**应用启动前**注册，推荐在业务模块的注册文件中调用：

```ts
// apps/web/src/platform/register-crm-pages.ts
import { registerRouteComponents, registerStaticRoutes } from "@nebula/core";

// 注册后端菜单对应的路由组件（菜单管理页面可选择）
registerRouteComponents({
  "crm/CustomerListPage": async () => ({ default: CustomerListPage }),
}, "CRM Pages");

// 注册前端静态路由（组件不会出现在菜单管理页面）
registerStaticRoutes([
  {
    id: "crm-data-import",
    path: "/crm/data-import",
    name: "数据导入",
    componentLoader: async () => ({ default: DataImportPage }),
    ...
  },
], "CRM Pages");
```

然后在 `apps/web/src/app.tsx` 中导入执行：

```ts
import { registerNebulaPages } from "./platform/register-nebula-pages";
import { registerCrmPages } from "./platform/register-crm-pages";

registerNebulaPages();
registerCrmPages();
```

### 注册顺序与冲突解决

**注册顺序**：
1. `@nebula/core` 内置路由（dashboard、iframe、dict-items）在模块初始化时自动注册
2. 业务模块调用 `registerStaticRoutes` 时按调用顺序注册
3. 路由列表通过 `getAllStaticRoutes()` 获取时按 `sort` 字段排序

**冲突解决策略**：
- 相同 `path` 的路由只能注册一次
- 如果相同 `path` 已被不同 `source` 注册，新注册会被拒绝
- **开发环境**：冲突时抛出 `Error`，便于及早发现问题
- **生产环境**：冲突时输出 `console.warn` 并静默跳过

**路径规范化**：
- 注册和查找时自动规范化路径（移除尾部斜杠）
- `/dashboard/` 与 `/dashboard` 视为同一路径

### 场景对比

| 注册方式 | 场景 | 菜单管理页面显示 |
|---------|------|----------------|
| `registerRouteComponents` | 后端下发菜单 | ✅ 可选择 |
| `registerStaticRoutes` | 前端固定路由 | ❌ 不显示 |

### 注意事项

- 相同 `path` 的路由只能注册一次，开发环境冲突会抛出错误
- 静态路由的 `nameKey` 用于国际化，需在对应的 i18n messages 中定义
- `visible: true` 的静态路由会显示在侧边栏菜单（按 sort 排序）
- 核心平台路由（dashboard、iframe、dict-items）由 `@nebula/core` 内置，无需手动注册

## AppContext 当前提供的能力

### auth

- `getToken()`：获取当前 token
- `getSession()`：获取当前登录会话
- `hasPermission(code)`：校验权限码
- `redirectToLogin()`：跳转登录页
- `logout()`：退出登录

### dict

- `get(key)`：获取指定字典项
- `all()`：获取全部字典缓存

### config

- `get(key)`：获取指定系统配置
- `all()`：获取全部系统配置

### notifications

- `all()`：获取通知列表
- `unreadCount()`：获取未读通知数量

### request

- `get(url, params)`：发送 GET 请求
- `post(url, payload)`：发送 POST 请求
- `put(url, payload)`：发送 PUT 请求
- `delete(url)`：发送 DELETE 请求

### storage

- `previewUrl(file)`：生成文件预览地址
- `downloadUrl(file)`：生成文件下载地址

### i18n

- `getLocale()`：获取当前语言
- `setLocale(locale)`：切换当前语言
- `t(key, fallback?, variables?)`：获取翻译文案

### bus

- `on` / `emit` / `off`：通过事件总线与基座或其他页面通讯

## 存储能力对接说明

- 基座当前按 `nebula-storage` 的最新 simple upload 流程接入普通文件上传
- 普通文件的实际顺序为：直接上传文件 -> 绑定上传任务 -> 查询正式文件详情
- 业务保存文件时，应至少提供：
  - `sourceEntity`
  - `sourceId`
  - 可选 `sourceType`，默认 `default`
- 前端共享类型 `StorageUploadPayload` 和 `StorageFileItem` 已按该流程调整
- 如果是大文件或分片上传场景，仍应改走 upload task / part / complete 的 chunk 流程

## 接入建议

- 业务页面只维护本域页面组件与组件 key 的映射关系
- 菜单里的 `component` 字段应与前端注册过的 route component key 保持一致
- 认证、权限、请求、主题、通知、字典、配置、存储地址解析等平台级能力优先复用基座提供的上下文
- 公共界面组件优先从 `@nebula/ui-web` 获取，不在业务页面重复封装