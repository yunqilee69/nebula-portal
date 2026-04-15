import { Button, Space, Tag, Typography } from "antd";
import type { ReactNode } from "react";

export interface NeFileCardFile {
  id: string;
  fileName: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  contentType?: string;
  extension?: string;
  size?: number;
  createdAt?: string;
}

export interface NeFileCardProps {
  file: NeFileCardFile;
  extra?: ReactNode;
  onPreview?: (file: NeFileCardFile) => void;
  onDownload?: (file: NeFileCardFile) => void;
  onRemove?: (file: NeFileCardFile) => void;
}

function formatSize(size?: number) {
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

export function NeFileCard({ file, extra, onPreview, onDownload, onRemove }: NeFileCardProps) {
  const isImage = file.contentType?.startsWith("image/") || Boolean(file.previewUrl || file.thumbnailUrl);

  return (
    <article className="ne-file-card">
      <div className="ne-file-card__preview">
        {isImage ? (
          <img alt={file.fileName} src={file.thumbnailUrl ?? file.previewUrl} />
        ) : (
          <div className="ne-file-card__icon">
            {file.contentType?.includes("pdf") ? "PDF" : isImage ? "IMG" : "FILE"}
          </div>
        )}
      </div>
      <div className="ne-file-card__meta">
        <Typography.Text strong ellipsis={{ tooltip: file.fileName }}>
          {file.fileName}
        </Typography.Text>
        <Space size={[8, 8]} wrap>
          {file.extension ? <Tag>{file.extension.toUpperCase()}</Tag> : null}
          <Typography.Text type="secondary">{formatSize(file.size)}</Typography.Text>
        </Space>
        <Typography.Text type="secondary">{file.createdAt ?? ""}</Typography.Text>
      </div>
      <div className="ne-file-card__actions">
        {extra}
        {onPreview ? <Button onClick={() => onPreview(file)} type="text">预览</Button> : null}
        {onDownload ? <Button onClick={() => onDownload(file)} type="text">下载</Button> : null}
        {onRemove ? <Button danger onClick={() => onRemove(file)} type="text">删除</Button> : null}
      </div>
    </article>
  );
}
