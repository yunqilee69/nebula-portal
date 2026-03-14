import { Modal, Space, Typography } from "antd";
import type { ReactNode } from "react";

export interface NeModalProps {
  title: string;
  icon?: ReactNode;
  open: boolean;
  onClose: () => void;
  width?: number;
  footer?: ReactNode;
  className?: string;
  bodyHeight?: number | string;
  children: ReactNode;
}

export function NeModal({
  title,
  icon,
  open,
  onClose,
  width = 720,
  footer = null,
  className,
  bodyHeight = "min(72vh, 760px)",
  children,
}: NeModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={footer}
      centered
      width={width}
      title={
        <Space size={10} align="center" className="ne-modal__title">
          {icon ? <span className="ne-modal__title-icon">{icon}</span> : null}
          <Typography.Text strong>{title}</Typography.Text>
        </Space>
      }
      className={className}
    >
      <div className="ne-modal__body" style={{ maxHeight: bodyHeight }}>
        {children}
      </div>
    </Modal>
  );
}
