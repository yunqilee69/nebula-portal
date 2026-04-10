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
export declare function NeModal(props: NeModalProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-modal.d.ts.map