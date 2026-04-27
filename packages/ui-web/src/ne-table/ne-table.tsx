import { Children, cloneElement, isValidElement } from "react";
import type { PaginationProps, TableProps } from "antd";
import type { ReactElement, ReactNode } from "react";
import { getPaginationConfig } from "../pagination";

export type NeTableRowSelection = Exclude<TableProps<unknown>["rowSelection"], undefined>;

export interface NeTableProps {
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

  return "columns" in node.props;
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

  const tableClassName = ["ne-table__table", children.props.className].filter(Boolean).join(" ");
  const resolvedRowSelection = resolveRowSelection(rowSelection);

  return cloneElement(children, {
    className: tableClassName,
    rowSelection: resolvedRowSelection,
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

export function NeTable({ children, className, pagination, pageSizeOptions, rowSelection = false, summary, toolbar }: NeTableProps) {
  const hasFooter = Boolean(summary || pagination);
  const panelClassName = ["ne-table", hasFooter ? "ne-table--with-footer" : undefined, className].filter(Boolean).join(" ");
  const hasToolbar = Children.count(toolbar) > 0;
  const content = enhanceTableContent(children, rowSelection);
  const enhancedPagination = enhancePagination(pagination, pageSizeOptions);

  return (
    <section className={panelClassName}>
      {hasToolbar ? <div className="ne-table__toolbar">{toolbar}</div> : null}
      <div className="ne-table__body">{content}</div>
      {hasFooter ? (
        <footer className="ne-table__footer">
          {summary ? <div className="ne-table__summary">{summary}</div> : <div />}
          <div className="ne-table__pagination">{enhancedPagination}</div>
        </footer>
      ) : null}
    </section>
  );
}