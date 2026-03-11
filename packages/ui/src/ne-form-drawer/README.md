# NeFormDrawer

## 提供的功能

- 提供统一的表单抽屉容器
- 内置右上角主操作按钮，适用于新增、编辑场景
- 支持提交中加载态和自定义按钮文案

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 抽屉标题 |
| `open` | `boolean` | 控制抽屉显示和隐藏 |
| `onClose` | `() => void` | 关闭抽屉时触发 |
| `onSubmit` | `() => void` | 点击右上角主按钮时触发，通常用于提交表单 |
| `submitting` | `boolean` | 是否显示提交中的加载状态 |
| `width` | `number` | 抽屉宽度，默认 `420` |
| `submitText` | `string` | 提交按钮文案，默认 `Save` |
| `children` | `ReactNode` | 抽屉内部表单内容 |

## 怎么用

- 配合 Ant Design 的 `Form` 使用最合适
- 推荐把表单放在 `children` 中，把保存逻辑放在 `onSubmit`

## 示例

```tsx
import { Form, Input } from "antd";
import { useState } from "react";
import { NeFormDrawer } from "@platform/ui";

export function UserEditor() {
  const [open, setOpen] = useState(true);

  return (
    <NeFormDrawer
      title="新增用户"
      open={open}
      onClose={() => setOpen(false)}
      onSubmit={() => {
      }}
      submitText="保存"
    >
      <Form layout="vertical">
        <Form.Item label="用户名" name="username">
          <Input />
        </Form.Item>
      </Form>
    </NeFormDrawer>
  );
}
```
