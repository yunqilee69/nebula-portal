# @platform/ui

Nebula 中台前端共享 UI 组件包。

该包用于沉淀可复用的平台级组件，统一命名规范、交互体验和视觉风格，供 Shell、业务子应用、模板工程直接复用。

## 使用方式

所有共享组件统一从 `@platform/ui` 导入：

```tsx
import { NePage, NePanel, NeStatusTag } from "@platform/ui";
```

## 组件列表

- `NePage`：`packages/ui/src/ne-page/README.md`
- `NePanel`：`packages/ui/src/ne-panel/README.md`
- `NeFormDrawer`：`packages/ui/src/ne-form-drawer/README.md`
- `NeModal`：`packages/ui/src/ne-modal/README.md`
- `NeDetailDrawer`：`packages/ui/src/ne-detail-drawer/README.md`
- `NeBreadcrumbs`：`packages/ui/src/ne-breadcrumbs/README.md`
- `NeWorkspaceTabs`：`packages/ui/src/ne-workspace-tabs/README.md`
- `NeEmptyState`：`packages/ui/src/ne-empty-state/README.md`
- `NeExceptionResult`：`packages/ui/src/ne-exception-result/README.md`
- `NeFileCard`：`packages/ui/src/ne-file-card/README.md`
- `NeFileUploader`：`packages/ui/src/ne-file-uploader/README.md`
- `NeNavCards`：`packages/ui/src/ne-nav-cards/README.md`
- `NeTree`：`packages/ui/src/ne-tree/README.md`
- `NeStatusTag`：`packages/ui/src/ne-status-tag/README.md`

## 样式说明

- 组件包内部会自动引入 `nebula.css`
- 共享样式由 `@platform/ui` 自己提供，不再依赖 Shell 私有样式文件
- 组件样式会优先使用 Nebula 平台定义的 CSS 变量，例如 `--shell-primary`、`--shell-border`、`--shell-radius`

## 推荐使用规范

- 通用页面容器优先使用 `NePage`
- 页面中的内容分区优先使用 `NePanel`
- 新增、编辑弹层优先使用 `NeModal`
- 居中的业务弹层优先使用 `NeModal`
- 只读详情弹层优先使用 `NeDetailDrawer`
- 页面级导航优先使用 `NeBreadcrumbs` 和 `NeWorkspaceTabs`
- 空态和异常页优先使用 `NeEmptyState` 和 `NeExceptionResult`
- 文件上传和文件展示优先使用 `NeFileUploader` 和 `NeFileCard`
- 平台级入口导航优先使用 `NeNavCards`
- 树形层级展示优先使用 `NeTree`
- 状态文本统一使用 `NeStatusTag`

这样可以保证不同业务模块在视觉、交互和命名层面保持一致。
