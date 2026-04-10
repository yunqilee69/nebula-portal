import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function NePage({ title, subtitle, extra, children, className }) {
    const pageClassName = ["ne-page", className].filter(Boolean).join(" ");
    const hasHeader = Boolean(title || subtitle || extra);
    return (_jsxs("section", { className: pageClassName, children: [hasHeader ? (_jsxs("header", { style: {
                    display: "flex",
                    alignItems: "start",
                    justifyContent: "space-between",
                    gap: 16,
                }, children: [_jsxs("div", { children: [title ? _jsx("h1", { style: { margin: 0, fontSize: 24 }, children: title }) : null, subtitle ? _jsx("p", { style: { margin: title ? "8px 0 0" : 0, color: "var(--shell-text-muted, #667085)" }, children: subtitle }) : null] }), extra] })) : null, children] }));
}
