import { Empty, Input, Tree } from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";
import { useEffect, useMemo, useState } from "react";
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

const defaultFieldNames = {
  key: "id",
  title: "name",
  children: "children",
} as const;

function collectExpandableKeys<TNode extends object>(nodes: NeTreeDataNode<TNode>[]) {
  const keys: Key[] = [];

  for (const node of nodes) {
    if (node.children?.length) {
      keys.push(node.key, ...collectExpandableKeys(node.children));
    }
  }

  return keys;
}

function getNodeValue<TNode extends object>(node: TNode, field: keyof TNode) {
  return node[field];
}

function toDisplayText(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}

function normalizeExpandedKeys(expandedKeys: Set<Key>, children: NeTreeDataNode<object>[]) {
  for (const child of children) {
    expandedKeys.add(child.key);
    if (child.children?.length) {
      normalizeExpandedKeys(expandedKeys, child.children as NeTreeDataNode<object>[]);
    }
  }
}

function buildTreeNodes<TNode extends object>(
  nodes: TNode[],
  resolvedFieldNames: NeTreeFieldNames<TNode>,
  renderTitle: ((node: TNode) => ReactNode) | undefined,
): NeTreeDataNode<TNode>[] {
  return nodes.map((node) => {
    const keyValue = getNodeValue(node, resolvedFieldNames.key);
    const childrenValue = getNodeValue(node, resolvedFieldNames.children);
    const childNodes = Array.isArray(childrenValue)
      ? buildTreeNodes(childrenValue as TNode[], resolvedFieldNames, renderTitle)
      : undefined;

    return {
      key: typeof keyValue === "string" || typeof keyValue === "number" ? keyValue : String(keyValue),
      title: renderTitle ? renderTitle(node) : toDisplayText(getNodeValue(node, resolvedFieldNames.title)),
      rawNode: node,
      children: childNodes,
    } satisfies NeTreeDataNode<TNode>;
  });
}

function filterTreeNodes<TNode extends object>(
  nodes: NeTreeDataNode<TNode>[],
  keyword: string,
  matcher: (node: TNode, normalizedKeyword: string) => boolean,
  expandedKeys: Set<Key>,
): NeTreeDataNode<TNode>[] {
  return nodes.flatMap((node) => {
    const children: NeTreeDataNode<TNode>[] = filterTreeNodes(node.children ?? [], keyword, matcher, expandedKeys);
    const matched = matcher(node.rawNode, keyword);

    if (!matched && children.length === 0) {
      return [];
    }

    if (matched && node.children?.length) {
      expandedKeys.add(node.key);
      normalizeExpandedKeys(expandedKeys, node.children as NeTreeDataNode<object>[]);
      return [node];
    }

    if (children.length > 0) {
      expandedKeys.add(node.key);
      normalizeExpandedKeys(expandedKeys, children as NeTreeDataNode<object>[]);
    }

    return [{ ...node, children } satisfies NeTreeDataNode<TNode>];
  });
}

export function NeTree<TNode extends object>({
  treeData,
  fieldNames,
  renderTitle,
  filterNode,
  searchable = false,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  emptyText,
  className,
  style,
  height,
  blockNode = true,
  checkable = false,
  selectable = true,
  multiple = false,
  showIcon = false,
  selectedKeys,
  checkedKeys,
  expandedKeys,
  defaultExpandAll = true,
  autoExpandParent,
  onSelect,
  onCheck,
  onExpand,
}: NeTreeProps<TNode>) {
  const [internalSearchValue, setInternalSearchValue] = useState("");
  const resolvedFieldNames: NeTreeFieldNames<TNode> = {
    key: (fieldNames?.key ?? defaultFieldNames.key) as NeTreeKeyField<TNode>,
    title: (fieldNames?.title ?? defaultFieldNames.title) as NeTreeTitleField<TNode>,
    children: (fieldNames?.children ?? defaultFieldNames.children) as NeTreeChildrenField<TNode>,
  };
  const currentSearchValue = searchValue ?? internalSearchValue;
  const normalizedKeyword = currentSearchValue.trim().toLowerCase();

  const treeNodes = useMemo(
    () => buildTreeNodes(treeData, resolvedFieldNames, renderTitle),
    [renderTitle, resolvedFieldNames, treeData],
  );
  const defaultExpandedKeys = useMemo(() => (defaultExpandAll ? collectExpandableKeys(treeNodes) : []), [defaultExpandAll, treeNodes]);
  const [internalExpandedKeys, setInternalExpandedKeys] = useState<Key[]>(defaultExpandedKeys);

  useEffect(() => {
    if (expandedKeys !== undefined) {
      return;
    }

    setInternalExpandedKeys((current) => {
      if (defaultExpandedKeys.length === 0) {
        return [];
      }

      if (current.length === 0) {
        return defaultExpandedKeys;
      }

      const allowedKeys = new Set(defaultExpandedKeys);
      const nextKeys = current.filter((key) => allowedKeys.has(key));

      return nextKeys.length === current.length ? current : nextKeys;
    });
  }, [defaultExpandedKeys, expandedKeys]);

  const filteredState = useMemo(() => {
    if (!normalizedKeyword) {
      return {
        treeNodes,
        expandedKeys: undefined as Key[] | undefined,
      };
    }

    const matcher =
      filterNode ??
      ((node: TNode, keyword: string) => toDisplayText(getNodeValue(node, resolvedFieldNames.title)).toLowerCase().includes(keyword));
    const derivedExpandedKeys = new Set<Key>();

    return {
      treeNodes: filterTreeNodes(treeNodes, normalizedKeyword, matcher, derivedExpandedKeys),
      expandedKeys: Array.from(derivedExpandedKeys),
    };
  }, [filterNode, normalizedKeyword, resolvedFieldNames.title, treeNodes]);

  const baseExpandedKeys = expandedKeys ?? internalExpandedKeys;
  const mergedExpandedKeys = filteredState.expandedKeys
    ? Array.from(new Set<Key>([...baseExpandedKeys, ...filteredState.expandedKeys]))
    : baseExpandedKeys;
  const computedAutoExpandParent = autoExpandParent ?? Boolean(normalizedKeyword);
  const mergedClassName = className ? `ne-tree ${className}` : "ne-tree";
  const hasData = filteredState.treeNodes.length > 0;

  return (
    <div className={mergedClassName} style={style}>
      {searchable ? (
        <div className="ne-tree__search">
          <Input
            allowClear
            value={currentSearchValue}
            placeholder={searchPlaceholder}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (searchValue === undefined) {
                setInternalSearchValue(nextValue);
              }
              onSearchChange?.(nextValue);
            }}
          />
        </div>
      ) : null}
      <div className="ne-tree__body">
        {hasData ? (
          <Tree<NeTreeDataNode<TNode>>
            blockNode={blockNode}
            checkable={checkable}
            selectable={selectable}
            multiple={multiple}
            showIcon={showIcon}
            height={height}
            treeData={filteredState.treeNodes}
            selectedKeys={selectedKeys}
            checkedKeys={checkedKeys}
            expandedKeys={mergedExpandedKeys}
            autoExpandParent={computedAutoExpandParent}
            onSelect={onSelect}
            onCheck={onCheck}
            onExpand={(keys, info) => {
              if (expandedKeys === undefined) {
                setInternalExpandedKeys(keys);
              }
              onExpand?.(keys, info);
            }}
          />
        ) : (
          <div className="ne-tree__empty">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
          </div>
        )}
      </div>
    </div>
  );
}
