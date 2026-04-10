import { jsx as _jsx } from "react/jsx-runtime";
import { Empty } from "antd";
export function NeEmptyState({ title = "暂无数据", description, extra }) {
    return _jsx(Empty, { className: "ne-empty-state", description: description ?? title, image: Empty.PRESENTED_IMAGE_SIMPLE, children: extra });
}
