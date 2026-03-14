import { Button, Modal, Space, Typography } from "antd";
import type { ButtonProps } from "antd";
import type { ReactNode } from "react";

export interface NeModalProps {
  title: string;
  icon?: ReactNode;
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  width?: number;
  footer?: ReactNode;
  className?: string;
  bodyHeight?: number | string;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  confirmButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  children: ReactNode;
}

export function NeModal(props: NeModalProps) {
  const {
    title,
    icon,
    open,
    onClose,
    onConfirm,
    width = 720,
    footer = null,
    className,
    bodyHeight = "min(72vh, 760px)",
    confirmText = "Save",
    cancelText = "Cancel",
    confirmLoading = false,
    confirmButtonProps,
    cancelButtonProps,
    children,
  } = props;
  const hasExplicitFooter = Object.prototype.hasOwnProperty.call(props, "footer");
  const resolvedFooter =
    hasExplicitFooter ? footer : onConfirm ? (
      <Space>
        <Button {...cancelButtonProps} onClick={onClose}>
          {cancelText}
        </Button>
        <Button {...confirmButtonProps} type="primary" loading={confirmLoading} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Space>
    ) : null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={resolvedFooter ? <div className="ne-modal__footer">{resolvedFooter}</div> : resolvedFooter}
      centered
      width={width}
      title={
        <div className="ne-modal__header">
          <Space size={10} align="center" className="ne-modal__title">
            {icon ? <span className="ne-modal__title-icon">{icon}</span> : null}
            <Typography.Text strong>{title}</Typography.Text>
          </Space>
        </div>
      }
      className={["ne-modal", className].filter(Boolean).join(" ")}
    >
      <div className={["ne-modal__content", resolvedFooter ? "ne-modal__content--with-footer" : ""].filter(Boolean).join(" ")}>
        <div className="ne-modal__body" style={{ maxHeight: bodyHeight }}>
        {children}
        </div>
      </div>
    </Modal>
  );
}
