import type { DataNode, TreeProps } from "antd/es/tree";
import type { CSSProperties, Key, ReactNode } from "react";
type NeTreeKeyField<TNode> = {
    [TKey in keyof TNode]-?: TNode[TKey] extends string | number ? TKey : never;
}[keyof TNode];
type NeTreeTitleField<TNode> = {
    [TKey in keyof TNode]-?: TNode[TKey] extends string | number | undefined | null ? TKey : never;
}[keyof TNode];
type NeTreeChildrenField<TNode> = {
    [TKey in keyof TNode]-?: Exclude<TNode[TKey], undefined | null> extends ReadonlyArray<TNode> ? TKey : never;
}[keyof TNode];
type NeTreeFieldNames<TNode> = {
    key: NeTreeKeyField<TNode>;
    title: NeTreeTitleField<TNode>;
    children: NeTreeChildrenField<TNode>;
};
type NeTreeCheckedKeys = Exclude<TreeProps["checkedKeys"], undefined>;
export interface NeTreeProps<TNode extends object> {
    treeData: TNode[];
    fieldNames?: Partial<NeTreeFieldNames<TNode>>;
    renderTitle?: (node: TNode) => ReactNode;
    filterNode?: (node: TNode, keyword: string) => boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    emptyText?: ReactNode;
    className?: string;
    style?: CSSProperties;
    height?: number;
    blockNode?: boolean;
    checkable?: boolean;
    selectable?: boolean;
    multiple?: boolean;
    showIcon?: boolean;
    selectedKeys?: Key[];
    checkedKeys?: NeTreeCheckedKeys;
    expandedKeys?: Key[];
    defaultExpandAll?: boolean;
    autoExpandParent?: boolean;
    onSelect?: TreeProps<NeTreeDataNode<TNode>>["onSelect"];
    onCheck?: TreeProps<NeTreeDataNode<TNode>>["onCheck"];
    onExpand?: TreeProps<NeTreeDataNode<TNode>>["onExpand"];
}
interface NeTreeDataNode<TNode extends object> extends DataNode {
    rawNode: TNode;
    children?: NeTreeDataNode<TNode>[];
}
export declare function NeTree<TNode extends object>({ treeData, fieldNames, renderTitle, filterNode, searchable, searchPlaceholder, searchValue, onSearchChange, emptyText, className, style, height, blockNode, checkable, selectable, multiple, showIcon, selectedKeys, checkedKeys, expandedKeys, defaultExpandAll, autoExpandParent, onSelect, onCheck, onExpand, }: NeTreeProps<TNode>): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ne-tree.d.ts.map