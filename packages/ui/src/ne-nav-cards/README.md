# NeNavCards

## 提供的功能

- 提供统一的导航卡片宫格
- 适合在首页、工作台、平台入口页中快速展示可跳转功能
- 支持标题、说明、点击事件和底部扩展区

## 参数说明

### items

类型：`NeNavCardItem[]`

每一项包含以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `key` | `string` | 列表唯一标识 |
| `title` | `string` | 卡片标题 |
| `description` | `string` | 卡片说明 |
| `onClick` | `() => void` | 点击卡片时触发 |
| `footer` | `ReactNode` | 卡片底部扩展内容，可选 |

## 怎么用

- 常用于平台首页导航、模块入口导航、工作台功能入口
- 推荐配合路由跳转或业务动作触发使用

## 示例

```tsx
import { useNavigate } from "react-router-dom";
import { NeNavCards, NeStatusTag } from "@platform/ui";

export function PortalNav() {
  const navigate = useNavigate();

  return (
    <NeNavCards
      items={[
        {
          key: "menu",
          title: "菜单管理",
          description: "维护平台菜单、路由和权限编码",
          onClick: () => navigate("/operations/menu"),
          footer: <NeStatusTag tone="processing" label="推荐" />,
        },
      ]}
    />
  );
}
```
