# NeFileUploader

## 提供的功能

- 提供统一的拖拽上传能力
- 支持文件大小限制、上传回调和已上传文件展示
- 内部复用 `NeFileCard` 显示上传结果
- 适合对接 Nebula Storage 的上传任务流程或其他自定义上传服务

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `NeFileCardFile[]` | 当前文件列表 |
| `accept` | `string` | 文件类型限制 |
| `multiple` | `boolean` | 是否允许多文件 |
| `maxCount` | `number` | 最大文件数 |
| `maxSize` | `number` | 单文件最大大小，单位字节 |
| `emptyTitle` | `string` | 上传区域主文案 |
| `helperText` | `ReactNode` | 上传提示文案 |
| `onChange` | `(files) => void` | 文件列表变更时触发 |
| `onUpload` | `(file) => Promise<NeFileCardFile>` | 自定义上传逻辑 |
| `onPreview` | `(file) => void` | 预览回调 |
| `onDownload` | `(file) => void` | 下载回调 |

## 示例

```tsx
import { useState } from "react";
import { NeFileUploader } from "@platform/ui";

export function DemoUploader() {
  const [files, setFiles] = useState([]);

  return <NeFileUploader value={files} onChange={setFiles} onUpload={async (file) => ({ id: String(Date.now()), fileName: file.name })} />;
}
```

## Nebula Storage 接入提示

- 如果使用 Nebula Storage，建议在 `onUpload` 中串联：创建上传任务、上传普通文件、完成上传、绑定业务、查询正式文件详情
- 绑定业务时至少要传入 `sourceEntity` 和 `sourceId`
