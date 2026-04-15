# NeTree

## 提供的功能

- 提供统一的树形内容渲染容器
- 支持单选、多选、勾选、关键字过滤和自定义节点标题
- 适合组织树、菜单树、权限范围树等页面场景

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `treeData` | `TNode[]` | 原始树形数据 |
| `fieldNames` | `Partial<{ key; title; children; }>` | 自定义字段映射，默认使用 `id`、`name`、`children` |
| `renderTitle` | `(node) => ReactNode` | 自定义节点展示内容 |
| `filterNode` | `(node, keyword) => boolean` | 自定义搜索匹配逻辑 |
| `searchable` | `boolean` | 是否显示关键字搜索框 |
| `searchPlaceholder` | `string` | 搜索输入框占位文案 |
| `selectedKeys` | `Key[]` | 当前选中节点 |
| `checkedKeys` | `TreeProps["checkedKeys"]` | 当前勾选节点 |
| `onSelect` | `TreeProps["onSelect"]` | 节点选中回调 |
| `onCheck` | `TreeProps["onCheck"]` | 节点勾选回调 |

## 怎么用

- 组织、菜单、分类等标准树形结构优先使用 `NeTree`
- 页面需要复杂节点内容时，使用 `renderTitle`
- 页面需要搜索树节点时，优先复用组件内置过滤能力

## 示例

```tsx
import { NeTree } from "@platform/ui";

type OrgNode = {
  id: string;
  name: string;
  code: string;
  children?: OrgNode[];
};

export function OrgTreePanel({ items }: { items: OrgNode[] }) {
  return (
    <NeTree<OrgNode>
      treeData={items}
      searchable
      searchPlaceholder="搜索组织名称或编码"
      filterNode={(node, keyword) => [node.name, node.code].some((value) => value.toLowerCase().includes(keyword))}
      onSelect={(keys, info) => {
        const current = info.node.rawNode;
        console.log(keys, current);
      }}
    />
  );
}
```
