# NeModal

## 提供的功能

- 提供统一的居中弹窗容器
- 内置平台统一头部结构，支持标题和可选图标
- 默认提供更适合业务弹层的宽度和内容区高度
- 内置保存、取消等标准底部动作，也支持完全自定义底部内容
- 头部、内容区、尾部采用分区式结构，并使用分割线增强层次感

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 弹窗标题 |
| `icon` | `ReactNode` | 标题前的可选图标 |
| `open` | `boolean` | 控制弹窗显示和隐藏 |
| `onClose` | `() => void` | 关闭弹窗时触发 |
| `onConfirm` | `() => void` | 点击默认主按钮时触发 |
| `width` | `number` | 弹窗宽度，默认 `720` |
| `footer` | `ReactNode` | 自定义底部区域内容；传入后会覆盖默认按钮 |
| `className` | `string` | 透传到弹窗根节点的自定义类名 |
| `bodyHeight` | `number \| string` | 内容区最大高度，默认 `min(72vh, 760px)` |
| `confirmText` | `string` | 默认主按钮文案，默认 `Save` |
| `cancelText` | `string` | 默认取消按钮文案，默认 `Cancel` |
| `confirmLoading` | `boolean` | 默认主按钮加载态 |
| `confirmButtonProps` | `ButtonProps` | 默认主按钮的附加属性 |
| `cancelButtonProps` | `ButtonProps` | 默认取消按钮的附加属性 |
| `children` | `ReactNode` | 弹窗主体内容 |

## 怎么用

- 适合新增、编辑、确认、消息中心等居中场景
- 如果弹层主体内容较长，优先通过 `bodyHeight` 控制可滚动区域
- 表单类弹层优先使用默认按钮能力，避免在业务侧重复写保存、取消按钮
- 默认头部、内容区、尾部已经有清晰分隔，业务侧通常只需要关注内容本身

## 示例

```tsx
import { NeModal } from "@nebula/ui-web";

export function DemoModal() {
  return (
    <NeModal
      title="消息中心"
      open={true}
      onClose={() => {}}
      onConfirm={() => {}}
      icon={<span>i</span>}
      confirmText="确认"
      cancelText="关闭"
    >
      <div>这里放业务内容</div>
    </NeModal>
  );
}
```
