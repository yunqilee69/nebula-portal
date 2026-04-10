import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Space } from "antd";
import { useState } from "react";
const defaultLabels = {
    expand: "Expand",
    collapse: "Collapse",
    reset: "Reset",
};
export function NeSearchPanel({ children, className, defaultCollapsed = false, extra, labels = defaultLabels, onReset, title }) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const panelClassName = ["ne-search-panel", className].filter(Boolean).join(" ");
    const titleContent = title ? _jsx("div", { className: "ne-search-panel__title", children: title }) : _jsx("div", {});
    return (_jsxs("section", { className: panelClassName, children: [_jsxs("header", { className: "ne-search-panel__header", children: [titleContent, _jsxs(Space, { size: 8, children: [extra, onReset ? (_jsx(Button, { type: "text", size: "small", onClick: onReset, children: labels.reset })) : null, _jsx(Button, { type: "text", size: "small", "aria-expanded": !collapsed, onClick: () => setCollapsed((current) => !current), children: collapsed ? labels.expand : labels.collapse })] })] }), _jsx("div", { "aria-hidden": collapsed, className: "ne-search-panel__body", hidden: collapsed, children: children })] }));
}
