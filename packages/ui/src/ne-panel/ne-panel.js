import { jsx as _jsx } from "react/jsx-runtime";
import { Card } from "antd";
/**
 * Standard Nebula content panel used to group related page content inside a shared card surface.
 */
export function NePanel({ title, extra, children, className }) {
    return (_jsx(Card, { className: className, title: title, extra: extra, variant: "borderless", style: { boxShadow: "var(--shell-shadow, 0 10px 30px rgba(15, 23, 42, 0.06))" }, children: children }));
}
