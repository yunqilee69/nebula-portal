# Nebula Portal 架构重构计划（含当前落地审计 + Taro 迁移方向）

## TL;DR

> **Quick Summary**: 联邦模式到直接引用模式的核心重构已经基本完成：包名已统一到 `@nebula/*`，`tokens` / `pages-web` / `pages-mobile` 已创建，`theme` 与 `mobile-core` 的核心能力已并入共享包。但清理阶段尚未收尾，Web 端仍未完全成为纯消费者。同时，移动端当前实际技术栈仍是 **Expo + React Native**，与“希望直接支持微信小程序”的新目标不一致。
>
> **Updated Direction**:
> - Web 方向保持：`@nebula/core` + `@nebula/ui-web` + `@nebula/pages-web`
> - Mobile 方向调整：从 **React Native / Expo** 改为 **Taro + 微信小程序优先**
> - 页面层调整：`@nebula/pages-mobile` 不再作为长期目标；改为 **`apps/mini-program`（Taro 应用） + 可选共享逻辑包**
> - 收尾工作：删除遗留目录、让 `apps/web` 真正只消费共享包、完成构建与类型校验
>
> **Current Verdict**:
> - **已完成约 80%**：核心架构迁移已落地
> - **未完成重点**：遗留目录清理、Web 去重、路由完全切到 `pages-web`
> - **新增方向变更**：移动端改为 Taro，需要新增一个独立实施阶段

---

## Context

### Original Request
用户最初希望从联邦模式改为直接引用模式，统一包名结构，支持 Web 和移动端共享逻辑，在组件库之上建立页面层。现在进一步明确：**移动端技术改为使用 Taro，以便直接支持微信小程序**。

### Current Repository Reality
基于本次代码库审计，当前仓库与旧计划相比已经发生了明显演进：

1. **包名统一已完成**：`@nebula/core`、`@nebula/ui-web`、`@nebula/tokens`、`@nebula/pages-web`、`@nebula/pages-mobile` 等都已存在。
2. **联邦配置已从运行时代码中移除**：代码侧已无 `vite-plugin-federation` 和 `VITE_MODULE_MODE` 使用痕迹。
3. **页面与模块迁移大体完成**：`OrganizationTree`、`NotificationPanel`、auth/navigation/menu/runtime/store 等共享化迁移已存在于 `packages/ui` 与 `packages/core`。
4. **Web 页面层已建成**：`packages/pages-web` 中已存在页面实现与 `createNebulaRoutes`。
5. **Mobile 当前并非 Taro**：`apps/mobile/package.json` 明确使用 `expo`、`react-native`、`expo-router`、`@react-native-async-storage/async-storage`。
6. **计划中的删除项尚未彻底清理**：`packages/theme`、`packages/mobile-core`、`apps/demo-business`、`apps/shell`、`templates/business-starter` 仍残留构建产物或目录壳。
7. **Web 还不是纯消费者**：`apps/web/src/app.tsx` 仍混合引用 `@nebula/pages-web` 与本地 `./pages/*`；`apps/web/src/pages` 和 `apps/web/src/api` 仍保留重复实现。

### Why the Mobile Direction Must Change
当前的 `Expo + React Native` 技术栈适合原生 App，但**不能直接产出微信小程序**。如果目标是“小程序优先 + 尽量复用现有共享逻辑”，Taro 比 React Native 更匹配，原因是：

1. **Taro 原生支持微信小程序构建输出**。
2. **Taro 与 React 生态兼容度高**，可以保留一部分组件/逻辑开发习惯。
3. **可以继续复用 `@nebula/core` / `@nebula/auth` / `@nebula/request` / `@nebula/tokens` 中的平台无关逻辑**。
4. **页面层必须重构**：小程序页面、路由、存储、运行时约束与 React Native 不同，现有 `@nebula/pages-mobile` 不能直接作为 Taro 页面层长期承载。

---

## Current Status Audit

### Completed

#### 1. Package naming and path migration
- [x] `@platform/ui → @nebula/ui-web`
- [x] `@platform/core → @nebula/core`
- [x] `@platform/i18n → @nebula/i18n`
- [x] `tsconfig.base.json` 已提供：
  - `@nebula/core`
  - `@nebula/ui-web`
  - `@nebula/tokens`
  - `@nebula/pages-web`
  - `@nebula/pages-mobile`
- [x] 代码侧已无 `@platform/*` 引用

#### 2. Federation removal
- [x] 运行时代码中已无联邦模式残留
- [x] `vite-plugin-federation` 已不在当前 package manifests 中生效
- [x] `VITE_MODULE_MODE` 已不在业务代码中使用

#### 3. Shared package convergence
- [x] `theme` 主要能力已合并进 `packages/tokens`
- [x] `mobile-core` 主要能力已合并进 `packages/core`
- [x] `packages/pages-web` 已创建并已有页面实现
- [x] `packages/pages-mobile` 已创建（但目标需调整）

#### 4. Shared asset migration
- [x] `OrganizationTree` 已进入 `packages/ui`
- [x] `NotificationPanel` 已进入 `packages/ui`
- [x] Auth / I18n / Navigation / Menu / Runtime / Stores 已大体进入 `packages/core`
- [x] `packages/pages-web` 已包含主要管理页与 API 文件

### Partially Implemented / Still Missing

#### 1. Cleanup not finished
- [ ] `packages/theme` 目录未彻底删除
- [ ] `packages/mobile-core` 目录未彻底删除
- [ ] `apps/demo-business` 未彻底删除
- [ ] `apps/shell` 未彻底删除
- [ ] `templates/business-starter` 未彻底删除

#### 2. Web is not yet a pure consumer
- [ ] `apps/web/src/pages` 仍存在重复页面实现
- [ ] `apps/web/src/api` 仍存在重复 API 实现
- [ ] `apps/web/src/app.tsx` 尚未完全改为通过 `@nebula/pages-web` / `createNebulaRoutes` 消费页面层

#### 3. Final verification not done
- [ ] `pnpm build` 尚未作为本计划收尾证据确认
- [ ] `pnpm typecheck` 尚未作为本计划收尾证据确认
- [ ] Web 启动烟雾测试未收尾
- [ ] Mobile 当前还是 Expo/RN，不符合新的 Taro 目标

---

## Work Objectives

### Core Objective
将 Nebula Portal 最终收敛为：

1. **Web 管理端**：`apps/web` 作为纯入口应用，只消费 `@nebula/*` 共享包。
2. **共享能力层**：`@nebula/core`、`@nebula/auth`、`@nebula/request`、`@nebula/tokens` 继续作为跨端复用基础。
3. **Web 页面层**：`@nebula/pages-web` 承载中后台页面实现。
4. **Mini Program 方向**：将当前移动端方案从 Expo/React Native 调整为 **Taro + 微信小程序优先**。

### Concrete Deliverables

#### A. Existing refactor closure
- 删除遗留目录：`packages/theme`、`packages/mobile-core`、`apps/demo-business`、`apps/shell`、`templates/business-starter`
- 清理 `apps/web/src/pages` 与 `apps/web/src/api` 的重复实现
- 让 `apps/web` 只保留入口、布局和 Web 宿主配置，页面与共享逻辑全部从共享包消费
- 补齐 `pnpm build` / `pnpm typecheck` / Web smoke test 的收尾验证

#### B. Mobile strategy shift to Taro
- 终止“继续扩展 Expo/RN 页面层”的路线
- 新建 `apps/mini-program` 作为 **Taro 小程序应用入口**
- 将当前 `packages/pages-mobile` 的定位从“长期移动页面层”改为：
  - **短期**：过渡性产物，保留直到 Taro 页面层替代完成
  - **长期**：删除或改造成仅承载平台无关逻辑的共享包（建议新名字，例如 `packages/pages-shared` 或 `packages/mini-shared`）
- 为 Taro 提供平台适配层：
  - storage（`Taro.setStorage` / `Taro.getStorage`）
  - navigation（`Taro.navigateTo` / `redirectTo` / `reLaunch`）
  - request（基于 Taro request 或兼容封装）
  - 小程序运行时上下文
- 明确微信小程序约束：页面路径、分包、包体积、生命周期、存储容量

---

## Updated Architecture Decision

### Web side
保留当前方向：

- `apps/web`：应用入口 / 宿主配置 / 布局装配
- `packages/pages-web`：页面与页面级 API
- `packages/ui`：Web 组件
- `packages/core`：共享状态、权限、上下文、运行时、业务基础设施
- `packages/tokens`：设计令牌和主题切换

### Mini Program side (new target)
改为如下结构：

- `apps/mini-program`：Taro 应用入口，直接面向微信小程序构建
- `packages/core`：继续承载平台无关的业务逻辑、类型、状态模型
- `packages/tokens`：继续承载设计令牌，但样式输出方式需要适配 Taro / 小程序
- `packages/pages-mobile`：不再继续扩展为 RN 页面层；转为待替换对象
- 可选新增：
  - `packages/mini-runtime`：小程序端运行时封装
  - `packages/pages-shared`：页面级共享 hooks / view-model / schema，而不是直接放完整页面

### Why not keep React Native as the primary mobile route
不建议继续把 React Native 作为主移动方案，原因是：

1. 它无法直接产出微信小程序。
2. 页面、路由、生命周期、存储和宿主能力与小程序不一致，后续再转 Taro 会造成双重迁移。
3. 既然新的业务目标已经明确是“直接支持微信小程序”，那应该尽早把页面层和平台层切到 Taro，而不是继续投资 Expo 页面结构。

---

## Definition of Done

### A. Refactor closure
- [x] 所有核心包已统一为 `@nebula/*`
- [ ] 遗留目录完全删除，不再残留构建壳目录（非移动端项已完成，`packages/mobile-core` 因当前阶段排除移动端而暂未处理）
- [x] `apps/web` 变成纯消费者，不再保留重复 pages/api 实现
- [x] `apps/web` 使用共享页面层路由装配（静态页面与宿主依赖已切到 `@nebula/pages-web`）
- [ ] `pnpm build` 成功
- [ ] `pnpm typecheck` 成功
- [ ] Web 应用启动与关键页面烟雾测试通过

### B. Taro migration readiness
- [ ] 明确废弃 Expo/RN 作为主移动路线
- [ ] 新建 `apps/mini-program`（Taro）应用骨架
- [ ] 明确 `packages/pages-mobile` 的退役或重构路径
- [ ] 定义小程序端 storage / navigation / request / runtime 适配方案
- [ ] 微信小程序构建与分包约束纳入方案

---

## Must Have
- 包名统一为 `@nebula/*`
- Web 端最终只消费共享包
- 共享逻辑继续可被 Web 与小程序复用
- 移动端技术路线改为 Taro，直接支持微信小程序
- 构建和类型检查通过

## Must NOT Have
- **不继续扩展 Expo/RN 页面层** 作为长期目标
- **不把 Taro 目标建立在复制 Web 页面文件即可运行的假设上**
- **不在迁移期间引入与平台强耦合的逻辑进 `@nebula/core`**
- **不保留联邦模式双轨运行**
- **不在 cleanup 未完成时误判为“计划已全部完成”**

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO（当前仍以手工验证为主）
- **Automated tests**: None
- **Agent-Executed QA**: ALWAYS

### QA Policy
每个阶段都必须有“代码存在性 + 宿主运行验证”两类证据。

#### Web
- 启动 `apps/web`
- 检查登录页、Dashboard、至少 1 个 operations 页面、1 个 advanced 页面、1 个 notifications 页面
- 检查主题切换与 API 调用链路

#### Mini Program / Taro
- 启动 Taro dev
- 在微信开发者工具中验证首页或登录页可打开
- 验证 storage 注入与 navigation 跳转
- 验证分包配置与构建产物可输出

---

## Execution Strategy

### Phase 0 — Current-state audit（已完成）
- [x] 审计当前仓库落地情况
- [x] 审计移动端实际仍为 Expo + React Native
- [x] 审计计划与现实的偏差点

### Phase 1 — Existing refactor closure
- [x] 删除 `packages/theme` 遗留目录
- [ ] 删除 `packages/mobile-core` 遗留目录（当前阶段排除移动端，暂不处理）
- [x] 删除 `apps/demo-business` 遗留目录
- [x] 删除 `apps/shell` 遗留目录
- [x] 删除 `templates/business-starter` 遗留目录
- [x] 删除 `apps/web/src/pages` 的重复页面实现
- [x] 删除 `apps/web/src/api` 的重复 API 实现
- [x] 更新 `apps/web/src/app.tsx`，完全使用共享页面层与共享路由装配

### Phase 2 — Taro architecture introduction
- [ ] 新建 `apps/mini-program`
- [ ] 引入 Taro 基础依赖与构建配置
- [ ] 配置工作区，使 Taro 应用可引用共享包
- [ ] 明确 `compile/include` 或等价编译策略，使共享包能被 Taro 编译
- [ ] 建立小程序宿主配置（`app.config.ts`、project config、基础页面）

### Phase 3 — Mini runtime adaptation
- [ ] 建立小程序 storage adapter
- [ ] 建立小程序 navigation adapter
- [ ] 建立小程序 request adapter
- [ ] 审查 `@nebula/core` 中与 Expo / RN 绑定的实现，抽成平台适配层
- [ ] 决定 `packages/pages-mobile` 是删除还是改造为 `pages-shared`

### Phase 4 — Page-layer migration for Taro
- [ ] 从“共享逻辑”与“平台页面壳”拆分移动页面层
- [ ] 不直接照搬 RN 页面；改为 Taro 页面结构与生命周期
- [ ] 先落一个最小闭环：登录页 / 首页 / 1 个业务页
- [ ] 评估并配置微信小程序分包策略

### Phase 5 — Final verification
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Web smoke test
- [ ] Taro dev / build 验证
- [ ] 微信开发者工具侧烟雾测试

---

## Recommended Package Layout After Taro Adoption

```text
apps/
  web/
  mini-program/          # new taro app entry

packages/
  auth/
  core/
  i18n/
  request/
  tokens/
  ui/
  pages-web/
  pages-mobile/          # transitional, to be removed or reshaped
  pages-shared/          # optional: shared page hooks/view-models
  mini-runtime/          # optional: taro-specific adapters
```

### Notes
- `apps/mini-program` 是应用，不是共享包；它负责 Taro 页面注册、分包、宿主配置与最终构建输出。
- 若继续保留 `packages/pages-mobile`，其职责必须收缩为“共享逻辑”，不再承载 React Native 专属页面入口。
- 共享包中应优先保留：类型、schema、view-model、请求模型、状态模型、权限模型；避免把小程序专属页面文件直接塞进共享层。

---

## Taro-specific Constraints to Respect

### 1. Page routing model
- 小程序页面路径必须显式注册
- 页面文件路径与路由目录强相关
- 不能复用 React Router 作为页面导航主机制

### 2. Navigation model
- 使用 `Taro.navigateTo` / `redirectTo` / `switchTab` / `reLaunch`
- 页面栈存在上限，需要控制跳转方式

### 3. Storage model
- 不再使用 AsyncStorage / Expo SecureStore 作为主方案
- 改为基于 Taro / 小程序存储 API 的适配器
- 敏感信息如何存储要单独设计并验证小程序限制

### 4. Build and package-size model
- 微信小程序存在主包 / 分包 / 总体积约束
- 页面层设计必须考虑分包拆分，而不是把所有页面直接堆入单包

### 5. Lifecycle model
- 页面生命周期与 Web / React Native 不同
- 页面初始化、恢复、跳转返回的处理方式需要单独适配

---

## Concrete Next Tasks

### Immediate next tasks
1. 处理 `packages/mobile-core` 的残留目录，并与 Taro 迁移一起决定是否彻底删除。
2. 创建 `apps/mini-program` 的 Taro 骨架，不再继续扩 Expo 页面层。
3. 盘点 `apps/mobile` 中可复用到 Taro 的逻辑与必须重写的页面壳。
4. 决定 `packages/pages-mobile` 的最终命运：删除 or 改名为共享逻辑包。
5. 清理仓库现有 `check:naming` / 安装产物问题，再做 build/typecheck 最终收口。

### Deferred but explicit
- 是否保留 `apps/mobile` 作为过渡演示应用：**可暂时保留，但不再作为主路线继续投入**。
- 是否将 `pages-mobile` 直接重命名：**建议等 Taro 骨架跑通后再执行，避免中途命名抖动影响判断**。

---

## Success Criteria

### Verification Commands
```bash
pnpm build
pnpm typecheck
pnpm dev
pnpm --filter mini-program dev
```

### Final Checklist
- [x] 所有核心包已统一到 `@nebula/*`
- [x] 代码中无 `@platform/*` 引用
- [ ] 遗留目录已彻底删除（非移动端遗留目录已清理，`packages/mobile-core` 待移动端阶段处理）
- [x] `apps/web` 不再保留重复 pages/api
- [x] `apps/web` 只消费共享包
- [ ] `apps/mini-program` 已创建并可启动
- [ ] Taro 适配层（storage/navigation/request）已定义
- [ ] 微信小程序基础页面可运行
- [ ] `packages/pages-mobile` 已退役或转型
- [ ] `pnpm build` 通过（当前被仓库既有 `check:naming` / 安装问题阻塞）
- [ ] `pnpm typecheck` 通过（当前被仓库既有 `check:naming` / 安装问题阻塞）
