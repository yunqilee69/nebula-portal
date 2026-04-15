import { Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { NeEmptyState } from "../ne-empty-state/ne-empty-state";
import { NeFileCard, type NeFileCardFile } from "../ne-file-card/ne-file-card";

export interface NeFileUploaderProps {
  value: NeFileCardFile[];
  accept?: string;
  multiple?: boolean;
  maxCount?: number;
  maxSize?: number;
  emptyTitle?: string;
  helperText?: ReactNode;
  onChange: (files: NeFileCardFile[]) => void;
  onUpload: (file: File) => Promise<NeFileCardFile>;
  onPreview?: (file: NeFileCardFile) => void;
  onDownload?: (file: NeFileCardFile) => void;
}

export function NeFileUploader({
  value,
  accept,
  multiple = true,
  maxCount,
  maxSize,
  emptyTitle = "拖拽文件到这里，或点击上传",
  helperText,
  onChange,
  onUpload,
  onPreview,
  onDownload,
}: NeFileUploaderProps) {
  const uploadFileList = useMemo<UploadFile[]>(() => value.map((file) => ({ uid: file.id, name: file.fileName, status: "done" })), [value]);

  const uploadProps: UploadProps = {
    accept,
    multiple,
    fileList: uploadFileList,
    customRequest: async ({ file, onError, onSuccess }) => {
      try {
        const uploaded = await onUpload(file as File);
        onChange(maxCount ? [...value, uploaded].slice(0, maxCount) : [...value, uploaded]);
        onSuccess?.(uploaded);
      } catch (error) {
        onError?.(error as Error);
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

  return (
    <div className="ne-file-uploader">
      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">+</p>
        <p className="ant-upload-text">{emptyTitle}</p>
        {helperText ? <div className="ant-upload-hint">{helperText}</div> : null}
      </Upload.Dragger>
      {value.length > 0 ? (
        <div className="ne-file-card-grid">
          {value.map((file) => (
            <NeFileCard
              key={file.id}
              file={file}
              onPreview={onPreview}
              onDownload={onDownload}
              onRemove={(current) => onChange(value.filter((item) => item.id !== current.id))}
            />
          ))}
        </div>
      ) : (
        <NeEmptyState title="暂无已上传文件" />
      )}
    </div>
  );
}
