# NeWorkspaceTabs

## 提供的功能

- 提供统一的工作台页签栏
- 支持切换、关闭与右键临时重命名页签

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `items` | `NeWorkspaceTabItem[]` | 页签项列表 |
| `activeKey` | `string` | 当前激活的页签 key |
| `onChange` | `(key: string) => void` | 切换页签时触发 |
| `onClose` | `(key: string) => void` | 关闭页签时触发 |
| `onRename` | `(key: string, label?: string) => void` | 右键重命名页签时触发，传空则恢复默认名称 |

## 示例

```tsx
import { NeWorkspaceTabs } from "@platform/ui";

<NeWorkspaceTabs
  activeKey="/platform/storage"
  items={[{ key: "/platform/storage", label: "存储中心" }]}
/>
```
