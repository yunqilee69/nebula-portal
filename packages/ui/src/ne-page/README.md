# NePage

## 提供的功能

- 提供统一的页面标题区布局
- 支持页面标题、副标题和右侧扩展操作区
- 用于包裹页面主体内容，形成标准页面结构

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 页面主标题，显示在顶部左侧 |
| `subtitle` | `string` | 页面副标题，用于补充说明当前页面用途 |
| `extra` | `ReactNode` | 页面头部右侧扩展内容，常用于放按钮、状态信息、筛选操作 |
| `children` | `ReactNode` | 页面主体内容 |
| `className` | `string` | 自定义类名，会追加到默认的 `ne-page` 类上 |

## 怎么用

- 适合用于列表页、详情页、配置页、首页概览页等完整页面容器
- 一般作为页面最外层组件使用，内部再组合 `NePanel`、表格、表单等内容

## 示例

```tsx
import { Button, Space } from "antd";
import { NePage, NeStatusTag } from "@platform/ui";

export function DemoPage() {
  return (
    <NePage
      title="用户管理"
      subtitle="统一维护平台用户信息和状态"
      extra={
        <Space>
          <NeStatusTag tone="processing" label="运行中" />
          <Button type="primary">新增用户</Button>
        </Space>
      }
    >
      <div>这里放页面主体内容</div>
    </NePage>
  );
}
```
