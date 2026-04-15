# NeFileCard

## 提供的功能

- 提供统一的文件卡片展示
- 支持图片缩略图、文件大小、预览、下载、删除动作

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `file` | `NeFileCardFile` | 文件数据 |
| `extra` | `ReactNode` | 额外操作区 |
| `onPreview` | `(file) => void` | 点击预览时触发 |
| `onDownload` | `(file) => void` | 点击下载时触发 |
| `onRemove` | `(file) => void` | 点击删除时触发 |

## 示例

```tsx
import { NeFileCard } from "@platform/ui";

<NeFileCard file={{ id: "1", fileName: "contract.pdf", extension: "pdf", size: 102400 }} />
```
