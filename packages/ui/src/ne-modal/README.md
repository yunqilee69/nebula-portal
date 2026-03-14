# NeModal

## 提供的功能

- 提供统一的居中弹窗容器
- 内置平台统一头部结构，支持标题和可选图标
- 默认提供更适合业务弹层的宽度和内容区高度
- 支持自定义底部内容，适合详情、确认、消息中心等场景

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 弹窗标题 |
| `icon` | `ReactNode` | 标题前的可选图标 |
| `open` | `boolean` | 控制弹窗显示和隐藏 |
| `onClose` | `() => void` | 关闭弹窗时触发 |
| `width` | `number` | 弹窗宽度，默认 `720` |
| `footer` | `ReactNode` | 底部区域内容，默认不显示 |
| `className` | `string` | 透传到弹窗根节点的自定义类名 |
| `bodyHeight` | `number \| string` | 内容区最大高度，默认 `min(72vh, 760px)` |
| `children` | `ReactNode` | 弹窗主体内容 |

## 怎么用

- 适合站内消息中心、确认弹层、只读弹层等居中场景
- 如果弹层主体内容较长，优先通过 `bodyHeight` 控制可滚动区域
- 业务侧只关心内容和底部动作，不必重复处理统一头部结构

## 示例

```tsx
import { Button, Space } from "antd";
import { NeModal } from "@platform/ui";

export function DemoModal() {
  return (
    <NeModal
      title="消息中心"
      open={true}
      onClose={() => {}}
      icon={<span>i</span>}
      footer={
        <Space>
          <Button>关闭</Button>
          <Button type="primary">确认</Button>
        </Space>
      }
    >
      <div>这里放业务内容</div>
    </NeModal>
  );
}
```
