import type { OrganizationTreeItem } from "@nebula/core";
interface OrganizationTreeProps {
    className?: string;
    treeClassName?: string;
    data: OrganizationTreeItem[];
    mode?: "single" | "multiple";
    selectedIds?: string[];
    checkedIds?: string[];
    searchPlaceholder: string;
    onSelectIdsChange?: (ids: string[]) => void;
    onCheckIdsChange?: (ids: string[]) => void;
}
export declare function OrganizationTree(props: OrganizationTreeProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=organization-tree.d.ts.map