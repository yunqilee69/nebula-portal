import { Card } from "antd";
import type { ReactNode } from "react";

/**
 * Props accepted by {@link NePanel}.
 */
export interface NePanelProps {
  /**
   * Title displayed in the card header.
   */
  title: string;
  /**
   * Optional header actions rendered on the right side of the card header.
   */
  extra?: ReactNode;
  /**
   * Card body content.
   */
  children: ReactNode;
  /**
   * Optional custom class name applied to the underlying Ant Design card.
   */
  className?: string;
}

/**
 * Standard Nebula content panel used to group related page content inside a shared card surface.
 */
export function NePanel({ title, extra, children, className }: NePanelProps) {
  return (
    <Card
      className={className}
      title={title}
      extra={extra}
      variant="borderless"
      style={{ boxShadow: "var(--shell-shadow, 0 10px 30px rgba(15, 23, 42, 0.06))" }}
    >
      {children}
    </Card>
  );
}
