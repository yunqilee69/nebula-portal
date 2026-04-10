import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Space, Tag, Typography } from "antd";
function formatSize(size) {
    if (!size) {
        return "-";
    }
    if (size < 1024) {
        return `${size} B`;
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
export function NeFileCard({ file, extra, onPreview, onDownload, onRemove }) {
    const isImage = file.contentType?.startsWith("image/") || Boolean(file.previewUrl || file.thumbnailUrl);
    return (_jsxs("article", { className: "ne-file-card", children: [_jsx("div", { className: "ne-file-card__preview", children: isImage ? (_jsx("img", { alt: file.fileName, src: file.thumbnailUrl ?? file.previewUrl })) : (_jsx("div", { className: "ne-file-card__icon", children: file.contentType?.includes("pdf") ? "PDF" : isImage ? "IMG" : "FILE" })) }), _jsxs("div", { className: "ne-file-card__meta", children: [_jsx(Typography.Text, { strong: true, ellipsis: { tooltip: file.fileName }, children: file.fileName }), _jsxs(Space, { size: [8, 8], wrap: true, children: [file.extension ? _jsx(Tag, { children: file.extension.toUpperCase() }) : null, _jsx(Typography.Text, { type: "secondary", children: formatSize(file.size) })] }), _jsx(Typography.Text, { type: "secondary", children: file.createdAt ?? "" })] }), _jsxs("div", { className: "ne-file-card__actions", children: [extra, onPreview ? _jsx(Button, { onClick: () => onPreview(file), type: "text", children: "\u9884\u89C8" }) : null, onDownload ? _jsx(Button, { onClick: () => onDownload(file), type: "text", children: "\u4E0B\u8F7D" }) : null, onRemove ? _jsx(Button, { danger: true, onClick: () => onRemove(file), type: "text", children: "\u5220\u9664" }) : null] })] }));
}
