import type { ReactNode } from "react";
/**
 * Props accepted by {@link NeDetailDrawer}.
 */
export interface NeDetailDrawerProps {
    /**
     * Drawer title displayed in the header area.
     */
    title: string;
    /**
     * Controls whether the drawer is visible.
     */
    open: boolean;
    /**
     * Called when the drawer should close.
     */
    onClose: () => void;
    /**
     * Drawer width in pixels. Defaults to `420`.
     */
    width?: number;
    /**
     * Detail content rendered inside the drawer body.
     */
    children: ReactNode;
}
/**
 * Nebula standard detail drawer used to show read-only record information without leaving the current page.
 */
export declare function NeDetailDrawer({ title, open, onClose, width, children }: NeDetailDrawerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ne-detail-drawer.d.ts.map