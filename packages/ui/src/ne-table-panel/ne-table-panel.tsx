import { Children } from "react";
import type { ReactNode } from "react";

export interface NeTablePanelProps {
  children: ReactNode;
  className?: string;
  pagination?: ReactNode;
  summary?: ReactNode;
  toolbar?: ReactNode;
}

export function NeTablePanel({ children, className, pagination, summary, toolbar }: NeTablePanelProps) {
  const hasFooter = Boolean(summary || pagination);
  const panelClassName = ["ne-table-panel", hasFooter ? "ne-table-panel--with-footer" : undefined, className].filter(Boolean).join(" ");
  const hasToolbar = Children.count(toolbar) > 0;

  return (
    <section className={panelClassName}>
      {hasToolbar ? <div className="ne-table-panel__toolbar">{toolbar}</div> : null}
      <div className="ne-table-panel__body">{children}</div>
      {hasFooter ? (
        <footer className="ne-table-panel__footer">
          {summary ? <div className="ne-table-panel__summary">{summary}</div> : <div />}
          <div className="ne-table-panel__pagination">{pagination}</div>
        </footer>
      ) : null}
    </section>
  );
}
