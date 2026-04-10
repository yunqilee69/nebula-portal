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
export declare function NeWorkspaceTabs({ items, activeKey, onChange, onClose, onRefresh, onCloseOthers, onRename, menuLabels, }: NeWorkspaceTabsProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=ne-workspace-tabs.d.ts.map