import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Dropdown, Input, Modal, Tabs } from "antd";
import { useEffect, useState } from "react";
const defaultMenuLabels = {
    refresh: "Refresh",
    rename: "Rename",
    closeCurrent: "Close current",
    closeOthers: "Close others",
    renameDialogTitle: "Rename tab",
    renameInputPlaceholder: "Enter a temporary tab name",
    renameConfirm: "Confirm",
    renameCancel: "Cancel",
};
export function NeWorkspaceTabs({ items, activeKey, onChange, onClose, onRefresh, onCloseOthers, onRename, menuLabels = defaultMenuLabels, }) {
    const [renamingKey, setRenamingKey] = useState();
    const [renameValue, setRenameValue] = useState("");
    const renamingItem = items.find((item) => item.key === renamingKey);
    useEffect(() => {
        if (renamingKey && !renamingItem) {
            setRenamingKey(undefined);
            setRenameValue("");
        }
    }, [renamingItem, renamingKey]);
    if (items.length === 0) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx(Tabs, { hideAdd: true, className: "ne-workspace-tabs", type: "editable-card", activeKey: activeKey, items: items.map((item) => ({
                    key: item.key,
                    label: (_jsx(Dropdown, { trigger: ["contextMenu"], menu: {
                            items: [
                                { key: "refresh", label: menuLabels.refresh },
                                { key: "rename", label: menuLabels.rename },
                                { key: "closeCurrent", label: menuLabels.closeCurrent, disabled: item.closable === false },
                                { key: "closeOthers", label: menuLabels.closeOthers },
                            ],
                            onClick: ({ key }) => {
                                if (key === "refresh") {
                                    onRefresh?.(item.key);
                                    return;
                                }
                                if (key === "rename") {
                                    setRenamingKey(item.key);
                                    setRenameValue(item.label);
                                    return;
                                }
                                if (key === "closeCurrent") {
                                    onClose?.(item.key);
                                    return;
                                }
                                if (key === "closeOthers") {
                                    onCloseOthers?.(item.key);
                                }
                            },
                        }, children: _jsx("span", { className: "ne-workspace-tabs__label", children: item.label }) })),
                    closable: item.closable !== false,
                })), onChange: onChange, onEdit: (targetKey, action) => {
                    if (action === "remove" && typeof targetKey === "string") {
                        onClose?.(targetKey);
                    }
                } }), _jsx(Modal, { title: menuLabels.renameDialogTitle, open: Boolean(renamingItem), okText: menuLabels.renameConfirm, cancelText: menuLabels.renameCancel, onOk: () => {
                    if (!renamingItem) {
                        return;
                    }
                    onRename?.(renamingItem.key, renameValue);
                    setRenamingKey(undefined);
                    setRenameValue("");
                }, onCancel: () => {
                    setRenamingKey(undefined);
                    setRenameValue("");
                }, children: _jsx(Input, { autoFocus: true, allowClear: true, value: renameValue, placeholder: menuLabels.renameInputPlaceholder, onChange: (event) => setRenameValue(event.target.value), onPressEnter: () => {
                        if (!renamingItem) {
                            return;
                        }
                        onRename?.(renamingItem.key, renameValue);
                        setRenamingKey(undefined);
                        setRenameValue("");
                    } }) })] }));
}
