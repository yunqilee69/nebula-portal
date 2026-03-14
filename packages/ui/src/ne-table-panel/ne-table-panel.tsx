import { Children, cloneElement, isValidElement } from "react";
import type { PaginationProps, TableProps } from "antd";
import type { ReactElement, ReactNode } from "react";
import { getPaginationConfig } from "../pagination";

export type NeTableRowSelection = Exclude<TableProps<unknown>["rowSelection"], undefined>;

export interface NeTablePanelProps {
  children: ReactNode;
  className?: string;
  pagination?: ReactNode;
  pageSizeOptions?: number[];
  rowSelection?: boolean | NeTableRowSelection;
  summary?: ReactNode;
  toolbar?: ReactNode;
}

interface TableLikeScroll {
  x?: string | number | true;
  y?: string | number;
}

interface TableLikeProps {
  className?: string;
  columns?: unknown;
  dataSource?: unknown;
  rowSelection?: TableProps<unknown>["rowSelection"];
  scroll?: TableLikeScroll;
}

interface PaginationLikeProps {
  current?: number;
  onChange?: (page: number, pageSize: number) => void;
  pageSize?: number;
  pageSizeOptions?: PaginationProps["pageSizeOptions"];
  showSizeChanger?: boolean;
  total?: number;
}

function isTableLikeElement(node: ReactNode): node is ReactElement<TableLikeProps> {
  if (!isValidElement<TableLikeProps>(node)) {
    return false;
  }

  return "columns" in node.props && "dataSource" in node.props;
}

function resolveRowSelection(rowSelection?: boolean | NeTableRowSelection): TableProps<unknown>["rowSelection"] {
  if (!rowSelection) {
    return undefined;
  }

  if (rowSelection === true) {
    return {};
  }

  return rowSelection;
}

function enhanceTableContent(children: ReactNode, rowSelection?: boolean | NeTableRowSelection) {
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

function isPaginationLikeElement(node: ReactNode): node is ReactElement<PaginationLikeProps> {
  if (!isValidElement<PaginationLikeProps>(node)) {
    return false;
  }

  return "onChange" in node.props && ("current" in node.props || "pageSize" in node.props || "total" in node.props);
}

function enhancePagination(pagination: ReactNode, pageSizeOptions?: number[]) {
  if (!isPaginationLikeElement(pagination)) {
    return pagination;
  }

  const resolvedPageSizeOptions = pagination.props.pageSizeOptions ?? pageSizeOptions;

  return cloneElement(pagination, {
    ...getPaginationConfig({ pageSizeOptions: resolvedPageSizeOptions }),
    showSizeChanger: pagination.props.showSizeChanger ?? true,
  });
}

export function NeTablePanel({ children, className, pagination, pageSizeOptions, rowSelection = false, summary, toolbar }: NeTablePanelProps) {
  const hasFooter = Boolean(summary || pagination);
  const panelClassName = ["ne-table-panel", hasFooter ? "ne-table-panel--with-footer" : undefined, className].filter(Boolean).join(" ");
  const hasToolbar = Children.count(toolbar) > 0;
  const content = enhanceTableContent(children, rowSelection);
  const enhancedPagination = enhancePagination(pagination, pageSizeOptions);

  return (
    <section className={panelClassName}>
      {hasToolbar ? <div className="ne-table-panel__toolbar">{toolbar}</div> : null}
      <div className="ne-table-panel__body">{content}</div>
      {hasFooter ? (
        <footer className="ne-table-panel__footer">
          {summary ? <div className="ne-table-panel__summary">{summary}</div> : <div />}
          <div className="ne-table-panel__pagination">{enhancedPagination}</div>
        </footer>
      ) : null}
    </section>
  );
}
