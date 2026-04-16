# NeExceptionResult

## 提供的功能

- 提供统一的异常结果页展示
- 支持常见状态码和重试/返回操作

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `status` | `"403" \| "404" \| "500" \| "warning" \| "error" \| "info" \| "success"` | 异常状态 |
| `title` | `string` | 主标题 |
| `subtitle` | `string` | 说明文案 |
| `actionText` | `string` | 按钮文案 |
| `onAction` | `() => void` | 点击操作按钮时触发 |

## 示例

```tsx
import { NeExceptionResult } from "@nebula/ui-web";

<NeExceptionResult status="warning" title="加载失败" subtitle="请稍后重试" actionText="重试" onAction={() => {}} />
```
