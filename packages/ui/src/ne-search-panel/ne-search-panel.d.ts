import type { ReactNode } from "react";
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
export declare function NeSearchPanel({ children, className, defaultCollapsed, extra, labels, onReset, title }: NeSearchPanelProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-search-panel.d.ts.map