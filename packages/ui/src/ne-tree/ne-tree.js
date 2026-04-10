import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Empty, Input, Tree } from "antd";
import { useEffect, useMemo, useState } from "react";
const defaultFieldNames = {
    key: "id",
    title: "name",
    children: "children",
};
function collectExpandableKeys(nodes) {
    const keys = [];
    for (const node of nodes) {
        if (node.children?.length) {
            keys.push(node.key, ...collectExpandableKeys(node.children));
        }
    }
    return keys;
}
function getNodeValue(node, field) {
    return node[field];
}
function toDisplayText(value) {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number") {
        return String(value);
    }
    return "";
}
function normalizeExpandedKeys(expandedKeys, children) {
    for (const child of children) {
        expandedKeys.add(child.key);
        if (child.children?.length) {
            normalizeExpandedKeys(expandedKeys, child.children);
        }
    }
}
function buildTreeNodes(nodes, resolvedFieldNames, renderTitle) {
    return nodes.map((node) => {
        const keyValue = getNodeValue(node, resolvedFieldNames.key);
        const childrenValue = getNodeValue(node, resolvedFieldNames.children);
        const childNodes = Array.isArray(childrenValue)
            ? buildTreeNodes(childrenValue, resolvedFieldNames, renderTitle)
            : undefined;
        return {
            key: typeof keyValue === "string" || typeof keyValue === "number" ? keyValue : String(keyValue),
            title: renderTitle ? renderTitle(node) : toDisplayText(getNodeValue(node, resolvedFieldNames.title)),
            rawNode: node,
            children: childNodes,
        };
    });
}
function filterTreeNodes(nodes, keyword, matcher, expandedKeys) {
    return nodes.flatMap((node) => {
        const children = filterTreeNodes(node.children ?? [], keyword, matcher, expandedKeys);
        const matched = matcher(node.rawNode, keyword);
        if (!matched && children.length === 0) {
            return [];
        }
        if (matched && node.children?.length) {
            expandedKeys.add(node.key);
            normalizeExpandedKeys(expandedKeys, node.children);
            return [node];
        }
        if (children.length > 0) {
            expandedKeys.add(node.key);
            normalizeExpandedKeys(expandedKeys, children);
        }
        return [{ ...node, children }];
    });
}
export function NeTree({ treeData, fieldNames, renderTitle, filterNode, searchable = false, searchPlaceholder, searchValue, onSearchChange, emptyText, className, style, height, blockNode = true, checkable = false, selectable = true, multiple = false, showIcon = false, selectedKeys, checkedKeys, expandedKeys, defaultExpandAll = true, autoExpandParent, onSelect, onCheck, onExpand, }) {
    const [internalSearchValue, setInternalSearchValue] = useState("");
    const resolvedFieldNames = {
        key: (fieldNames?.key ?? defaultFieldNames.key),
        title: (fieldNames?.title ?? defaultFieldNames.title),
        children: (fieldNames?.children ?? defaultFieldNames.children),
    };
    const currentSearchValue = searchValue ?? internalSearchValue;
    const normalizedKeyword = currentSearchValue.trim().toLowerCase();
    const treeNodes = useMemo(() => buildTreeNodes(treeData, resolvedFieldNames, renderTitle), [renderTitle, resolvedFieldNames, treeData]);
    const defaultExpandedKeys = useMemo(() => (defaultExpandAll ? collectExpandableKeys(treeNodes) : []), [defaultExpandAll, treeNodes]);
    const [internalExpandedKeys, setInternalExpandedKeys] = useState(defaultExpandedKeys);
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
                expandedKeys: undefined,
            };
        }
        const matcher = filterNode ??
            ((node, keyword) => toDisplayText(getNodeValue(node, resolvedFieldNames.title)).toLowerCase().includes(keyword));
        const derivedExpandedKeys = new Set();
        return {
            treeNodes: filterTreeNodes(treeNodes, normalizedKeyword, matcher, derivedExpandedKeys),
            expandedKeys: Array.from(derivedExpandedKeys),
        };
    }, [filterNode, normalizedKeyword, resolvedFieldNames.title, treeNodes]);
    const baseExpandedKeys = expandedKeys ?? internalExpandedKeys;
    const mergedExpandedKeys = filteredState.expandedKeys
        ? Array.from(new Set([...baseExpandedKeys, ...filteredState.expandedKeys]))
        : baseExpandedKeys;
    const computedAutoExpandParent = autoExpandParent ?? Boolean(normalizedKeyword);
    const mergedClassName = className ? `ne-tree ${className}` : "ne-tree";
    const hasData = filteredState.treeNodes.length > 0;
    return (_jsxs("div", { className: mergedClassName, style: style, children: [searchable ? (_jsx("div", { className: "ne-tree__search", children: _jsx(Input, { allowClear: true, value: currentSearchValue, placeholder: searchPlaceholder, onChange: (event) => {
                        const nextValue = event.target.value;
                        if (searchValue === undefined) {
                            setInternalSearchValue(nextValue);
                        }
                        onSearchChange?.(nextValue);
                    } }) })) : null, _jsx("div", { className: "ne-tree__body", children: hasData ? (_jsx(Tree, { blockNode: blockNode, checkable: checkable, selectable: selectable, multiple: multiple, showIcon: showIcon, height: height, treeData: filteredState.treeNodes, selectedKeys: selectedKeys, checkedKeys: checkedKeys, expandedKeys: mergedExpandedKeys, autoExpandParent: computedAutoExpandParent, onSelect: onSelect, onCheck: onCheck, onExpand: (keys, info) => {
                        if (expandedKeys === undefined) {
                            setInternalExpandedKeys(keys);
                        }
                        onExpand?.(keys, info);
                    } })) : (_jsx("div", { className: "ne-tree__empty", children: _jsx(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: emptyText }) })) })] }));
}
