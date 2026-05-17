# NeImageUpload

单图片上传组件，支持圆形/方形预览。上传逻辑由调用方通过 `onUpload` prop 提供。

## 功能

- 图片上传与预览回显
- 圆形预览（头像场景）或方形预览
- 内置文件大小限制
- 灵活的上传逻辑（由调用方控制）

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `string` | 图片 URL，用于回显 |
| `onChange` | `(url: string) => void` | 图片 URL 变化回调 |
| `onUpload` | `(file: File) => Promise<string>` | 上传函数，返回图片 URL |
| `shape` | `'circle' \| 'square'` | 预览形状，默认 `circle` |
| `size` | `number` | 预览尺寸，单位 px，默认 100 |
| `accept` | `string` | 接受的文件类型，默认 `image/*` |
| `maxSize` | `number` | 文件大小限制，单位 bytes，默认 5MB |
| `placeholder` | `string` | 上传提示文案 |

## 示例

```tsx
import { NeImageUpload } from "@nebula/ui-web";
import { useState } from "react";
import { uploadStorageFile } from "@nebula/pages-web/api/storage-api";

export function AvatarEditor() {
  const [avatarUrl, setAvatarUrl] = useState<string>();

  async function handleUpload(file: File): Promise<string> {
    const result = await uploadStorageFile({
      file,
      sourceEntity: "user-avatar",
      sourceId: crypto.randomUUID(),
    });
    return result.fileUrl ?? result.previewUrl ?? "";
  }

  return (
    <NeImageUpload
      value={avatarUrl}
      onChange={setAvatarUrl}
      onUpload={handleUpload}
      shape="circle"
      size={100}
    />
  );
}
```

## 设计约束

- 上传占位图标使用 Ant Design SVG 图标，不使用 emoji，避免跨平台渲染差异。
- 颜色、边框和提示文案优先使用 `nebula.css` 中的 `--nebula-*` 变量。
