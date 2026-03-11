# NeStatusTag

## 提供的功能

- 提供统一的状态标签展示
- 对常见状态语义进行封装，方便在各个页面保持一致展示

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `tone` | `"success" \| "processing" \| "warning" \| "error"` | 状态语义类型 |
| `label` | `string` | 标签显示文案 |

## 怎么用

- 适合用于状态列、详情页状态信息、页面头部状态提示
- 建议和业务状态码映射函数搭配使用

## 示例

```tsx
import { NeStatusTag } from "@platform/ui";

export function StatusCell() {
  return <NeStatusTag tone="warning" label="待处理" />;
}
```
