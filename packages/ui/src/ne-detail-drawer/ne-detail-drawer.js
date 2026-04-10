import { jsx as _jsx } from "react/jsx-runtime";
import { Drawer } from "antd";
/**
 * Nebula standard detail drawer used to show read-only record information without leaving the current page.
 */
export function NeDetailDrawer({ title, open, onClose, width = 420, children }) {
    return (_jsx(Drawer, { title: title, open: open, onClose: onClose, width: width, children: children }));
}
