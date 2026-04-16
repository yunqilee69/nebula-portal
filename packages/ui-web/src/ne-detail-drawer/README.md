# NeDetailDrawer

## 提供的功能

- 提供统一的详情抽屉容器
- 用于展示只读信息，不打断当前页面上下文
- 适合查看记录详情、配置信息、说明信息

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 抽屉标题 |
| `open` | `boolean` | 控制抽屉显示和隐藏 |
| `onClose` | `() => void` | 关闭抽屉时触发 |
| `width` | `number` | 抽屉宽度，默认 `420` |
| `children` | `ReactNode` | 抽屉内部详情内容 |

## 怎么用

- 一般配合 `Descriptions`、文本块、状态标签等只读内容使用
- 适合用于“查看详情”场景，而不是编辑场景

## 示例

```tsx
import { Descriptions } from "antd";
import { NeDetailDrawer, NeStatusTag } from "@nebula/ui-web";

export function UserDetailDrawer() {
  return (
    <NeDetailDrawer title="用户详情" open={true} onClose={() => {}}>
      <Descriptions column={1}>
        <Descriptions.Item label="用户名">nebula</Descriptions.Item>
        <Descriptions.Item label="状态">
          <NeStatusTag tone="success" label="启用" />
        </Descriptions.Item>
      </Descriptions>
    </NeDetailDrawer>
  );
}
```
