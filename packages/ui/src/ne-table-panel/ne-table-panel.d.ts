import type { TableProps } from "antd";
import type { ReactNode } from "react";
export type NeTableRowSelection = Exclude<TableProps<unknown>["rowSelection"], undefined>;
export interface NeTablePanelProps {
    children: ReactNode;
    className?: string;
    pagination?: ReactNode;
    pageSizeOptions?: number[];
    rowSelection?: boolean | NeTableRowSelection;
    summary?: ReactNode;
    toolbar?: ReactNode;
}
export declare function NeTablePanel({ children, className, pagination, pageSizeOptions, rowSelection, summary, toolbar }: NeTablePanelProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-table-panel.d.ts.map