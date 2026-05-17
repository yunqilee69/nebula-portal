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
      className={["ne-panel", className].filter(Boolean).join(" ")}
      title={title}
      extra={extra}
      variant="borderless"
    >
      {children}
    </Card>
  );
}
