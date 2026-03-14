import type { PaginationProps } from "antd";

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export interface NePaginationConfig {
  pageSizeOptions?: PaginationProps["pageSizeOptions"];
}

export function getPaginationConfig(config?: NePaginationConfig): Pick<PaginationProps, "pageSizeOptions" | "showSizeChanger"> {
  return {
    showSizeChanger: true,
    pageSizeOptions: config?.pageSizeOptions ?? [...DEFAULT_PAGE_SIZE_OPTIONS],
  };
}
