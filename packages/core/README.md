# @nebula/core

Nebula 中台基座的共享核心契约包。

## 提供的核心能力

- `AppContextProvider` / `useAppContext`：业务模块访问基座能力的统一入口
- 模块注册：`registerModule`、`getRegisteredModules`、`bootstrapRegisteredModules`
- 路由组件注册：`registryRouteComponent`、`registryRouteComponents`、`loadRouteComponent`
- 权限：`NePermission`、`usePermission`
- 国际化：`I18nProvider`、`useI18n`
- 事件总线：`eventBus`
- 平台路由构建能力：`buildRoutesFromMenus`、`buildModuleRoutes`

## PlatformModule 接入约定

业务模块通过 `PlatformModule` 向基座声明自己提供的能力：

```ts
import type { PlatformModule } from "@nebula/core";

const module: PlatformModule = {
  id: "@business/demo",
  name: "Demo CRM",
  version: "0.1.0",
  routeComponents: {
    "crm/CustomerListPage": async () => ({ default: (await import("./pages/customer-list-page")).CustomerListPage }),
  },
  menus: [
    {
      id: "crm-root",
      name: "客户管理",
      type: 1,
      visible: 1,
      children: [
        {
          id: "crm-list",
          name: "客户列表",
          type: 2,
          path: "/crm/list",
          component: "crm/CustomerListPage",
          linkType: 1,
          visible: 1,
        },
      ],
    },
  ],
  routes: [{ path: "/crm/list", routeComponentKey: "crm/CustomerListPage" }],
  bootstrap: async (ctx) => {
    ctx.bus.emit("business:module-ready", { module: "crm" });
  },
};

export default module;
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

## 存储能力对接说明

- 基座当前按 `nebula-storage` 的真实两阶段流程接入普通文件上传
- 实际顺序为：创建上传任务 -> 上传普通文件 -> 完成上传任务 -> 绑定上传任务 -> 查询正式文件详情
- 业务保存文件时，应至少提供：
  - `sourceEntity`
  - `sourceId`
  - 可选 `sourceType`，默认 `default`
- 前端共享类型 `StorageUploadPayload` 和 `StorageFileItem` 已按该流程调整

### bus

- `on` / `emit` / `off`：通过事件总线与基座或其他模块通讯

## 接入建议

- 业务模块只维护本模块的页面、菜单、路由组件映射和初始化逻辑
- 认证、权限、请求、主题、通知、字典、配置、存储地址解析等平台级能力优先复用基座提供的上下文
- 公共界面组件优先从 `@nebula/ui-web` 获取，不在业务模块重复封装
