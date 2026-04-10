import type { PaginationProps } from "antd";
export declare const DEFAULT_PAGE_SIZE_OPTIONS: readonly [10, 20, 50];
export interface NePaginationConfig {
    pageSizeOptions?: PaginationProps["pageSizeOptions"];
}
export declare function getPaginationConfig(config?: NePaginationConfig): Pick<PaginationProps, "pageSizeOptions" | "showSizeChanger">;
//# sourceMappingURL=pagination.d.ts.map