import { Button, Space } from "antd";
import type { ReactNode } from "react";
import { useState } from "react";

export interface NeSearchLabels {
  expand: string;
  collapse: string;
  reset: string;
}

export interface NeSearchProps {
  children: ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
  extra?: ReactNode;
  labels?: NeSearchLabels;
  onReset?: () => void;
  title?: ReactNode;
}

const defaultLabels: NeSearchLabels = {
  expand: "Expand",
  collapse: "Collapse",
  reset: "Reset",
};

export function NeSearch({ children, className, defaultCollapsed = false, extra, labels = defaultLabels, onReset, title }: NeSearchProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const panelClassName = ["ne-search", className].filter(Boolean).join(" ");
  const titleContent = title ? <div className="ne-search__title">{title}</div> : <div />;

  return (
    <section className={panelClassName}>
      <header className="ne-search__header">
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
      <div aria-hidden={collapsed} className="ne-search__body" hidden={collapsed}>
        {children}
      </div>
    </section>
  );
}