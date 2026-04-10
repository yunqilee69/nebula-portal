import { jsx as _jsx } from "react/jsx-runtime";
import { Tag } from "antd";
/**
 * Nebula status tag used to display concise state labels with consistent semantic colors.
 */
export function NeStatusTag({ tone, label }) {
    return _jsx(Tag, { color: tone, children: label });
}
