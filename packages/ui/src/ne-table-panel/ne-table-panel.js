import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, cloneElement, isValidElement } from "react";
import { getPaginationConfig } from "../pagination";
function isTableLikeElement(node) {
    if (!isValidElement(node)) {
        return false;
    }
    return "columns" in node.props && "dataSource" in node.props;
}
function resolveRowSelection(rowSelection) {
    if (!rowSelection) {
        return undefined;
    }
    if (rowSelection === true) {
        return {};
    }
    return rowSelection;
}
function enhanceTableContent(children, rowSelection) {
    if (Children.count(children) !== 1 || !isTableLikeElement(children)) {
        return children;
    }
    const tableClassName = ["ne-table-panel__table", children.props.className].filter(Boolean).join(" ");
    const scroll = children.props.scroll?.y == null ? { ...children.props.scroll, y: "100%" } : children.props.scroll;
    const resolvedRowSelection = resolveRowSelection(rowSelection);
    return cloneElement(children, {
        className: tableClassName,
        rowSelection: resolvedRowSelection,
        scroll,
    });
}
function isPaginationLikeElement(node) {
    if (!isValidElement(node)) {
        return false;
    }
    return "onChange" in node.props && ("current" in node.props || "pageSize" in node.props || "total" in node.props);
}
function enhancePagination(pagination, pageSizeOptions) {
    if (!isPaginationLikeElement(pagination)) {
        return pagination;
    }
    const resolvedPageSizeOptions = pagination.props.pageSizeOptions ?? pageSizeOptions;
    return cloneElement(pagination, {
        ...getPaginationConfig({ pageSizeOptions: resolvedPageSizeOptions }),
        showSizeChanger: pagination.props.showSizeChanger ?? true,
    });
}
export function NeTablePanel({ children, className, pagination, pageSizeOptions, rowSelection = false, summary, toolbar }) {
    const hasFooter = Boolean(summary || pagination);
    const panelClassName = ["ne-table-panel", hasFooter ? "ne-table-panel--with-footer" : undefined, className].filter(Boolean).join(" ");
    const hasToolbar = Children.count(toolbar) > 0;
    const content = enhanceTableContent(children, rowSelection);
    const enhancedPagination = enhancePagination(pagination, pageSizeOptions);
    return (_jsxs("section", { className: panelClassName, children: [hasToolbar ? _jsx("div", { className: "ne-table-panel__toolbar", children: toolbar }) : null, _jsx("div", { className: "ne-table-panel__body", children: content }), hasFooter ? (_jsxs("footer", { className: "ne-table-panel__footer", children: [summary ? _jsx("div", { className: "ne-table-panel__summary", children: summary }) : _jsx("div", {}), _jsx("div", { className: "ne-table-panel__pagination", children: enhancedPagination })] })) : null] }));
}
