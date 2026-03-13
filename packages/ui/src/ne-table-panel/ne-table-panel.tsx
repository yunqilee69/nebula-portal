import { Children, cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

export interface NeTablePanelProps {
  children: ReactNode;
  className?: string;
  pagination?: ReactNode;
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
  scroll?: TableLikeScroll;
}

function isTableLikeElement(node: ReactNode): node is ReactElement<TableLikeProps> {
  if (!isValidElement<TableLikeProps>(node)) {
    return false;
  }

  return "columns" in node.props && "dataSource" in node.props;
}

function enhanceTableContent(children: ReactNode) {
  if (Children.count(children) !== 1 || !isTableLikeElement(children)) {
    return children;
  }

  const tableClassName = ["ne-table-panel__table", children.props.className].filter(Boolean).join(" ");
  const scroll = children.props.scroll?.y == null ? { ...children.props.scroll, y: "100%" } : children.props.scroll;

  return cloneElement(children, {
    className: tableClassName,
    scroll,
  });
}

export function NeTablePanel({ children, className, pagination, summary, toolbar }: NeTablePanelProps) {
  const hasFooter = Boolean(summary || pagination);
  const panelClassName = ["ne-table-panel", hasFooter ? "ne-table-panel--with-footer" : undefined, className].filter(Boolean).join(" ");
  const hasToolbar = Children.count(toolbar) > 0;
  const content = enhanceTableContent(children);

  return (
    <section className={panelClassName}>
      {hasToolbar ? <div className="ne-table-panel__toolbar">{toolbar}</div> : null}
      <div className="ne-table-panel__body">{content}</div>
      {hasFooter ? (
        <footer className="ne-table-panel__footer">
          {summary ? <div className="ne-table-panel__summary">{summary}</div> : <div />}
          <div className="ne-table-panel__pagination">{pagination}</div>
        </footer>
      ) : null}
    </section>
  );
}
