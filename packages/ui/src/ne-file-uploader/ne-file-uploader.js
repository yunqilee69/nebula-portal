import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Upload } from "antd";
import { useMemo } from "react";
import { NeEmptyState } from "../ne-empty-state/ne-empty-state";
import { NeFileCard } from "../ne-file-card/ne-file-card";
export function NeFileUploader({ value, accept, multiple = true, maxCount, maxSize, emptyTitle = "拖拽文件到这里，或点击上传", helperText, onChange, onUpload, onPreview, onDownload, }) {
    const uploadFileList = useMemo(() => value.map((file) => ({ uid: file.id, name: file.fileName, status: "done" })), [value]);
    const uploadProps = {
        accept,
        multiple,
        fileList: uploadFileList,
        customRequest: async ({ file, onError, onSuccess }) => {
            try {
                const uploaded = await onUpload(file);
                onChange(maxCount ? [...value, uploaded].slice(0, maxCount) : [...value, uploaded]);
                onSuccess?.(uploaded);
            }
            catch (error) {
                onError?.(error);
            }
        },
        beforeUpload: (file) => {
            if (maxSize && file.size > maxSize) {
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        showUploadList: false,
    };
    return (_jsxs("div", { className: "ne-file-uploader", children: [_jsxs(Upload.Dragger, { ...uploadProps, children: [_jsx("p", { className: "ant-upload-drag-icon", children: "+" }), _jsx("p", { className: "ant-upload-text", children: emptyTitle }), helperText ? _jsx("div", { className: "ant-upload-hint", children: helperText }) : null] }), value.length > 0 ? (_jsx("div", { className: "ne-file-card-grid", children: value.map((file) => (_jsx(NeFileCard, { file: file, onPreview: onPreview, onDownload: onDownload, onRemove: (current) => onChange(value.filter((item) => item.id !== current.id)) }, file.id))) })) : (_jsx(NeEmptyState, { title: "\u6682\u65E0\u5DF2\u4E0A\u4F20\u6587\u4EF6" }))] }));
}
