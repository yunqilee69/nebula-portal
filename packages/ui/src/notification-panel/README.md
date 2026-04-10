# NotificationPanel

通知面板组件，用于显示系统通知和公告。

## 使用方式

```tsx
import { NotificationPanel } from "@nebula/ui-web";
import { markNotificationRead } from "@/api/notify-api";

function MyComponent() {
  return (
    <NotificationPanel
      onMarkRead={markNotificationRead}
    />
  );
}
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| onMarkRead | (id: string) => Promise<void> | - | 标记通知已读的回调函数 |

## 依赖

- `@nebula/core` - 提供 `useNotifyStore` 和 `useResourceStore`
- `@nebula/ui-web` - 提供 `NeModal` 组件
