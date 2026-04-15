# OrganizationTree

组织架构树组件，用于展示和选择组织机构。

## 使用方式

```tsx
import { OrganizationTree } from "@nebula/ui-web";
import type { OrganizationTreeItem } from "@nebula/core";

// 组件会自动从 @nebula/core 获取 i18n 翻译函数
// 需要确保应用已正确配置 I18nProvider

const treeData: OrganizationTreeItem[] = [
  {
    id: "1",
    name: "总公司",
    type: "COMPANY",
    code: "HQ",
    children: [
      { id: "1-1", name: "研发部", type: "DEPARTMENT", code: "DEV" },
      { id: "1-2", name: "产品部", type: "TEAM", code: "PM" },
    ],
  },
];

function MyComponent() {
  return (
    <OrganizationTree
      data={treeData}
      mode="single"
      searchPlaceholder="搜索组织..."
      onSelectIdsChange={(ids) => console.log("选中:", ids)}
    />
  );
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| data | OrganizationTreeItem[] | - | 树形数据 |
| mode | "single" \| "multiple" | "single" | 单选或多选模式 |
| selectedIds | string[] | [] | 当前选中的 ID（单选模式） |
| checkedIds | string[] | [] | 当前勾选的 ID（多选模式） |
| searchPlaceholder | string | - | 搜索框占位文本 |
| onSelectIdsChange | (ids: string[]) => void | - | 选中变化回调（单选模式） |
| onCheckIdsChange | (ids: string[]) => void | - | 勾选变化回调（多选模式） |
| className | string | - | 容器额外类名 |
| treeClassName | string | - | 树形组件额外类名 |

## 依赖

- `@nebula/core` - 提供 `useI18n` 和 `OrganizationTreeItem` 类型
- `@nebula/ui-web` - 提供基础 `NeTree` 组件
