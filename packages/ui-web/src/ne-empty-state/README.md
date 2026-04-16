# NeEmptyState

## 提供的功能

- 提供统一的空态占位组件
- 支持标题、说明和扩展操作区

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 空态主文案 |
| `description` | `string` | 空态说明文案 |
| `extra` | `ReactNode` | 空态附加操作区 |

## 示例

```tsx
import { Button } from "antd";
import { NeEmptyState } from "@nebula/ui-web";

<NeEmptyState title="暂无文件" extra={<Button type="primary">立即上传</Button>} />
```
