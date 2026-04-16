# NePanel

## 提供的功能

- 提供统一的卡片面板容器
- 自带平台统一阴影和卡片样式
- 支持标题区和右侧扩展操作

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 面板标题 |
| `extra` | `ReactNode` | 面板头部右侧扩展内容 |
| `children` | `ReactNode` | 面板主体内容 |
| `className` | `string` | 透传到卡片容器的自定义类名 |

## 怎么用

- 适合承载列表、图表、表单区块、描述信息区块
- 常作为 `NePage` 内部的二级布局容器使用

## 示例

```tsx
import { Button, Table } from "antd";
import { NePanel } from "@nebula/ui-web";

export function UserTablePanel() {
  return (
    <NePanel title="用户列表" extra={<Button>刷新</Button>}>
      <Table rowKey="id" dataSource={[]} columns={[]} />
    </NePanel>
  );
}
```
