import { jsx as _jsx } from "react/jsx-runtime";
import { Button, Result } from "antd";
export function NeExceptionResult({ status = "info", title, subtitle, actionText, onAction }) {
    return (_jsx(Result, { className: "ne-exception-result", status: status, title: title, subTitle: subtitle, extra: actionText && onAction ? _jsx(Button, { onClick: onAction, children: actionText }) : undefined }));
}
