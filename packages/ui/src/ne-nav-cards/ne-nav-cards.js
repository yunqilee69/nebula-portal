import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Nebula navigation card grid used for high-visibility entry points such as platform dashboards.
 */
export function NeNavCards({ items }) {
    return (_jsx("div", { className: "ne-card-grid", children: items.map((item) => (_jsxs("button", { className: "ne-nav-card", onClick: item.onClick, type: "button", children: [_jsx("strong", { children: item.title }), _jsx("span", { className: "ne-muted", children: item.description }), item.footer] }, item.key))) }));
}
