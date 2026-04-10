import { jsx as _jsx } from "react/jsx-runtime";
import { Breadcrumb } from "antd";
export function NeBreadcrumbs({ items }) {
    if (items.length === 0) {
        return null;
    }
    return _jsx(Breadcrumb, { className: "ne-breadcrumbs", items: items.map((item) => ({ key: item.key, title: item.title, href: item.href })) });
}
