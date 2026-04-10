import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ApartmentOutlined, BankOutlined, TeamOutlined } from "@ant-design/icons";
import { Space, Typography } from "antd";
import { useI18n } from "@nebula/core";
import { NeTree } from "@nebula/ui-web";
import { useEffect, useMemo, useState } from "react";
function getOrganizationTypeLabel(type, t) {
    if (type === "DEPARTMENT") {
        return t("organization.typeDepartment");
    }
    if (type === "TEAM") {
        return t("organization.typeTeam");
    }
    return t("organization.typeCompany");
}
function getOrganizationIcon(type) {
    if (type === "COMPANY") {
        return _jsx(BankOutlined, {});
    }
    if (type === "DEPARTMENT") {
        return _jsx(ApartmentOutlined, {});
    }
    return _jsx(TeamOutlined, {});
}
function renderHighlightedText(text, keyword) {
    if (!text) {
        return "-";
    }
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
        return text;
    }
    const normalizedText = text.toLowerCase();
    const matchIndex = normalizedText.indexOf(normalizedKeyword);
    if (matchIndex < 0) {
        return text;
    }
    const start = text.slice(0, matchIndex);
    const match = text.slice(matchIndex, matchIndex + keyword.trim().length);
    const end = text.slice(matchIndex + keyword.trim().length);
    return (_jsxs(_Fragment, { children: [start, _jsx("mark", { className: "organization-tree__highlight", children: match }), end] }));
}
function filterOrganizationTree(nodes, keyword) {
    if (!keyword.trim()) {
        return nodes;
    }
    const normalized = keyword.trim().toLowerCase();
    return nodes.flatMap((node) => {
        const children = filterOrganizationTree(node.children ?? [], keyword);
        const matched = [node.name, node.code, node.leader].some((value) => value?.toLowerCase().includes(normalized));
        if (!matched && children.length === 0) {
            return [];
        }
        return [{ ...node, children }];
    });
}
function collectExpandedKeys(nodes) {
    return nodes.flatMap((node) => {
        if (!node.children?.length) {
            return [];
        }
        return [node.id, ...collectExpandedKeys(node.children)];
    });
}
export function OrganizationTree(props) {
    const { className, treeClassName, data, mode = "single", selectedIds = [], checkedIds = [], searchPlaceholder, onSelectIdsChange, onCheckIdsChange } = props;
    const { t } = useI18n();
    const [keyword, setKeyword] = useState("");
    const initialExpandedKeys = useMemo(() => collectExpandedKeys(data), [data]);
    const [expandedKeys, setExpandedKeys] = useState([]);
    useEffect(() => {
        setExpandedKeys(initialExpandedKeys);
    }, [initialExpandedKeys]);
    return (_jsx(NeTree, { className: ["organization-tree", className, treeClassName].filter(Boolean).join(" "), treeData: data, expandedKeys: expandedKeys, onExpand: (keys) => setExpandedKeys(keys), searchable: true, searchValue: keyword, onSearchChange: setKeyword, searchPlaceholder: searchPlaceholder, filterNode: filterOrganizationTreeNode, renderTitle: (node) => (_jsxs("div", { className: "organization-tree__node", children: [_jsxs(Space, { size: 8, className: "organization-tree__node-main", children: [_jsx("span", { className: "organization-tree__node-icon", children: getOrganizationIcon(node.type) }), _jsxs("div", { className: "organization-tree__node-copy", children: [_jsx(Typography.Text, { strong: true, children: renderHighlightedText(node.name, keyword) }), _jsx(Typography.Text, { type: "secondary", className: "organization-tree__node-meta", children: getOrganizationTypeLabel(node.type, t) })] })] }), _jsx(Typography.Text, { type: "secondary", className: "organization-tree__node-code", children: renderHighlightedText(node.code, keyword) })] })), checkable: mode === "multiple", selectable: mode === "single", selectedKeys: mode === "single" ? selectedIds : undefined, checkedKeys: mode === "multiple" ? checkedIds : undefined, onSelect: (keys, info) => {
            if (mode !== "single") {
                return;
            }
            const clickedId = String(info.node.key);
            if (selectedIds[0] === clickedId) {
                onSelectIdsChange?.([]);
                return;
            }
            onSelectIdsChange?.(keys.map(String));
        }, onCheck: (nextCheckedKeys) => {
            if (mode !== "multiple") {
                return;
            }
            onCheckIdsChange?.((Array.isArray(nextCheckedKeys) ? nextCheckedKeys : nextCheckedKeys.checked).map(String));
        }, emptyText: t("common.noData") }));
}
function filterOrganizationTreeNode(node, keyword) {
    const normalized = keyword.trim().toLowerCase();
    return [node.name, node.code, node.leader].some((value) => value?.toLowerCase().includes(normalized));
}
