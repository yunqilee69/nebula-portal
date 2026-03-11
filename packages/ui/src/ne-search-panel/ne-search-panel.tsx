import { Button, Space } from "antd";
import type { ReactNode } from "react";
import { useState } from "react";

export interface NeSearchPanelLabels {
  expand: string;
  collapse: string;
  reset: string;
}

export interface NeSearchPanelProps {
  children: ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
  extra?: ReactNode;
  labels?: NeSearchPanelLabels;
  onReset?: () => void;
  title?: ReactNode;
}

const defaultLabels: NeSearchPanelLabels = {
  expand: "Expand",
  collapse: "Collapse",
  reset: "Reset",
};

export function NeSearchPanel({ children, className, defaultCollapsed = false, extra, labels = defaultLabels, onReset, title }: NeSearchPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const panelClassName = ["ne-search-panel", className].filter(Boolean).join(" ");
  const titleContent = title ? <div className="ne-search-panel__title">{title}</div> : <div />;

  return (
    <section className={panelClassName}>
      <header className="ne-search-panel__header">
        {titleContent}
        <Space size={8}>
          {extra}
          {onReset ? (
            <Button type="text" size="small" onClick={onReset}>
              {labels.reset}
            </Button>
          ) : null}
          <Button type="text" size="small" aria-expanded={!collapsed} onClick={() => setCollapsed((current) => !current)}>
            {collapsed ? labels.expand : labels.collapse}
          </Button>
        </Space>
      </header>
      <div aria-hidden={collapsed} className="ne-search-panel__body" hidden={collapsed}>
        {children}
      </div>
    </section>
  );
}
