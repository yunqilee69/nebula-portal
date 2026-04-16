# NeBreadcrumbs

## 提供的功能

- 提供统一的平台面包屑导航展示
- 适合放在页面顶部，帮助用户理解当前位置

## 参数说明

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `items` | `NeBreadcrumbItem[]` | 面包屑项列表，包含 `key`、`title`，可选 `href` |

## 示例

```tsx
import { NeBreadcrumbs } from "@nebula/ui-web";

<NeBreadcrumbs
  items={[
    { key: "home", title: "首页", href: "/" },
    { key: "storage", title: "存储中心" },
  ]}
/>
```
