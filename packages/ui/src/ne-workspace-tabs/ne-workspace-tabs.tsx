import { Dropdown, Input, Modal, Tabs } from "antd";
import { useEffect, useState } from "react";

export interface NeWorkspaceTabMenuLabels {
  refresh: string;
  rename: string;
  closeCurrent: string;
  closeOthers: string;
  renameDialogTitle: string;
  renameInputPlaceholder: string;
  renameConfirm: string;
  renameCancel: string;
}

export interface NeWorkspaceTabItem {
  key: string;
  label: string;
  closable?: boolean;
}

export interface NeWorkspaceTabsProps {
  items: NeWorkspaceTabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  onClose?: (key: string) => void;
  onRefresh?: (key: string) => void;
  onCloseOthers?: (key: string) => void;
  onRename?: (key: string, label?: string) => void;
  menuLabels?: NeWorkspaceTabMenuLabels;
}

const defaultMenuLabels: NeWorkspaceTabMenuLabels = {
  refresh: "Refresh",
  rename: "Rename",
  closeCurrent: "Close current",
  closeOthers: "Close others",
  renameDialogTitle: "Rename tab",
  renameInputPlaceholder: "Enter a temporary tab name",
  renameConfirm: "Confirm",
  renameCancel: "Cancel",
};

export function NeWorkspaceTabs({
  items,
  activeKey,
  onChange,
  onClose,
  onRefresh,
  onCloseOthers,
  onRename,
  menuLabels = defaultMenuLabels,
}: NeWorkspaceTabsProps) {
  const [renamingKey, setRenamingKey] = useState<string>();
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

  return (
    <>
      <Tabs
        hideAdd
        className="ne-workspace-tabs"
        type="editable-card"
        activeKey={activeKey}
        items={items.map((item) => ({
          key: item.key,
          label: (
            <Dropdown
              trigger={["contextMenu"]}
              menu={{
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
              }}
            >
              <span className="ne-workspace-tabs__label">{item.label}</span>
            </Dropdown>
          ),
          closable: item.closable !== false,
        }))}
        onChange={onChange}
        onEdit={(targetKey, action) => {
          if (action === "remove" && typeof targetKey === "string") {
            onClose?.(targetKey);
          }
        }}
      />
      <Modal
        title={menuLabels.renameDialogTitle}
        open={Boolean(renamingItem)}
        okText={menuLabels.renameConfirm}
        cancelText={menuLabels.renameCancel}
        onOk={() => {
          if (!renamingItem) {
            return;
          }

          onRename?.(renamingItem.key, renameValue);
          setRenamingKey(undefined);
          setRenameValue("");
        }}
        onCancel={() => {
          setRenamingKey(undefined);
          setRenameValue("");
        }}
      >
        <Input
          autoFocus
          allowClear
          value={renameValue}
          placeholder={menuLabels.renameInputPlaceholder}
          onChange={(event) => setRenameValue(event.target.value)}
          onPressEnter={() => {
            if (!renamingItem) {
              return;
            }

            onRename?.(renamingItem.key, renameValue);
            setRenamingKey(undefined);
            setRenameValue("");
          }}
        />
      </Modal>
    </>
  );
}
