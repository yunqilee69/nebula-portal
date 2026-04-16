# NeFormDrawer

## 状态说明

- 该组件已兼容升级为基于 `NeModal` 渲染
- 推荐新业务直接使用 `NeModal`
- 保留该组件仅用于兼容旧页面，避免一次性改动过大

## 提供的功能

- 提供兼容旧代码的表单弹窗容器
- 内置底部保存、取消按钮，适用于新增、编辑场景
- 支持提交中加载态和自定义按钮文案

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 弹窗标题 |
| `open` | `boolean` | 控制弹窗显示和隐藏 |
| `onClose` | `() => void` | 关闭弹窗时触发 |
| `onSubmit` | `() => void` | 点击底部主按钮时触发，通常用于提交表单 |
| `submitting` | `boolean` | 是否显示提交中的加载状态 |
| `width` | `number` | 弹窗宽度，默认 `420` |
| `submitText` | `string` | 提交按钮文案，默认 `Save` |
| `children` | `ReactNode` | 弹窗内部表单内容 |

## 怎么用

- 配合 Ant Design 的 `Form` 使用最合适
- 推荐把表单放在 `children` 中，把保存逻辑放在 `onSubmit`

## 示例

```tsx
import { Form, Input } from "antd";
import { useState } from "react";
import { NeFormDrawer } from "@nebula/ui-web";

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
