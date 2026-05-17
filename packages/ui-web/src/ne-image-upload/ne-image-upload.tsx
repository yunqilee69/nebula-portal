import CameraOutlined from "@ant-design/icons/CameraOutlined";
import { Avatar, Spin, Upload } from "antd";
import type { UploadProps } from "antd";
import { useState } from "react";

export interface NeImageUploadProps {
  /** 图片 URL，用于回显 */
  value?: string;
  /** 图片 URL 变化回调 */
  onChange?: (url: string) => void;
  /** 上传函数，接收 File 返回 Promise<string>（图片 URL） */
  onUpload: (file: File) => Promise<string>;
  /** 预览形状：圆形(头像)或方形 */
  shape?: "circle" | "square";
  /** 预览尺寸，单位 px，默认 100 */
  size?: number;
  /** 接受的文件类型，默认 'image/*' */
  accept?: string;
  /** 文件大小限制，单位 bytes，默认 5MB */
  maxSize?: number;
  /** 上传提示文案 */
  placeholder?: string;
}

export function NeImageUpload({
  value,
  onChange,
  onUpload,
  shape = "circle",
  size = 100,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  placeholder,
}: NeImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError } = options;
    const uploadFile = file as File;

    // 检查文件大小
    if (maxSize && uploadFile.size > maxSize) {
      const sizeMB = Math.round(maxSize / 1024 / 1024);
      onError?.(new Error(`文件大小不能超过 ${sizeMB}MB`));
      return;
    }

    setUploading(true);
    try {
      const url = await onUpload(uploadFile);
      onChange?.(url);
      onSuccess?.(url);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  const uploadContent = (
    <Spin spinning={uploading}>
      {value ? (
        <Avatar
          src={value}
          size={size}
          shape={shape}
          className="ne-image-upload__avatar"
        >
          {value ? null : "U"}
        </Avatar>
      ) : (
        <Avatar size={size} shape={shape} className="ne-image-upload__avatar">
          <CameraOutlined className="ne-image-upload__icon" style={{ fontSize: size * 0.3 }} />
        </Avatar>
      )}
    </Spin>
  );

  return (
    <div className="ne-image-upload">
      <Upload
        accept={accept}
        showUploadList={false}
        customRequest={handleUpload}
      >
        {uploadContent}
      </Upload>
      <div className="ne-image-upload__hint">
        {value ? "点击更换" : placeholder ?? "点击上传"}
      </div>
    </div>
  );
}
