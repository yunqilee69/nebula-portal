# @nebula/core

Nebula 中台基座的共享核心契约包。

## 提供的核心能力

- `AppContextProvider` / `useAppContext`：业务页面访问基座能力的统一入口
- 路由组件注册：`registryRouteComponent`、`registryRouteComponents`、`listRegisteredRouteComponents`、`loadRouteComponent`
- 平台路由构建能力：`buildRoutesFromMenus`
- 权限：`NePermission`、`usePermission`
- 国际化：`I18nProvider`、`useI18n`
- 事件总线：`eventBus`

## 路由组件接入约定

当前基座不再通过 `PlatformModule` 做模块注册，而是直接维护 **菜单配置 + 路由组件注册表**：

1. 后端菜单中的 `component` 字段声明页面组件 key，例如 `crm/CustomerListPage`
2. 前端通过 `registryRouteComponent(...)` 或 `registryRouteComponents(...)` 注册该 key 对应的组件加载器
3. 运行时通过 `buildRoutesFromMenus(...)` 和 `loadRouteComponent(...)` 将菜单项解析为实际页面组件

示例：

```ts
import { registryRouteComponents, type RouteComponentLoaderMap } from "@nebula/core";

const crmRouteComponents: RouteComponentLoaderMap = {
  "crm/CustomerListPage": async () => ({
    default: (await import("./pages/customer-list-page")).CustomerListPage,
  }),
  "crm/CustomerDetailPage": async () => ({
    default: (await import("./pages/customer-detail-page")).CustomerDetailPage,
  }),
};

registryRouteComponents(crmRouteComponents, "CRM Pages");
```

如果只注册单个页面，也可以直接调用：

```ts
import { registryRouteComponent } from "@nebula/core";

registryRouteComponent(
  "crm/CustomerListPage",
  async () => ({ default: (await import("./pages/customer-list-page")).CustomerListPage }),
  "CRM Pages",
);
```

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
