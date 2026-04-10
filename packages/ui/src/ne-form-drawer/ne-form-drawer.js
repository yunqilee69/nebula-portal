import { jsx as _jsx } from "react/jsx-runtime";
import { NeModal } from "../ne-modal/ne-modal";
export function NeFormDrawer({ title, open, onClose, onSubmit, submitting = false, width = 420, submitText = "Save", children, }) {
    return (_jsx(NeModal, { title: title, open: open, onClose: onClose, onConfirm: onSubmit, width: width, confirmText: submitText, confirmLoading: submitting, cancelText: "Cancel", children: children }));
}
