import { Dropdown, Tabs } from "antd";

export interface NeWorkspaceTabMenuLabels {
  refresh: string;
  closeCurrent: string;
  closeOthers: string;
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
  menuLabels?: NeWorkspaceTabMenuLabels;
}

const defaultMenuLabels: NeWorkspaceTabMenuLabels = {
  refresh: "Refresh",
  closeCurrent: "Close current",
  closeOthers: "Close others",
};

export function NeWorkspaceTabs({ items, activeKey, onChange, onClose, onRefresh, onCloseOthers, menuLabels = defaultMenuLabels }: NeWorkspaceTabsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
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
                { key: "closeCurrent", label: menuLabels.closeCurrent, disabled: item.closable === false },
                { key: "closeOthers", label: menuLabels.closeOthers },
              ],
              onClick: ({ key }) => {
                if (key === "refresh") {
                  onRefresh?.(item.key);
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
  );
}
