import { Empty } from "antd";
import type { ReactNode } from "react";

export interface NeEmptyStateProps {
  title?: string;
  description?: string;
  extra?: ReactNode;
}

export function NeEmptyState({ title = "暂无数据", description, extra }: NeEmptyStateProps) {
  return <Empty className="ne-empty-state" description={description ?? title} image={Empty.PRESENTED_IMAGE_SIMPLE}>{extra}</Empty>;
}
