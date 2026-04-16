# NeDict

## 提供的功能

- 只传入字典 `code` 与业务值，即可自动读取应用上下文中的字典数据并完成渲染
- 内置首屏加载、缓存命中、多值拼接、空值占位等通用行为
- 支持按 `value` 或 `itemCode` 匹配，并支持文本/标签两种展示模式

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `dictCode` | `string` | 字典编码 |
| `value` | `string \| number \| Array<string \| number> \| null \| undefined` | 要渲染的业务值；不传时渲染整个字典 |
| `matchBy` | `"value" \| "itemCode"` | 匹配字段，默认按 `value` |
| `variant` | `"text" \| "tag"` | 展示模式，默认 `text` |
| `placeholder` | `ReactNode` | 空值或未命中时的占位内容 |
| `loadingPlaceholder` | `ReactNode` | 加载中的占位内容 |
| `separator` | `string` | 多值文本模式下的分隔符 |
| `preserveUnknownValue` | `boolean` | 未匹配到字典项时是否保留原始值 |
| `render` | `(records, matchedRecords) => ReactNode` | 自定义渲染函数 |

## 怎么用

- 表格列里把状态码渲染成字典标签
- 详情页把枚举值渲染成人类可读文本
- 只传 `dictCode` 时直接渲染该字典的全部项
- 多选字段把多个字典值统一拼接或显示为标签组

## 示例

```tsx
import { NeDict } from "@nebula/ui-web";

export function StatusCell({ value }: { value: string }) {
  return <NeDict dictCode="user_status" value={value} variant="tag" />;
}
```

```tsx
<NeDict dictCode="file_type" value={["pdf", "doc"]} preserveUnknownValue />
```

```tsx
<NeDict dictCode="file_type" variant="tag" />
```
