# Nebula Portal 架构重构计划

## TL;DR

> **Quick Summary**: 从联邦模式改为直接引用模式，统一包名为 @nebula/*，删除联邦配置和 demo-business，合并 theme 到 tokens、合并 mobile-core 到 core，新建 pages-web 和 pages-mobile 页面层，迁移 Shell 所有资产到共享包，Shell 变成消费者。
>
> **Deliverables**:
> - 统一包名：全部改为 @nebula/*（tokens, core, ui-web, pages-web, pages-mobile, auth, request, i18n）
> - 删除包：theme, mobile-core（功能合并），demo-business, business-starter（联邦相关）
> - 新建包：tokens（扩展），pages-web（19 个页面），pages-mobile（minimal）
> - 迁移 Shell 资产：modules（6 个组件）→ ui-web/core/tokens，pages（19 个页面）→ pages-web
> - Shell 变成消费者：仅作为应用入口，引用共享包
>
> **Estimated Effort**: Large（涉及 40+ 文件迁移、30+ import 更新、多个包合并）
> **Parallel Execution**: YES - 多包可并行改造，但分阶段执行避免循环依赖
> **Critical Path**: Phase 0 → Phase 1 → Phase 3 → Phase 4 → Phase 5 → Phase 6

---

## Context

### Original Request
用户希望从联邦模式改为直接引用模式，调整包名结构，支持 Web 和 React Native 共享逻辑，在组件库之上建立页面层。主要改造的是使用方式，具体的页面内容和逻辑没什么变化，包名需要调整为 @nebula/*。

### Interview Summary

**关键讨论**:

1. **包名统一**: 全部改为 @nebula/*（tokens, core, ui-web, pages-web, pages-mobile, auth, request, i18n）
2. **联邦处理**: 完全移除 vite-plugin-federation、embedded/federation 双模式
3. **页面层**: 新建 @nebula/pages-web（全部中台管理页面）和 @nebula/pages-mobile（minimal setup）
4. **RN UI**: 使用社区组件，不新建 ui-mobile
5. **核心合并**: mobile-core 合并到 core，依赖注入支持 localStorage 和 AsyncStorage
6. **tokens vs theme**: 删除 theme 包，tokens 包扩展功能（内置明亮/暗黑主题 + 切换实现），core 提供主题切换接口，业务项目可自定义主题
7. **Shell 资产迁移**: 全部迁移，Shell 变成消费者（modules → ui-web/core/tokens，pages → pages-web）
8. **测试**: 先迁移后补充，手动验证

**研究发现**:

1. **包名现状**: @nebula/* (auth, request, theme, i18n) 和 @platform/* (ui, core, mobile-core) 混合
2. **无循环依赖**: core 和 mobile-core 相互不依赖，合并安全
3. **Shell 私有组件**: 6 个 modules 组件（OrganizationTree, NotificationPanel, AuthGuard 等）需迁移
4. **Shell 页面**: 19 个页面需迁移到 pages-web
5. **依赖注入模式**: mobile-core 已使用 KeyValueStorageDriver 接口，可直接合并到 core
6. **联邦已有 embedded**: embedded 模式可直接过渡到直接引用

### Metis Review

**识别的风险**（已处理）:

1. **循环依赖风险**: 已验证 core 和 mobile-core 无相互依赖 ✅
2. **Shell 页面依赖私有组件**: 已确认全部迁移到共享包 ✅
3. **初始化时机**: tokens 的 ThemeStore 和 CSS 变量注入需要关注（已在验收标准中）
4. **平台抽象机制**: core 使用依赖注入 StorageAdapter，不在 core 内直接导入 localStorage/AsyncStorage ✅

---

## Work Objectives

### Core Objective
将 Nebula Portal 从联邦架构改为直接引用架构，统一包名，支持 Web + RN 共享逻辑，建立完整的页面层，Shell 变成纯消费者应用。

### Concrete Deliverables

**包结构调整**:
- 重命名：@platform/ui → @nebula/ui-web, @platform/core → @nebula/core, @platform/i18n → @nebula/i18n
- 合并：theme → tokens（功能合并），mobile-core → core（依赖注入）
- 新建：@nebula/tokens（扩展），@nebula/pages-web（19 页面），@nebula/pages-mobile（minimal）
- 删除：theme, mobile-core, demo-business, business-starter

**Shell 资产迁移**:
- modules/organization/organization-tree.tsx → ui-web/OrganizationTree
- modules/notify/notification-panel.tsx → ui-web/NotificationPanel
- modules/auth/auth-guard.tsx → core/AuthGuard
- modules/i18n/shell-i18n-provider.tsx → core/I18nProvider
- modules/frontend/frontend-store.ts → core/FrontendStore
- modules/runtime/resource-store.ts → core/ResourceStore
- modules/theme/theme-store.ts → tokens/ThemeStore
- pages/* → pages-web/*（19 个页面）

**联邦移除**:
- 删除 vite-plugin-federation 依赖
- 删除 shell/vite.config.ts 中的 federation 配置
- 删除 demo-business app
- 删除 templates/business-starter
- 删除 VITE_MODULE_MODE 环境变量

### Definition of Done
- [ ] 所有包重命名为 @nebula/*，import 路径更新
- [ ] theme 和 mobile-core 包删除，功能合并到 tokens 和 core
- [ ] demo-business 和 business-starter 删除
- [ ] pages-web 包新建，包含 19 个页面
- [ ] pages-mobile 包新建，minimal setup
- [ ] Shell 变成消费者，所有资产迁移到共享包
- [ ] Web 应用（Shell）正常启动，页面功能正常
- [ ] RN 应用（mobile）正常启动，StorageAdapter 注入正常
- [ ] pnpm build 成功，typecheck 成功

### Must Have
- 包名统一为 @nebula/*
- Shell 所有资产迁移到共享包
- Web 和 RN 应用正常运行
- 构建和类型检查通过

### Must NOT Have (Guardrails)
- **不添加新功能**：迁移期间不"顺便优化组件"或"重构页面逻辑"
- **不添加测试**：先迁移后补充，迁移阶段只更新路径
- **不扩展 tokens 范围**：tokens 只包含 CSS 变量 + Zustand store + Ant Design config，不添加额外功能
- **不新建 RN UI 包**：使用社区组件
- **不保留联邦配置**：完全删除，不留可选模式

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO（当前无测试框架）
- **Automated tests**: None（先迁移后补充）
- **Framework**: None
- **Agent-Executed QA**: ALWAYS（每个任务都有手动验证步骤）

### QA Policy
每个任务 MUST 包含手动验证步骤（烟雾测试清单）。

- **Web**: 启动 Shell 应用，检查页面渲染、主题切换、API 调用
- **RN**: 启动 mobile 应用，检查 StorageAdapter 注入、Auth 流程

---

## Execution Strategy

### Parallel Execution Waves

> 依赖顺序分阶段执行，避免循环依赖。每阶段完成后验证。

```
Phase 0 (Pre-flight - 依赖检查):
├── Task 1: 依赖图审计，检查循环依赖 [quick]

Phase 1 (包重命名 - 无依赖冲突):
├── Task 2: 更新 tsconfig.base.json 路径别名 [quick]
├── Task 3: 重命名 @platform/ui → @nebula/ui-web [quick]
├── Task 4: 重命名 @platform/core → @nebula/core [quick]
├── Task 5: 重命名 @platform/i18n → @nebula/i18n [quick]
└── Task 6: 更新所有 import 路径 @platform/* → @nebula/* [quick]

Phase 2 (联邦删除 - 无依赖):
├── Task 7: 删除 vite-plugin-federation 依赖 [quick]
├── Task 8: 删除 shell/vite.config.ts federation 配置 [quick]
├── Task 9: 删除 demo-business app [quick]
├── Task 10: 删除 templates/business-starter [quick]
└── Task 11: 清理环境变量 VITE_MODULE_MODE [quick]

Phase 3 (包删除 + 功能合并):
├── Task 12: 合并 theme → tokens（ThemeStore, tokens 逻辑）[unspecified-high]
├── Task 13: 删除 packages/theme [quick]
├── Task 14: 合并 mobile-core → core（StorageAdapter, 依赖注入）[unspecified-high]
├── Task 15: 删除 packages/mobile-core [quick]
└── Task 16: 更新 core 导出和依赖注入接口 [quick]

Phase 4 (新建包):
├── Task 17: 创建 @nebula/tokens 包结构（扩展）[quick]
├── Task 18: 创建 @nebula/pages-web 包结构 [quick]
├── Task 19: 创建 @nebula/pages-mobile 包结构（minimal）[quick]
└── Task 20: 配置 pnpm-workspace 和 tsconfig.base.json [quick]

Phase 5 (Shell 资产迁移 - 最大工作量):
├── Task 21: 迁移 OrganizationTree → ui-web [unspecified-high]
├── Task 22: 迁移 NotificationPanel → ui-web [unspecified-high]
├── Task 23: 迁移 AuthGuard → core [quick]
├── Task 24: 迁移 I18nProvider → core [quick]
├── Task 25: 迁移 NotifyStore → core [quick]
├── Task 26: 迁移 FrontendStore → core [quick]
├── Task 27: 迁移 ResourceStore → core [quick]
├── Task 28: 迁移 ThemeStore → tokens [quick]
├── Task 29: 迁移 Shell pages → pages-web（operations/advanced/notifications）[unspecified-high]
├── Task 30: 迁移 Shell 其他页面 → pages-web（dashboard/unavailable/iframe/401/404）[quick]
├── Task 31: 迁移 login-page → pages-web [quick]
└── Task 32: 更新 Shell 引用路径 [quick]

Phase 6 (Smoke Testing - 最终验证):
├── Task 33: Web Smoke Test - Shell 启动 + 页面渲染 [unspecified-high]
├── Task 34: RN Smoke Test - Mobile 启动 + StorageAdapter [unspecified-high]
├── Task 35: Build Verification - pnpm build 成功 [quick]
└── Task 36: TypeCheck Verification - pnpm typecheck 成功 [quick]

Critical Path: Phase 0 → Phase 1 → Phase 3 → Phase 4 → Phase 5 → Phase 6
Parallel Speedup: ~50% faster than fully sequential
Max Concurrent: 5 (Phase 1, Phase 2)
```

### Dependency Matrix

- **Phase 0**: - Phase 1-6
- **Phase 1**: Phase 0 - Phase 3-5（重命名后才能合并）
- **Phase 2**: - Phase 6（联邦删除不影响其他）
- **Phase 3**: Phase 1 - Phase 4-5（合并后才能新建）
- **Phase 4**: Phase 3 - Phase 5（新包后才能迁移）
- **Phase 5**: Phase 1, Phase 3, Phase 4 - Phase 6
- **Phase 6**: Phase 5 - (最终验证)

---

## TODOs

> Implementation + Verification = ONE Task.
> 每个任务包含：推荐 Agent Profile、QA Scenarios（手动验证）。

- [x] 1. 依赖图审计，检查循环依赖

  **What to do**:
  - 分析 packages/* 的依赖关系
  - 验证 core 和 mobile-core 无相互依赖
  - 验证 tokens 合入 theme 无循环依赖
  - 检查 Shell pages 对 modules 的依赖

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单纯的依赖分析，无需复杂逻辑
  - **Skills**: []
    - 无需特定技能

  **Parallelization**:
  - **Can Run In Parallel**: NO（Phase 0 必须先完成）
  - **Parallel Group**: Phase 0
  - **Blocks**: Phase 1-6
  - **Blocked By**: None

  **References**:
  - `packages/core/package.json` - core 的依赖
  - `packages/mobile-core/package.json` - mobile-core 的依赖
  - `packages/theme/package.json` - theme 的依赖

  **QA Scenarios**:
  ```
  Scenario: 无循环依赖
    Tool: Bash (grep)
    Steps:
      1. grep "@platform/mobile-core" packages/core/src/*.ts
      2. grep "@platform/core" packages/mobile-core/src/*.ts
    Expected Result: 两个 grep 都返回空（无循环依赖）
    Evidence: .sisyphus/evidence/task-01-no-cycle.txt

  Scenario: Shell pages 依赖私有组件
    Tool: Bash (grep)
    Steps:
      1. grep "@/modules" apps/shell/src/pages/**/*.tsx
    Expected Result: 找到 6 个文件（user, param, announcement, permission, config, org）
    Evidence: .sisyphus/evidence/task-01-modules-deps.txt
  ```

  **Commit**: YES
  - Message: `chore: audit dependency graph before refactor`
  - Files: None（仅验证）

---

- [x] 2. 更新 tsconfig.base.json 路径别名

  **What to do**:
  - 将 @platform/* 别名改为 @nebula/*
  - 保留 @nebula/* 别名（auth, request 已有）
  - 更新为：@nebula/ui-web, @nebula/core, @nebula/i18n, @nebula/tokens, @nebula/pages-web, @nebula/pages-mobile

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 配置文件修改
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 3-6 同属 Phase 1）
  - **Parallel Group**: Phase 1
  - **Blocks**: Phase 3-5（路径别名后才能合并迁移）
  - **Blocked By**: Task 1

  **References**:
  - `tsconfig.base.json` - 当前路径别名配置

  **QA Scenarios**:
  ```
  Scenario: 路径别名正确
    Tool: Bash (cat)
    Steps:
      1. cat tsconfig.base.json | grep "@nebula/ui-web"
      2. cat tsconfig.base.json | grep "@nebula/core"
    Expected Result: 找到对应的路径映射
    Evidence: .sisyphus/evidence/task-02-tsconfig.txt
  ```

  **Commit**: YES
  - Message: `chore(config): update tsconfig path aliases to @nebula/*`
  - Files: `tsconfig.base.json`

---

- [x] 3. 重命名 @platform/ui → @nebula/ui-web

  **What to do**:
  - 修改 packages/ui/package.json name 为 @nebula/ui-web
  - 不修改目录名（保持 packages/ui）
  - 更新内部 import（如果有 @platform/*）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 包名修改
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 2,4,5,6 同属 Phase 1）
  - **Parallel Group**: Phase 1
  - **Blocks**: Phase 5（ui-web 后才能迁移 OrganizationTree）
  - **Blocked By**: Task 1

  **References**:
  - `packages/ui/package.json` - 当前包名 @platform/ui

  **QA Scenarios**:
  ```
  Scenario: 包名正确
    Tool: Bash (cat)
    Steps:
      1. cat packages/ui/package.json | grep '"name"'
    Expected Result: 显示 "@nebula/ui-web"
    Evidence: .sisyphus/evidence/task-03-ui-web-name.txt
  ```

  **Commit**: YES（与 Task 4,5 组合）
  - Message: `refactor(ui): rename @platform/ui to @nebula/ui-web`
  - Files: `packages/ui/package.json`

---

- [x] 4. 重命名 @platform/core → @nebula/core

  **What to do**:
  - 修改 packages/core/package.json name 为 @nebula/core
  - 不修改目录名（保持 packages/core）
  - 更新内部 import

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 1）
  - **Parallel Group**: Phase 1
  - **Blocks**: Phase 3-5
  - **Blocked By**: Task 1

  **References**:
  - `packages/core/package.json`

  **QA Scenarios**:
  ```
  Scenario: 包名正确
    Tool: Bash (cat)
    Steps:
      1. cat packages/core/package.json | grep '"name"'
    Expected Result: 显示 "@nebula/core"
    Evidence: .sisyphus/evidence/task-04-core-name.txt
  ```

  **Commit**: YES（与 Task 3,5 组合）

---

- [x] 5. 校验并更新 i18n 对 core 的依赖

  **What to do**:
  - 校验 `packages/i18n/package.json` 包名（已经是 @nebula/i18n，无需重命名）
  - 更新 `packages/i18n/package.json` 的依赖：`@platform/core` → `@nebula/core`
  - 更新 packages/i18n/src 内部的 import 路径

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 1）
  - **Parallel Group**: Phase 1
  - **Blocks**: Phase 5
  - **Blocked By**: Task 1

  **References**:
  - `packages/i18n/package.json` - 当前已是 @nebula/i18n，需更新依赖

  **QA Scenarios**:
  ```
  Scenario: i18n 依赖正确
    Tool: Bash (grep)
    Steps:
      1. grep "@platform/core" packages/i18n/package.json
      2. grep "@nebula/core" packages/i18n/package.json
    Expected Result: 第一个 grep 返回空，第二个 grep 返回匹配
    Evidence: .sisyphus/evidence/task-05-i18n-deps.txt
  ```

  **Commit**: YES（与 Task 3,4 组合）

---

- [x] 6. 更新所有 import 路径 @platform/* → @nebula/*

  **What to do**:
  - 全项目搜索 @platform/ui, @platform/core, @platform/i18n, @platform/mobile-core
  - 替换为 @nebula/ui-web, @nebula/core, @nebula/i18n
  - 检查 apps/shell, apps/mobile, packages/* 的所有 import

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 批量文本替换
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 1，与 Task 2-5 同时）
  - **Parallel Group**: Phase 1
  - **Blocks**: Phase 3-5
  - **Blocked By**: Task 1, Task 2

  **References**:
  - `packages/ui/src/**/*.ts` - ui 的 import
  - `packages/core/src/**/*.ts` - core 的 import
  - `apps/shell/src/**/*.tsx` - Shell 的 import
  - `apps/mobile/**/*.ts` - Mobile 的 import

  **QA Scenarios**:
  ```
  Scenario: 无旧包名引用
    Tool: Bash (grep)
    Steps:
      1. grep "@platform/ui" packages/ apps/ --include="*.ts" --include="*.tsx"
      2. grep "@platform/core" packages/ apps/ --include="*.ts" --include="*.tsx"
    Expected Result: grep 返回空（无旧引用）
    Evidence: .sisyphus/evidence/task-06-no-old-imports.txt

  Scenario: 新包名引用正确
    Tool: Bash (grep)
    Steps:
      1. grep "@nebula/ui-web" packages/ apps/ --include="*.ts" --include="*.tsx" -c
    Expected Result: grep 返回匹配计数 > 0
    Evidence: .sisyphus/evidence/task-06-new-imports.txt
  ```

  **Commit**: YES
  - Message: `refactor: update all imports to @nebula/* package names`
  - Files: 多个文件（批量修改）

---

- [x] 7. 删除 vite-plugin-federation 依赖

  **What to do**:
  - 从 root package.json 删除 @originjs/vite-plugin-federation
  - 从 apps/shell/package.json 删除
  - 从 apps/demo-business/package.json 删除（如果存在）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 2）
  - **Parallel Group**: Phase 2
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `package.json` - root devDependencies
  - `apps/shell/package.json`

  **QA Scenarios**:
  ```
  Scenario: 无 federation 依赖
    Tool: Bash (grep)
    Steps:
      1. grep "vite-plugin-federation" package.json apps/*/package.json packages/*/package.json
    Expected Result: grep 返回空
    Evidence: .sisyphus/evidence/task-07-no-federation-dep.txt
  ```

  **Commit**: YES（与 Task 8-11 组合）
  - Message: `refactor: remove vite-plugin-federation dependency`
  - Files: `package.json`, `apps/shell/package.json`

---

- [x] 8. 删除 shell/vite.config.ts federation 配置

  **What to do**:
  - 删除 federation plugin import
  - 删除 federation({...}) 配置
  - 保留其他 vite 配置

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 2）
  - **Parallel Group**: Phase 2
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `apps/shell/vite.config.ts`

  **QA Scenarios**:
  ```
  Scenario: 无 federation 配置
    Tool: Bash (grep)
    Steps:
      1. grep "federation" apps/shell/vite.config.ts
    Expected Result: grep 返回空
    Evidence: .sisyphus/evidence/task-08-no-federation-config.txt
  ```

  **Commit**: YES（与 Task 7 组合）

---

- [x] 9. 删除 apps/demo-business

  **What to do**:
  - 删除整个 apps/demo-business 目录
  - 更新 pnpm-workspace.yaml（移除 demo-business）
  - 更根 package.json scripts（移除 dev:demo）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 2）
  - **Parallel Group**: Phase 2
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `apps/demo-business/` - 整个目录
  - `pnpm-workspace.yaml`
  - `package.json`

  **QA Scenarios**:
  ```
  Scenario: demo-business 已删除
    Tool: Bash (ls)
    Steps:
      1. ls apps/demo-business
    Expected Result: ls 返回错误（目录不存在）
    Evidence: .sisyphus/evidence/task-09-demo-deleted.txt
  ```

  **Commit**: YES（与 Task 7,8,10,11 组合）
  - Message: `refactor: remove demo-business app and federation template`
  - Files: `apps/demo-business/`, `pnpm-workspace.yaml`, `package.json`

---

- [x] 10. 删除 templates/business-starter

  **What to do**:
  - 删除整个 templates/business-starter 目录
  - 更新 pnpm-workspace.yaml（移除 templates/* 或保留但删除 business-starter）
  - 删除 scripts/create-app.mjs（联邦脚手架脚本）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 2）
  - **Parallel Group**: Phase 2
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `templates/business-starter/`
  - `scripts/create-app.mjs`

  **QA Scenarios**:
  ```
  Scenario: business-starter 已删除
    Tool: Bash (ls)
    Steps:
      1. ls templates/business-starter
    Expected Result: ls 返回错误
    Evidence: .sisyphus/evidence/task-10-starter-deleted.txt
  ```

  **Commit**: YES（与 Task 9 组合）

---

- [x] 11. 清理环境变量 VITE_MODULE_MODE

  **What to do**:
  - 删除 README.md 中的 VITE_MODULE_MODE 说明
  - 删除 apps/shell/src 中对 VITE_MODULE_MODE 的引用（如果有）
  - 删除 embedded/federation 双模式相关代码

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 2）
  - **Parallel Group**: Phase 2
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `README.md`
  - `apps/shell/src/modules/runtime/remote-modules.ts`

  **QA Scenarios**:
  ```
  Scenario: 无 VITE_MODULE_MODE 引用
    Tool: Bash (grep)
    Steps:
      1. grep "VITE_MODULE_MODE" apps/shell README.md
    Expected Result: grep 返回空
    Evidence: .sisyphus/evidence/task-11-no-module-mode.txt
  ```

  **Commit**: YES（与 Task 7-10 组合）

---

- [x] 12. 合并 theme → tokens（ThemeStore, tokens 逻辑）

  **What to do**:
  - 创建 packages/tokens 目录和基础结构
  - 从 packages/theme 迁移 theme-tokens.ts（字段定义）
  - 从 packages/theme 迁移 theme-store.ts（Zustand store）
    - **重要修改**：将 localStorage 调用改为通过 StorageAdapter 注入
    - 添加 configureThemeStorage(adapter: StorageAdapter) 初始化函数
  - 从 packages/theme 迁移 theme-runtime.ts（CSS 变量注入）
  - 从 packages/theme 迁移 theme-config.ts（Ant Design Config）
  - 添加 nebula 前缀到所有 CSS 变量（--shell-primary → --nebula-primary）
  - 添加内置主题：nebula-light, nebula-dark（暗黑模式）
  - 设计 tokens：颜色、间距、圆角、字体、阴影、组件 tokens

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 包合并 + 功能扩展，需要仔细处理依赖和命名
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（Phase 3，依赖 Phase 1 完成）
  - **Parallel Group**: Phase 3
  - **Blocks**: Task 13, Phase 4-5
  - **Blocked By**: Task 1-6（Phase 1）

  **References**（现有仓库可参考文件）:
  - `packages/theme/src/theme-tokens.ts` - 字段定义（迁移源）
  - `packages/theme/src/theme-store.ts` - Zustand store（迁移源）
  - `packages/theme/src/theme-runtime.ts` - CSS 变量（迁移源）
  - `packages/theme/src/theme-config.ts` - Ant Design Config（迁移源）
  - `packages/ui/src/nebula.css` - 现有 CSS 变量模式参考

  **QA Scenarios**:
  ```
  Scenario: tokens 包结构正确
    Tool: Bash (ls)
    Steps:
      1. ls packages/tokens/src
    Expected Result: 显示 index.ts, tokens.ts, theme-store.ts, theme-runtime.ts, theme-config.ts
    Evidence: .sisyphus/evidence/task-12-tokens-structure.txt

  Scenario: CSS 变量前缀正确
    Tool: Bash (grep)
    Steps:
      1. grep "--shell-" packages/tokens/src/*.ts
      2. grep "--nebula-" packages/tokens/src/*.ts
    Expected Result: 第一个 grep 返回空（无旧前缀），第二个 grep 返回匹配
    Evidence: .sisyphus/evidence/task-12-css-prefix.txt
  ```

  **Commit**: YES（与 Task 13 组合）
  - Message: `refactor(tokens): merge theme package into tokens with nebula prefix`
  - Files: `packages/tokens/`（新建）

---

- [x] 13. 删除 packages/theme

  **What to do**:
  - 删除整个 packages/theme 目录
  - 确认所有功能已合并到 tokens

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖 Task 12）
  - **Parallel Group**: Phase 3
  - **Blocks**: Phase 4-5
  - **Blocked By**: Task 12

  **References**:
  - `packages/theme/`

  **QA Scenarios**:
  ```
  Scenario: theme 包已删除
    Tool: Bash (ls)
    Steps:
      1. ls packages/theme
    Expected Result: ls 返回错误
    Evidence: .sisyphus/evidence/task-13-theme-deleted.txt
  ```

  **Commit**: YES（与 Task 12 组合）

---

- [x] 14. 合并 mobile-core → core（StorageAdapter, 依赖注入）

  **What to do**:
  - 从 mobile-core 迁移 types.ts（KeyValueStorageDriver, MobileRequestClient 等）
  - 从 mobile-core 迁移 mobile-auth-storage.ts → core/auth-storage.ts（使用 StorageAdapter）
  - 从 mobile-core 迁移 mobile-request-client.ts → core/request-client.ts
  - 从 mobile-core 迁移 mobile-storage-service.ts → core/storage-service.ts
  - 从 mobile-core 迁移 mobile-app-context.ts → core/mobile-app-context.ts（合并到 AppContext）
  - 定义 StorageAdapter 接口（抽象 localStorage 和 AsyncStorage）
  - core 不直接导入 localStorage 或 AsyncStorage，通过依赖注入

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 包合并 + 依赖注入设计，需要抽象存储层
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 12-13 同属 Phase 3）
  - **Parallel Group**: Phase 3
  - **Blocks**: Task 15, Phase 4-5
  - **Blocked By**: Task 1-6（Phase 1）

  **References**:
  - `packages/mobile-core/src/index.ts` - 入口文件，查看导出
  - `packages/mobile-core/src/mobile-auth-storage.ts` - 存储实现
  - `packages/mobile-core/src/mobile-request-client.ts` - 请求客户端
  - 用户示例：core 通过 StorageAdapter 接口，Web/RN 注入实现

  **QA Scenarios**:
  ```
  Scenario: 无平台特定导入
    Tool: Bash (grep)
    Steps:
      1. grep "localStorage" packages/core/src/*.ts
      2. grep "AsyncStorage" packages/core/src/*.ts
    Expected Result: 两个 grep 都返回空（无直接导入）
    Evidence: .sisyphus/evidence/task-14-no-platform-import.txt

  Scenario: StorageAdapter 接口定义
    Tool: Bash (grep)
    Steps:
      1. grep "interface StorageAdapter" packages/core/src/*.ts
    Expected Result: 找到接口定义
    Evidence: .sisyphus/evidence/task-14-storage-interface.txt
  ```

  **Commit**: YES（与 Task 15 组合）
  - Message: `refactor(core): merge mobile-core with dependency injection`
  - Files: `packages/core/src/`（扩展）

---

- [x] 15. 删除 packages/mobile-core

  **What to do**:
  - 删除整个 packages/mobile-core 目录
  - 确认所有功能已合并到 core
  - 更新 apps/mobile 的依赖（@platform/mobile-core → @nebula/core）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖 Task 14）
  - **Parallel Group**: Phase 3
  - **Blocks**: Phase 4-5
  - **Blocked By**: Task 14

  **References**:
  - `packages/mobile-core/`
  - `apps/mobile/package.json`

  **QA Scenarios**:
  ```
  Scenario: mobile-core 包已删除
    Tool: Bash (ls)
    Steps:
      1. ls packages/mobile-core
    Expected Result: ls 返回错误
    Evidence: .sisyphus/evidence/task-15-mobile-core-deleted.txt
  ```

  **Commit**: YES（与 Task 14 组合）

---

- [x] 16. 更新 core 导出和依赖注入接口

  **What to do**:
  - 更新 packages/core/src/index.ts 导出新合并的模块
  - 添加 configureStorage 函数（注入 StorageAdapter）
  - 添加 configureRequest 函数（注入请求配置）
  - 确保 core 对外提供初始化接口

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - Reason: 导出和接口更新
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 14-15 同属 Phase 3）
  - **Parallel Group**: Phase 3
  - **Blocks**: Phase 4-5
  - **Blocked By**: Task 14

  **References**:
  - `packages/core/src/index.ts`

  **QA Scenarios**:
  ```
  Scenario: configureStorage 导出
    Tool: Bash (grep)
    Steps:
      1. grep "export.*configureStorage" packages/core/src/index.ts
    Expected Result: 找到导出
    Evidence: .sisyphus/evidence/task-16-configure-storage.txt
  ```

  **Commit**: YES（与 Task 14-15 组合）

---

- [x] 17. 创建 @nebula/tokens 包结构（扩展）

  **What to do**:
  - 如果 Task 12 已完成，此任务仅验证包结构
  - 添加 package.json：name 为 @nebula/tokens
  - 确认导出：tokens, ThemeStore, useTheme, createTheme, buildAntdThemeConfig
  - 确认依赖：zustand, antd（peer）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 4）
  - **Parallel Group**: Phase 4
  - **Blocks**: Task 28, Phase 5
  - **Blocked By**: Task 12-13（Phase 3）

  **References**:
  - `packages/tokens/package.json`（如果已创建）

  **QA Scenarios**:
  ```
  Scenario: tokens 包名正确
    Tool: Bash (cat)
    Steps:
      1. cat packages/tokens/package.json | grep '"name"'
    Expected Result: 显示 "@nebula/tokens"
    Evidence: .sisyphus/evidence/task-17-tokens-package.txt
  ```

  **Commit**: YES（如果 Task 12 未创建包结构）
  - Message: `feat(tokens): create @nebula/tokens package structure`
  - Files: `packages/tokens/package.json`

---

- [x] 18. 创建 @nebula/pages-web 包结构

  **What to do**:
  - 创建 packages/pages-web 目录
  - 创建 package.json：name 为 @nebula/pages-web
  - 依赖：@nebula/core, @nebula/ui-web, @nebula/tokens, @nebula/i18n, @nebula/auth, @nebula/request
  - peerDependencies：react, react-dom, antd, react-router-dom
  - 创建 src/index.ts（导出所有页面）
  - 创建 src/routes.ts（createNebulaRoutes 函数）
  
  **createNebulaRoutes 接口约定**:
  ```typescript
  // 输入：可选的页面覆盖配置
  interface NebulaRoutesOptions {
    overrides?: Record<string, React.ComponentType>;
  }
  
  // 输出：React Router 路由配置数组
  // 替代当前 app.tsx 中的 routes 数组拼装逻辑
  function createNebulaRoutes(options?: NebulaRoutesOptions): RouteObject[];
  
  // 导出的静态路由（对应 pages-web 中的页面）:
  // - /login → LoginPage
  // - /users → UserListPage
  // - /roles → RoleListPage
  // - /permissions → PermissionListPage
  // - /organizations → OrgListPage
  // - /menus → MenuListPage
  // - /dict → DictListPage
  // - /params → ParamListPage
  // - /config → ConfigListPage
  // - /oauth2/clients → OAuth2ClientPage
  // - /oauth2/accounts → OAuth2AccountPage
  // - /notifications/records → NotificationRecordPage
  // - /notifications/templates → NotificationTemplatePage
  // - /notifications/announcements → AnnouncementPage
  // - /dashboard → DashboardPage
  
  // 使用示例（Shell app.tsx）:
  // const routes = createNebulaRoutes({
  //   overrides: { '/custom-path': CustomPage }
  // });
  // const router = createBrowserRouter(routes);
  ```
  
  **注意**：packages/pages-web/src/pages 是运行时代码目录，不是 AGENTS.md 规定的内容目录，因此不适用 "pages 目录下文件必须映射 URL" 的规则。此目录用于存放页面组件实现，命名遵循 kebab-case（如 login-page.tsx, user-list-page.tsx）。

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 4）
  - **Parallel Group**: Phase 4
  - **Blocks**: Task 29-31, Phase 5
  - **Blocked By**: Task 12-16（Phase 3）

  **References**（现有仓库可参考文件）:
  - `packages/ui/package.json` - 包结构参考
  - `packages/core/src/routes.tsx` - 现有路由工具参考（注意文件扩展名是 .tsx）
  - `apps/shell/src/app.tsx` - 当前路由拼装逻辑（将被替代）

  **QA Scenarios**:
  ```
  Scenario: pages-web 包结构正确
    Tool: Bash (ls)
    Steps:
      1. ls packages/pages-web/src
    Expected Result: 显示 index.ts, routes.ts
    Evidence: .sisyphus/evidence/task-18-pages-web-structure.txt
  ```

  **Commit**: YES
  - Message: `feat(pages): create @nebula/pages-web package structure`
  - Files: `packages/pages-web/`（新建）

---

- [x] 19. 创建 @nebula/pages-mobile 包结构（minimal）

  **What to do**:
  - 创建 packages/pages-mobile 目录
  - 创建 package.json：name 为 @nebula/pages-mobile
  - 依赖：@nebula/core, @nebula/tokens
  - peerDependencies：react, react-native, @react-navigation/native
  - 创建 src/index.ts（导出 LoginScreen 等 minimal 页面）
  - 创建 src/navigation.tsx（NebulaNavigator）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 4）
  - **Parallel Group**: Phase 4
  - **Blocks**: Phase 5（如需 RN 页面迁移）
  - **Blocked By**: Task 12-16（Phase 3）

  **References**:
  - 用户示例：pages-mobile minimal setup

  **QA Scenarios**:
  ```
  Scenario: pages-mobile 包结构正确
    Tool: Bash (ls)
    Steps:
      1. ls packages/pages-mobile/src
    Expected Result: 显示 index.ts, navigation.tsx
    Evidence: .sisyphus/evidence/task-19-pages-mobile-structure.txt
  ```

  **Commit**: YES
  - Message: `feat(pages): create @nebula/pages-mobile package structure (minimal)`
  - Files: `packages/pages-mobile/`（新建）

---

- [x] 20. 配置 pnpm-workspace 和 tsconfig.base.json

  **What to do**:
  - 更新 pnpm-workspace.yaml（确认 packages/* 包含所有包）
  - 更新 tsconfig.base.json paths：
    - "@nebula/tokens": ["packages/tokens/src/index.ts"]
    - "@nebula/pages-web": ["packages/pages-web/src/index.ts"]
    - "@nebula/pages-mobile": ["packages/pages-mobile/src/index.ts"]

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 4）
  - **Parallel Group**: Phase 4
  - **Blocks**: Phase 5
  - **Blocked By**: Task 17-19

  **References**:
  - `pnpm-workspace.yaml`
  - `tsconfig.base.json`

  **QA Scenarios**:
  ```
  Scenario: 新包路径别名正确
    Tool: Bash (grep)
    Steps:
      1. grep "@nebula/tokens" tsconfig.base.json
      2. grep "@nebula/pages-web" tsconfig.base.json
    Expected Result: 找到路径映射
    Evidence: .sisyphus/evidence/task-20-new-paths.txt
  ```

  **Commit**: YES
  - Message: `chore(config): add new packages to workspace and tsconfig`
  - Files: `pnpm-workspace.yaml`, `tsconfig.base.json`

---

- [x] 21. 迁移 OrganizationTree → ui

  **What to do**:
  - 将 `apps/shell/src/modules/organization/organization-tree.tsx` 迁移到 `packages/ui/src/organization-tree/`
  - 创建 `packages/ui/src/organization-tree/index.ts` 导出
  - 更新 import 路径（@platform/* → @nebula/*）
  - 更新 `packages/ui/src/index.ts` 导出 OrganizationTree

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 组件迁移 + 依赖路径更新
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 22-28 同属 Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: Task 29-31
  - **Blocked By**: Task 1-6, Task 18

  **References**:
  - `apps/shell/src/modules/organization/organization-tree.tsx`
  - `packages/ui/src/index.ts` - 当前导出

  **QA Scenarios**:
  ```
  Scenario: OrganizationTree 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/ui/src/organization-tree
    Expected Result: 显示 index.ts, organization-tree.tsx
    Evidence: .sisyphus/evidence/task-21-org-tree-migrated.txt
  ```

  **Commit**: YES（与 Task 22 组合）
  - Message: `refactor(ui): migrate OrganizationTree and NotificationPanel to ui`
  - Files: `packages/ui/src/organization-tree/`

---

- [x] 22. 迁移 NotificationPanel → ui

  **What to do**:
  - 将 `apps/shell/src/modules/notify/notification-panel.tsx` 迁移到 `packages/ui/src/notification-panel/`
  - 更新依赖路径（notify-store 将在 Task 25 迁移到 core，此处仅更新 import）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: Task 29-31
  - **Blocked By**: Task 1-6, Task 18

  **References**:
  - `apps/shell/src/modules/notify/notification-panel.tsx`
  - `packages/ui/src/index.ts`

  **QA Scenarios**:
  ```
  Scenario: NotificationPanel 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/ui/src/notification-panel
    Expected Result: 显示 index.ts, notification-panel.tsx
    Evidence: .sisyphus/evidence/task-22-notify-panel-migrated.txt
  ```

  **Commit**: YES（与 Task 21 组合）

---

- [x] 23. 迁移 AuthGuard + auth-store → core

  **What to do**:
  - 将 `apps/shell/src/modules/auth/auth-guard.tsx` 迁移到 `packages/core/src/auth/auth-guard.tsx`
  - 同时迁移 `apps/shell/src/modules/auth/auth-store.ts` 到 `packages/core/src/auth/auth-store.ts`（AuthGuard 依赖）
  - 迁移 `apps/shell/src/modules/auth/session-payload.ts` 和 `session-utils.ts` 到 `packages/core/src/auth/`
  - 更新依赖路径

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: Task 31
  - **Blocked By**: Task 1-6

  **References**:
  - `apps/shell/src/modules/auth/auth-guard.tsx`
  - `apps/shell/src/modules/auth/auth-store.ts`
  - `apps/shell/src/modules/auth/session-payload.ts`
  - `apps/shell/src/modules/auth/session-utils.ts`

  **QA Scenarios**:
  ```
  Scenario: AuthGuard 和 auth-store 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/core/src/auth/
    Expected Result: 显示 auth-guard.tsx, auth-store.ts, session-payload.ts, session-utils.ts
    Evidence: .sisyphus/evidence/task-23-auth-migrated.txt
  ```

  **Commit**: YES（与 Task 24-27 组合）
  - Message: `refactor(core): migrate Shell modules to core (AuthGuard, I18nProvider, Stores)`
  - Files: `packages/core/src/auth/`

---

- [x] 24. 迁移 I18nProvider → core

  **What to do**:
  - 将 `apps/shell/src/modules/i18n/shell-i18n-provider.tsx` 迁移到 `packages/core/src/i18n-provider.tsx`
  - 迁移 `apps/shell/src/modules/i18n/i18n-service.ts` 到 `packages/core/src/i18n-service.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: None
  - **Blocked By**: Task 1-6

  **References**:
  - `apps/shell/src/modules/i18n/`

  **QA Scenarios**:
  ```
  Scenario: I18nProvider 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/core/src/i18n-provider.tsx
    Expected Result: 文件存在
    Evidence: .sisyphus/evidence/task-24-i18n-provider-migrated.txt
  ```

  **Commit**: YES（与 Task 23 组合）

---

- [x] 25. 迁移 NotifyStore → core

  **What to do**:
  - 将 `apps/shell/src/modules/notify/notify-store.ts` 迁移到 `packages/core/src/notify-store.ts`
  - （NotificationPanel 已在 Task 22 迁移到 ui-web）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: None
  - **Blocked By**: Task 1-6

  **References**:
  - `apps/shell/src/modules/notify/notify-store.ts`

  **QA Scenarios**:
  ```
  Scenario: NotifyStore 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/core/src/notify-store.ts
    Expected Result: 文件存在
    Evidence: .sisyphus/evidence/task-25-notify-store-migrated.txt
  ```

  **Commit**: YES（与 Task 23 组合）

---

- [x] 26. 迁移 FrontendStore → core

  **What to do**:
  - 将 `apps/shell/src/modules/frontend/frontend-store.ts` 迁移到 `packages/core/src/frontend-store.ts`
  - 将 `apps/shell/src/modules/frontend/frontend-bootstrap.ts` 迁移到 `packages/core/src/frontend-bootstrap.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: None
  - **Blocked By**: Task 1-6

  **References**:
  - `apps/shell/src/modules/frontend/`

  **QA Scenarios**:
  ```
  Scenario: FrontendStore 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/core/src/frontend-store.ts
    Expected Result: 文件存在
    Evidence: .sisyphus/evidence/task-26-frontend-store-migrated.txt
  ```

  **Commit**: YES（与 Task 23 组合）

---

- [x] 27. 迁移 ResourceStore → core

  **What to do**:
  - 将 `apps/shell/src/modules/runtime/resource-store.ts` 迁移到 `packages/core/src/resource-store.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: None
  - **Blocked By**: Task 1-6

  **References**:
  - `apps/shell/src/modules/runtime/resource-store.ts`

  **QA Scenarios**:
  ```
  Scenario: ResourceStore 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/core/src/resource-store.ts
    Expected Result: 文件存在
    Evidence: .sisyphus/evidence/task-27-resource-store-migrated.txt
  ```

  **Commit**: YES（与 Task 23 组合）

---

- [x] 28. 迁移 ThemeStore → tokens

  **What to do**:
  - 确认 Task 12 已迁移 theme-store.ts 到 tokens
  - 更新 `packages/tokens/src/index.ts` 导出

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: None
  - **Blocked By**: Task 12

  **References**:
  - `packages/tokens/src/theme-store.ts`（Task 12 已迁移）

  **QA Scenarios**:
  ```
  Scenario: ThemeStore 在 tokens 中
    Tool: Bash (grep)
    Steps:
      1. grep "useThemeStore" packages/tokens/src/index.ts
    Expected Result: 找到导出
    Evidence: .sisyphus/evidence/task-28-theme-store-in-tokens.txt
  ```

  **Commit**: YES（如果需要更新）
  - Message: `refactor(tokens): export ThemeStore from tokens package`
  - Files: `packages/tokens/src/index.ts`

---

- [x] 29. 迁移 Shell pages + API → pages-web（operations/advanced/notifications）

  **What to do**:
  - 迁移 `apps/shell/src/pages/operations/*` 到 `packages/pages-web/src/pages/operations/`
    - user/index.tsx → UserListPage
    - role/index.tsx → RoleListPage
    - permission/index.tsx → PermissionListPage
    - org/index.tsx → OrgListPage
    - menu/index.tsx → MenuListPage
  - 迁移 `apps/shell/src/pages/advanced/*` 到 `packages/pages-web/src/pages/advanced/`
    - dict/index.tsx → DictListPage
    - param/index.tsx → ParamListPage
    - config/index.tsx → ConfigListPage
    - oauth2/client/index.tsx → OAuth2ClientPage
    - oauth2/account/index.tsx → OAuth2AccountPage
    - cache/index.tsx → CachePage
  - 迁移 `apps/shell/src/pages/notifications/*` 到 `packages/pages-web/src/pages/notifications/`
    - record/index.tsx → NotificationRecordPage
    - template/index.tsx → NotificationTemplatePage
    - announcement/index.tsx → AnnouncementPage
  - **同时迁移对应的 API 文件**：
    - `apps/shell/src/api/user-api.ts` → `packages/pages-web/src/api/user-api.ts`
    - `apps/shell/src/api/role-api.ts` → `packages/pages-web/src/api/role-api.ts`
    - `apps/shell/src/api/permission-api.ts` → `packages/pages-web/src/api/permission-api.ts`
    - `apps/shell/src/api/organization-api.ts` → `packages/pages-web/src/api/organization-api.ts`
    - `apps/shell/src/api/menu-api.ts`, `menu-admin-api.ts` → `packages/pages-web/src/api/`
    - `apps/shell/src/api/dict-api.ts`, `dict-admin-api.ts` → `packages/pages-web/src/api/`
    - `apps/shell/src/api/system-param-api.ts` → `packages/pages-web/src/api/`
    - `apps/shell/src/api/config-api.ts` → `packages/pages-web/src/api/`
    - `apps/shell/src/api/oauth2-client-api.ts`, `oauth2-account-api.ts` → `packages/pages-web/src/api/`
    - `apps/shell/src/api/notify-api.ts`, `notify-template-api.ts`, `notify-record-api.ts` → `packages/pages-web/src/api/`
    - `apps/shell/src/api/button-api.ts` → `packages/pages-web/src/api/`
    - `apps/shell/src/api/client.ts` → `packages/pages-web/src/api/client.ts`（API 客户端）
  - 更新所有 import 路径
  - 更新 OrganizationTree 的 import（从 @nebula/ui-web 导入）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 大量页面 + API 迁移 + 依赖路径更新
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 30-31 同属 Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: Task 32-33
  - **Blocked By**: Task 18, Task 21-22

  **References**:
  - `apps/shell/src/pages/operations/`
  - `apps/shell/src/pages/advanced/`
  - `apps/shell/src/pages/notifications/`
  - `apps/shell/src/api/`（21 个 API 文件）

  **QA Scenarios**:
  ```
  Scenario: 页面和 API 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/pages-web/src/pages/operations
      2. ls packages/pages-web/src/pages/advanced
      3. ls packages/pages-web/src/pages/notifications
      4. ls packages/pages-web/src/api
    Expected Result: 每个目录包含对应的页面文件和 API 文件
    Evidence: .sisyphus/evidence/task-29-pages-api-migrated.txt
  ```

  **Commit**: YES（与 Task 30-31 组合）
  - Message: `refactor(pages): migrate Shell pages and APIs to @nebula/pages-web`
  - Files: `packages/pages-web/src/pages/`, `packages/pages-web/src/api/`

---

- [x] 30. 迁移 Shell 其他页面 + 通用 API → pages-web

  **What to do**:
  - 迁移 `apps/shell/src/pages/dashboard/index.tsx` → DashboardPage
  - 迁移 `apps/shell/src/pages/unavailable/index.tsx` → UnavailablePage
  - 迁移 `apps/shell/src/pages/iframe/index.tsx` → IframePage
  - 迁移 `apps/shell/src/pages/401/index.tsx` → UnauthorizedPage
  - 迁移 `apps/shell/src/pages/404/index.tsx` → NotFoundPage
  - 迁移通用 API 文件到 pages-web：
    - `apps/shell/src/api/storage-api.ts` → `packages/pages-web/src/api/storage-api.ts`
    - `apps/shell/src/api/i18n-api.ts` → `packages/pages-web/src/api/i18n-api.ts`
    - `apps/shell/src/api/frontend-api.ts` → `packages/pages-web/src/api/frontend-api.ts`
    - `apps/shell/src/api/auth-api.ts` → `packages/pages-web/src/api/auth-api.ts`（登录相关）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: Task 33
  - **Blocked By**: Task 18

  **References**:
  - `apps/shell/src/pages/`
  - `apps/shell/src/api/storage-api.ts`
  - `apps/shell/src/api/i18n-api.ts`
  - `apps/shell/src/api/frontend-api.ts`
  - `apps/shell/src/api/auth-api.ts`

  **QA Scenarios**:
  ```
  Scenario: 其他页面已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/pages-web/src/pages/
    Expected Result: 显示 dashboard, unavailable, iframe, 401, 404 目录
    Evidence: .sisyphus/evidence/task-30-other-pages-migrated.txt
  ```

  **Commit**: YES（与 Task 29,31 组合）

---

- [x] 31. 迁移 login-page → pages-web

  **What to do**:
  - 将 `apps/shell/src/modules/auth/login-page.tsx` 迁移到 `packages/pages-web/src/pages/auth/login-page.tsx`
  - （auth-api.ts 已在 Task 30 迁移到 pages-web）
  - 更新依赖路径

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: Task 33
  - **Blocked By**: Task 18, Task 23, Task 30

  **References**:
  - `apps/shell/src/modules/auth/login-page.tsx`

  **QA Scenarios**:
  ```
  Scenario: login-page 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/pages-web/src/pages/auth/
    Expected Result: 显示 login-page.tsx
    Evidence: .sisyphus/evidence/task-31-login-page-migrated.txt
  ```

  **Commit**: YES（与 Task 29-30 组合）

---

- [x] 32. 迁移 Shell 剩余 modules（navigation/menu/dict/config/runtime/i18n-messages）

  **What to do**:
  - 迁移 `apps/shell/src/modules/navigation/` → `packages/core/src/navigation/`（route-meta.ts, navigation-store.ts）
  - 迁移 `apps/shell/src/modules/menu/` → `packages/core/src/menu/`（menu-store.ts, default-menus.ts）
  - 迁移 `apps/shell/src/modules/dict/dict-store.ts` → `packages/core/src/dict-store.ts`
  - 迁移 `apps/shell/src/modules/config/config-store.ts` → `packages/core/src/config-store.ts`
  - （auth-store.ts 已在 Task 23 迁移，无需重复）
  - 迁移 `apps/shell/src/modules/runtime/` → `packages/core/src/runtime/`
    - bootstrap.ts → `packages/core/src/runtime/bootstrap.ts`
    - shell-component-registry.ts → `packages/core/src/runtime/component-registry.ts`
    - platform-validator.ts → `packages/core/src/runtime/platform-validator.ts`
    - **remote-modules.ts 删除**（联邦已移除，直接引用模式不需要远程模块加载）
  - 迁移 `apps/shell/src/modules/i18n/messages/` → `packages/i18n/src/messages/`（国际化消息文件）
  - 更新 `packages/core/src/index.ts` 导出所有新增模块

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 大量模块迁移
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 21-31 同属 Phase 5）
  - **Parallel Group**: Phase 5
  - **Blocks**: Task 33
  - **Blocked By**: Task 1-6

  **References**:
  - `apps/shell/src/modules/navigation/`
  - `apps/shell/src/modules/menu/`
  - `apps/shell/src/modules/dict/`
  - `apps/shell/src/modules/config/`
  - `apps/shell/src/modules/auth/`
  - `apps/shell/src/modules/runtime/`
  - `apps/shell/src/modules/i18n/messages/`

  **QA Scenarios**:
  ```
  Scenario: 核心模块已迁移
    Tool: Bash (ls)
    Steps:
      1. ls packages/core/src/navigation/
      2. ls packages/core/src/menu/
      3. ls packages/core/src/dict-store.ts
    Expected Result: 文件和目录存在
    Evidence: .sisyphus/evidence/task-32-core-modules-migrated.txt
  ```

  **Commit**: YES
  - Message: `refactor(core): migrate Shell modules to core (navigation, menu, dict, config, auth, runtime)`
  - Files: `packages/core/src/`（扩展）

---

- [x] 33. 更新 Shell 引用路径

  **What to do**:
  - 更新 `apps/shell/src/main.tsx` 引用 pages-web
  - 更新 `apps/shell/src/app.tsx` 引用 core 的 I18nProvider, AuthGuard
  - 更新 Shell 的路由配置，使用 pages-web 的 createNebulaRoutes
  - 删除 Shell 的 modules 目录（已迁移到共享包）
  - 删除 Shell 的 pages 目录（已迁移到 pages-web）
  - 保留 Shell 入口文件：main.tsx, app.tsx, vite.config.ts
  - Shell 现在只作为应用入口，引用 @nebula/* 包

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖 Task 21-32 完成）
  - **Parallel Group**: Phase 5
  - **Blocks**: Phase 6
  - **Blocked By**: Task 21-32

  **References**:
  - `apps/shell/src/main.tsx`
  - `apps/shell/src/app.tsx`

  **QA Scenarios**:
  ```
  Scenario: Shell 入口文件存在
    Tool: Bash (ls)
    Steps:
      1. ls apps/shell/src/main.tsx
      2. ls apps/shell/src/app.tsx
    Expected Result: 两个文件都存在
    Evidence: .sisyphus/evidence/task-33-shell-entry.txt

  Scenario: Shell 可启动
    Tool: Bash (pnpm dev)
    Steps:
      1. pnpm dev &
      2. sleep 10
      3. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
    Expected Result: HTTP 状态码 200
    Evidence: .sisyphus/evidence/task-33-shell-startable.txt
  ```

  **Commit**: YES
  - Message: `refactor(shell): update Shell to use @nebula/* packages as consumer`
  - Files: `apps/shell/src/main.tsx`, `apps/shell/src/app.tsx`

---

- [ ] 34. Web Smoke Test - Shell 启动 + 页面渲染

  **What to do**:
  - 启动 Shell 应用：`pnpm dev`
  - 验证应用正常启动（端口 3000）
  - 验证登录页渲染
  - 验证主题切换（light ↔ dark）
  - 验证 3 个 operations 页面渲染（user, role, permission）
  - 验证 2 个 advanced 页面渲染（dict, param）
  - 验证 1 个 notifications 页面渲染（announcement）
  - 验证 API 调用正常

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 手动测试多个功能点
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 6）
  - **Parallel Group**: Phase 6
  - **Blocks**: None
  - **Blocked By**: Task 33

  **References**:
  - `apps/shell/`

  **QA Scenarios**:
  ```
  Scenario: Shell 正常启动
    Tool: Playwright (chrome-devtools_navigate_page)
    Steps:
      1. cd E:\nebula-portal && pnpm dev
      2. 等待服务启动（手动或脚本等待）
      3. chrome-devtools_navigate_page url="http://localhost:3000"
      4. chrome-devtools_take_snapshot
    Expected Result: 页面正常显示，snapshot 包含主要内容
    Evidence: .sisyphus/evidence/task-34-shell-start.txt

  Scenario: 登录页渲染
    Tool: Playwright (chrome-devtools_take_snapshot)
    Steps:
      1. chrome-devtools_navigate_page url="http://localhost:3000/login"
      2. chrome-devtools_take_snapshot
    Expected Result: snapshot 包含登录表单元素
    Evidence: .sisyphus/evidence/task-34-login-snapshot.txt
  ```

  **Commit**: NO（测试任务不提交代码）

---

- [ ] 35. RN Smoke Test - Mobile 启动 + StorageAdapter

  **What to do**:
  - 启动 Mobile 应用：`pnpm dev:mobile`
  - 验证应用正常启动
  - 验证 StorageAdapter 注入正常（Web localStorage 或 RN AsyncStorage）
  - 验证 Auth 流程正常

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 6）
  - **Parallel Group**: Phase 6
  - **Blocks**: None
  - **Blocked By**: Task 33

  **References**:
  - `apps/mobile/`

  **QA Scenarios**:
  ```
  Scenario: Mobile 正常启动
    Tool: Bash (PowerShell)
    Steps:
      1. cd E:\nebula-portal && pnpm dev:mobile
      2. 等待 Expo 启动
    Expected Result: Expo DevTools 正常显示，无错误
    Evidence: .sisyphus/evidence/task-35-mobile-start.txt

  Scenario: StorageAdapter 接口存在
    Tool: Bash (findstr - Windows)
    Steps:
      1. findstr /s "interface StorageAdapter" packages\core\src\*.ts
    Expected Result: 找到 StorageAdapter 接口定义
    Evidence: .sisyphus/evidence/task-35-storage-interface.txt
  ```

  **Commit**: NO（测试任务不提交代码）

---

- [ ] 36. Build Verification - pnpm build 成功

  **What to do**:
  - 运行 `pnpm build`
  - 验证所有包构建成功
  - 检查构建产物

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 6）
  - **Parallel Group**: Phase 6
  - **Blocks**: None
  - **Blocked By**: Task 33

  **References**:
  - `package.json`

  **QA Scenarios**:
  ```
  Scenario: 构建成功
    Tool: Bash (pnpm build)
    Steps:
      1. cd E:\nebula-portal && pnpm build
    Expected Result: 命令退出码 0，无错误
    Evidence: .sisyphus/evidence/task-36-build-success.txt
  ```

  **Commit**: NO（测试任务不提交代码）

---

- [ ] 37. TypeCheck Verification - pnpm typecheck 成功

  **What to do**:
  - 运行 `pnpm typecheck`
  - 验证所有包类型检查通过
  - 无 TypeScript 错误

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（Phase 6）
  - **Parallel Group**: Phase 6
  - **Blocks**: None
  - **Blocked By**: Task 33

  **References**:
  - `package.json`

  **QA Scenarios**:
  ```
  Scenario: 类型检查成功
    Tool: Bash (pnpm typecheck)
    Steps:
      1. cd E:\nebula-portal && pnpm typecheck
    Expected Result: 命令退出码 0，无类型错误
    Evidence: .sisyphus/evidence/task-37-typecheck-success.txt
  ```

  **Commit**: NO（测试任务不提交代码）

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check all pages migrated to pages-web. Check Shell is consumer (no private modules/pages).
  
  **QA Scenarios**:
  ```
  Scenario: 无旧包名引用
    Tool: Bash (grep)
    Steps:
      1. grep "@platform/" packages/ apps/ --include="*.ts" --include="*.tsx"
    Expected Result: grep 返回空
    Evidence: .sisyphus/evidence/F1-no-platform-imports.txt

  Scenario: Shell modules 已迁移
    Tool: Bash (ls)
    Steps:
      1. ls apps/shell/src/modules
    Expected Result: ls 返回错误或目录不存在
    Evidence: .sisyphus/evidence/F1-shell-modules-empty.txt
  ```
  
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Shell Consumer [YES/NO] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm typecheck` + `pnpm build`. Review for: circular imports, unused imports, console.log in prod. Check no @platform/* references remain.
  
  **QA Scenarios**:
  ```
  Scenario: TypeCheck 通过
    Tool: Bash (pnpm typecheck)
    Steps:
      1. pnpm typecheck
    Expected Result: 命令退出码 0
    Evidence: .sisyphus/evidence/F2-typecheck.txt

  Scenario: Build 通过
    Tool: Bash (pnpm build)
    Steps:
      1. pnpm build
    Expected Result: 命令退出码 0
    Evidence: .sisyphus/evidence/F2-build.txt
  ```
  
  Output: `Build [PASS/FAIL] | TypeCheck [PASS/FAIL] | Imports [N clean/N issues] | VERDICT`

- [ ] F3. **Web Smoke Test** — `unspecified-high`
  Start Shell app (`pnpm dev`). Verify: app starts, login page renders, theme toggle works, 3 pages from each category render (operations/advanced/notifications), API calls work.
  
  **QA Scenarios**:
  ```
  Scenario: Shell 首页可访问
    Tool: Bash (curl)
    Steps:
      1. pnpm dev &
      2. sleep 10
      3. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
    Expected Result: HTTP 状态码 200
    Evidence: .sisyphus/evidence/F3-shell-http.txt

  Scenario: 登录页渲染
    Tool: Playwright (chrome-devtools_take_snapshot)
    Steps:
      1. 启动浏览器，访问 http://localhost:3000/login
      2. take_snapshot
    Expected Result: snapshot 包含登录表单元素（input[type="text"], input[type="password"], button）
    Evidence: .sisyphus/evidence/F3-login-snapshot.txt

  Scenario: 用户管理页可访问
    Tool: Playwright (chrome-devtools_navigate_page + take_snapshot)
    Steps:
      1. 导航到 http://localhost:3000/users（需先登录或 mock auth）
      2. take_snapshot
    Expected Result: snapshot 包含表格元素或页面内容
    Evidence: .sisyphus/evidence/F3-users-snapshot.txt
  ```
  
  Output: `Shell [START/FAIL] | Pages [N/N render] | Theme [WORK/FAIL] | API [WORK/FAIL] | VERDICT`

- [ ] F4. **RN Smoke Test** — `unspecified-high`
  Start mobile app (`pnpm dev:mobile`). Verify: app starts, StorageAdapter injection works (write/read test), Auth flow works.
  
  **QA Scenarios**:
  ```
  Scenario: Mobile 可启动
    Tool: Bash (PowerShell)
    Steps:
      1. cd E:\nebula-portal && pnpm dev:mobile
      2. 等待 Expo 启动
    Expected Result: Expo DevTools 正常显示
    Evidence: .sisyphus/evidence/F4-mobile-start.txt

  Scenario: StorageAdapter 接口定义存在
    Tool: Bash (findstr - Windows)
    Steps:
      1. findstr /s "interface StorageAdapter" packages\core\src\*.ts
    Expected Result: 找到 StorageAdapter 接口定义
    Evidence: .sisyphus/evidence/F4-storage-interface.txt

  Scenario: RN 注入实现存在
    Tool: Bash (findstr - Windows)
    Steps:
      1. findstr /s "AsyncStorage" apps\mobile\src\*.tsx apps\mobile\src\*.ts
    Expected Result: 在 apps/mobile 中找到 AsyncStorage 引用（注入点）
    Evidence: .sisyphus/evidence/F4-rn-injection.txt
  ```
  
  Output: `Mobile [START/FAIL] | Storage [WORK/FAIL] | Auth [WORK/FAIL] | VERDICT`

---

## Commit Strategy

**Phase 1 (包重命名)**: `refactor: rename packages to @nebula/*`（1 commit）
**Phase 2 (联邦删除)**: `refactor: remove federation configuration and demo-business`（1 commit）
**Phase 3 (包合并)**: `refactor: merge theme→tokens, mobile-core→core`（2 commits）
**Phase 4 (新建包)**: `feat: create tokens, pages-web, pages-mobile packages`（3 commits）
**Phase 5 (Shell 迁移)**: `refactor: migrate Shell assets to shared packages`（多个 commits，按模块分组）

---

## Success Criteria

### Verification Commands
```bash
pnpm build          # Expected: all packages build successfully
pnpm typecheck      # Expected: no TypeScript errors
pnpm dev            # Expected: Shell app starts on port 3000
pnpm dev:mobile     # Expected: Mobile app starts
grep "@platform/"   # Expected: returns empty (no old imports)
ls packages/theme   # Expected: error (package deleted)
ls packages/mobile-core  # Expected: error (package deleted)
ls apps/demo-business    # Expected: error (app deleted)
```

### Final Checklist
- [ ] All packages renamed to @nebula/*
- [ ] No @platform/* references in codebase
- [ ] theme and mobile-core packages deleted
- [ ] demo-business app deleted
- [ ] pages-web contains 19 pages
- [ ] pages-mobile contains minimal setup
- [ ] Shell is consumer (modules migrated to shared packages)
- [ ] Web app (Shell) starts and renders pages
- [ ] RN app (Mobile) starts with StorageAdapter injection
- [ ] pnpm build passes
- [ ] pnpm typecheck passes